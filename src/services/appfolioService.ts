import { fetchAppFolioData } from "../clients/appfolioClient";
import { SnowFlakeInsertingMethod } from "../const/enum";
import { batchInsert } from "./batchInsertService";
import { bulkInsert } from "./bulkInsertService";
import { transformData } from "./dataTransformer";
import { dropTable, ensureTableExists, renameTable } from "./snowflakeService";

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

  // Ensure the staging table exists
  let isFirstBatch = true; // To track the first batch for table creation
  do {
    // Fetch data from AppFolio API
    const { results, next_page_url } = await fetchAppFolioData(
      nextPageUrl || endpoint,
      params,
      !isFirstBatch
    );

    console.log("Fetched data:", results);
    console.log("Next page URL:", next_page_url);

    // Transform the data
    const transformedData = transformData(results);

    // Ensure the staging table exists (only for the first batch)
    if (isFirstBatch) {
      await ensureTableExists(
        stagingTableName,
        Object.keys(transformedData[0])
      );
      isFirstBatch = false;
    }

    // Insert data into Snowflake
    if (insertMethod === SnowFlakeInsertingMethod.BatchInsert) {
      await batchInsert(transformedData, stagingTableName, batchSize);
    } else if (insertMethod === SnowFlakeInsertingMethod.BulkInsert) {
      await bulkInsert(transformedData, stagingTableName);
    }

    // Update the nextPageUrl to continue fetching
    nextPageUrl = next_page_url;
  } while (nextPageUrl);

  // Drop the previous table
  await dropTable(tableName);

  // Rename the staging table to the original table name
  await renameTable(stagingTableName, tableName);
}
