import { fetchAppFolioData } from "../clients/appfolioClient";
import { SnowFlakeInsertingMethod } from "../const/enum";
import { OptionalParam } from "../types/OptionalParam";
import { convertToMMDDYYYY } from "../utils/date";
import logger from "../utils/logger";
import { batchInsert } from "./batchInsertService";
import { bulkInsert, removeExistingRecords } from "./bulkInsertService";
import { transformData } from "./dataTransformer";
import {
  dropTable,
  duplicateTable,
  ensureTableExists,
  renameTable,
} from "./snowflakeService";

export async function handleAppFolioData(
  endpoint: string,
  tableName: string,
  paginated: boolean,
  insertMethod: SnowFlakeInsertingMethod,
  batchSize: number = 5000,
  params: Record<string, string | number | boolean | string[]>[] = [],
  optionalParams?: OptionalParam | null
): Promise<void> {
  const stagingTableName = `${tableName}_staging`; // Define the staging table name

  logger.info(`[INFO] Starting data handling for table '${tableName}'.`);
  logger.info(
    `[INFO] Endpoint: ${endpoint}, Paginated: ${paginated}, Insert Method: ${insertMethod}, Batch Size: ${batchSize}`
  );

  if (!Array.isArray(params)) return;
  try {
    if (
      insertMethod === SnowFlakeInsertingMethod.BatchInsert ||
      insertMethod === SnowFlakeInsertingMethod.BulkInsert ||
      (insertMethod === SnowFlakeInsertingMethod.BulkUpsert &&
        optionalParams?.isFirstRun)
    ) {
      await dropTable(stagingTableName);

      for (const param of params) {
        logger.info(`[INFO] Fetching data for param: ${JSON.stringify(param)}`);
        let nextPageUrl: string | null = null;
        // Ensure the staging table exists
        let isFirstBatch = true; // To track the first batch for table creation
        do {
          logger.info(
            `[INFO] Fetching data from AppFolio API. Next page URL: ${
              nextPageUrl || "initial endpoint"
            }`
          );

          // Fetch data from AppFolio API
          const { results, next_page_url } = await fetchAppFolioData(
            nextPageUrl || endpoint,
            param,
            !isFirstBatch
          );

          logger.info(
            `[INFO] Fetched ${results.length} records from AppFolio API.`
          );

          // Transform the data
          const transformedData = transformData(results, endpoint, param);
          logger.debug(
            `[DEBUG] Transformed data: ${JSON.stringify(
              transformedData[0],
              null,
              2
            )} (showing first record)`
          );

          // Ensure the staging table exists (only for the first batch)
          if (isFirstBatch) {
            logger.info(
              `[INFO] Ensuring staging table '${stagingTableName}' exists...`
            );
            await ensureTableExists(
              stagingTableName,
              Object.keys(transformedData[0])
            );
            logger.info(`[INFO] Staging table '${stagingTableName}' is ready.`);
            isFirstBatch = false;
          }

          // Insert data into Snowflake
          if (insertMethod === SnowFlakeInsertingMethod.BatchInsert) {
            logger.info(
              `[INFO] Inserting data into '${stagingTableName}' using Batch Insert.`
            );
            await batchInsert(transformedData, stagingTableName, batchSize);
          } else if (
            insertMethod === SnowFlakeInsertingMethod.BulkInsert ||
            insertMethod === SnowFlakeInsertingMethod.BulkUpsert
          ) {
            logger.info(
              `[INFO] Inserting data into '${stagingTableName}' using Bulk Insert.`
            );
            await bulkInsert(transformedData, stagingTableName);
          }
          logger.info(
            `[INFO] Data inserted into staging table '${stagingTableName}' successfully.`
          );

          // Update the nextPageUrl to continue fetching
          nextPageUrl = next_page_url;
        } while (nextPageUrl);
      }
    } else if (
      insertMethod === SnowFlakeInsertingMethod.BulkUpsert &&
      optionalParams &&
      !optionalParams.isFirstRun
    ) {
      logger.info(
        `[INFO] Handling data for table '${tableName}' using Bulk Upsert.`
      );
      await dropTable(stagingTableName);
      await duplicateTable(tableName, stagingTableName);

      await removeExistingRecords(
        stagingTableName,
        optionalParams["dateField"] as string,
        optionalParams["dateFormat"] as string,
        convertToMMDDYYYY(optionalParams.from),
        convertToMMDDYYYY(optionalParams.to)
      );

      for (const param of params) {
        logger.info(`[INFO] Fetching data for param: ${JSON.stringify(param)}`);

        let nextPageUrl: string | null = null;
        // Ensure the staging table exists
        let isFirstBatch = true; // To track the first batch for table creation

        do {
          logger.info(
            `[INFO] Fetching data from AppFolio API. Next page URL: ${
              nextPageUrl || "initial endpoint"
            }`
          );

          // Fetch data from AppFolio API
          const { results, next_page_url } = await fetchAppFolioData(
            nextPageUrl || endpoint,
            param,
            !isFirstBatch
          );

          logger.info(
            `[INFO] Fetched ${results.length} records from AppFolio API.`
          );

          // Transform the data
          const transformedData = transformData(results, endpoint, param);
          logger.debug(
            `[DEBUG] Transformed data: ${JSON.stringify(
              transformedData[0],
              null,
              2
            )} (showing first record)`
          );

          logger.info(
            `[INFO] Inserting data into '${stagingTableName}' using Bulk Insert.`
          );
          await bulkInsert(transformedData, stagingTableName);

          logger.info(
            `[INFO] Data inserted into staging table '${stagingTableName}' successfully.`
          );

          // Update the nextPageUrl to continue fetching
          nextPageUrl = next_page_url;
        } while (nextPageUrl);
      }
    }

    // Drop the previous table
    logger.info(`[INFO] Dropping the old table '${tableName}'...`);
    await dropTable(tableName);
    logger.info(`[INFO] Old table '${tableName}' dropped successfully.`);

    // Rename the staging table to the original table name
    logger.info(
      `[INFO] Renaming staging table '${stagingTableName}' to '${tableName}'...`
    );
    await renameTable(stagingTableName, tableName);
    logger.info(
      `[INFO] Staging table '${stagingTableName}' renamed to '${tableName}' successfully.`
    );

    logger.info(
      `[INFO] Data handling for table '${tableName}' completed successfully.`
    );
  } catch (error: any) {
    logger.error(
      `[ERROR] Error occurred while handling data for table '${tableName}': ${error.message}`
    );
    throw error; // Re-throw the error for further handling
  }
}
