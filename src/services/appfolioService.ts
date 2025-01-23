import { fetchAppFolioData } from "../clients/appfolioClient";
import { SnowFlakeInsertingMethod } from "../const/enum";
import { batchInsert } from "./batchInsertService";
import { bulkInsert, generateUniqueFileName, saveToCsv, uploadFilesToSnowFlake } from "./bulkInsertService";
import { transformData } from "./dataTransformer";
import { dropTable, ensureTableExists, renameTable } from "./snowflakeService";
import logger from "../utils/logger";

export async function tryFetchData(
  endpoint: string,
  tableName: string,
  metaDataId: number,
  pageNumber: number
) {
  // Fetch data from AppFolio API
  const { results, next_page_url } = await fetchAppFolioData(
    `/api/v2/reports/${endpoint}.json?metadata_id=${metaDataId}&page=${pageNumber}`,
    {},
    true
  );
  logger.info(`[INFO] Fetched ${results.length} records from AppFolio API.`);

  // Transform the data
  const transformedData = transformData(results);
  logger.debug(
    `[DEBUG] Transformed data: ${JSON.stringify(
      transformedData[0],
      null,
      2
    )} (showing first record)`
  );

  const uniqueFileName = generateUniqueFileName(tableName);

  // Save to CSV
  saveToCsv(transformedData, tableName, uniqueFileName);

  return { next_page_url, uniqueFileName }
}

export async function handleAppFolioData(
  endpoint: string,
  tableName: string,
  paginated: boolean,
  insertMethod: SnowFlakeInsertingMethod,
  batchSize: number = 5000,
  params: Record<string, string | number | boolean> = {}
): Promise<void> {
  const stagingTableName = `${tableName}_staging`; // Define the staging table name
  let nextPageUrl: string | null = null;

  logger.info(`[INFO] Starting data handling for table '${tableName}'.`);
  logger.info(`[INFO] Endpoint: ${endpoint}, Paginated: ${paginated}, Insert Method: ${insertMethod}, Batch Size: ${batchSize}`);

  if (insertMethod === SnowFlakeInsertingMethod.BatchInsert || insertMethod === SnowFlakeInsertingMethod.BulkInsert) {
    try {
      // Ensure the staging table exists
      let isFirstBatch = true; // To track the first batch for table creation

      await dropTable(stagingTableName);

      do {
        logger.info(`[INFO] Fetching data from AppFolio API. Next page URL: ${nextPageUrl || "initial endpoint"}`);

        // Fetch data from AppFolio API
        const { results, next_page_url } = await fetchAppFolioData(
          nextPageUrl || endpoint,
          params,
          !isFirstBatch
        );

        logger.info(`[INFO] Fetched ${results.length} records from AppFolio API.`);

        // Transform the data
        const transformedData = transformData(results);
        logger.debug(
          `[DEBUG] Transformed data: ${JSON.stringify(
            transformedData[0],
            null,
            2
          )} (showing first record)`
        );

        // Ensure the staging table exists (only for the first batch)
        if (isFirstBatch) {
          logger.info(`[INFO] Ensuring staging table '${stagingTableName}' exists...`);
          await ensureTableExists(
            stagingTableName,
            Object.keys(transformedData[0])
          );
          logger.info(`[INFO] Staging table '${stagingTableName}' is ready.`);
          isFirstBatch = false;
        }

        // Insert data into Snowflake
        if (insertMethod === SnowFlakeInsertingMethod.BatchInsert) {
          logger.info(`[INFO] Inserting data into '${stagingTableName}' using Batch Insert.`);
          await batchInsert(transformedData, stagingTableName, batchSize);
        } else if (insertMethod === SnowFlakeInsertingMethod.BulkInsert) {
          logger.info(`[INFO] Inserting data into '${stagingTableName}' using Bulk Insert.`);
          await bulkInsert(transformedData, stagingTableName);
        }
        logger.info(`[INFO] Data inserted into staging table '${stagingTableName}' successfully.`);

        // Update the nextPageUrl to continue fetching
        nextPageUrl = next_page_url;
      } while (nextPageUrl);

      // Drop the previous table
      logger.info(`[INFO] Dropping the old table '${tableName}'...`);
      await dropTable(tableName);
      logger.info(`[INFO] Old table '${tableName}' dropped successfully.`);

      // Rename the staging table to the original table name
      logger.info(`[INFO] Renaming staging table '${stagingTableName}' to '${tableName}'...`);
      await renameTable(stagingTableName, tableName);
      logger.info(`[INFO] Staging table '${stagingTableName}' renamed to '${tableName}' successfully.`);

      logger.info(`[INFO] Data handling for table '${tableName}' completed successfully.`);
    } catch (error: any) {
      logger.error(`[ERROR] Error occurred while handling data for table '${tableName}': ${error.message}`);
      throw error; // Re-throw the error for further handling
    }
  } else if (insertMethod === SnowFlakeInsertingMethod.BulkInsertV2) {
    try {
      await dropTable(stagingTableName);

      logger.info(`[INFO] Fetching data from AppFolio API. Next page URL: ${nextPageUrl || "initial endpoint"}`);

      // Fetch data from AppFolio API
      const { results, next_page_url } = await fetchAppFolioData(
        nextPageUrl || endpoint,
        params,
        false
      );

      logger.info(`[INFO] Fetched ${results.length} records from AppFolio API.`);

      // Transform the data
      const transformedData = transformData(results);
      logger.debug(
        `[DEBUG] Transformed data: ${JSON.stringify(
          transformedData[0],
          null,
          2
        )} (showing first record)`
      );

      logger.info(`[INFO] Ensuring staging table '${stagingTableName}' exists...`);
      await ensureTableExists(
        stagingTableName,
        Object.keys(transformedData[0])
      );
      logger.info(`[INFO] Staging table '${stagingTableName}' is ready.`);

      const uniqueFileName = generateUniqueFileName(tableName);
      saveToCsv(transformedData, stagingTableName, uniqueFileName);
      let csvFileNames = [];
      csvFileNames.push(uniqueFileName);

      if (next_page_url) {
        // Parse the URL
        const urlObj = new URL(`https://appfolio.com${next_page_url}`);

        // Get the metadata_id value
        const metadataId = urlObj.searchParams.get("metadata_id");

        if (!metadataId) {
          throw new Error("metadata_id is missing from the URL.");
        }

        let pageNumber = 1; // Start from page 1
        let stopLoop = false; // Flag to stop the loop
        const chunkCount = 15;

        // Check if metadata_id is present
        do {
          // Create an array of promises for 10 iterations
          const promises = Array.from({ length: chunkCount }, (_, index) => {
            const currentPageNumber = pageNumber + index; // Increment page number for each iteration
            return tryFetchData(endpoint, stagingTableName, Number(metadataId), currentPageNumber);
          });

          // Wait for all promises to resolve
          const results = await Promise.all(promises);

          // Check if any of the results has next_page_url as null
          stopLoop = results.some((result) => result.next_page_url === null);

          csvFileNames.push(...results
            .filter((result) => result.next_page_url !== null)
            .map((result) => result.uniqueFileName)
          );

          await uploadFilesToSnowFlake(csvFileNames, stagingTableName);

          csvFileNames = []

          // Increment the page number for the next batch
          pageNumber += chunkCount;
        } while (!stopLoop);
      }
    } catch (error: any) {
      logger.error(`[ERROR] Error occurred while handling data for table '${tableName}': ${error.message}`);
      throw error; // Re-throw the error for further handling
    }
  }
}
