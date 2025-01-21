import { connectToSnowflake } from "./clients/snowflakeClient";
import AppFolioReports from "./const/appfolio";
import { SnowFlakeInsertingMethod } from "./const/enum";
import { handleAppFolioData } from "./services/appfolioService";
import logger from "./utils/logger"; // Import Winston logger

async function main() {
  try {
    logger.info("[INFO] Starting the AppFolio data pipeline...");

    // Connect to Snowflake
    logger.info("[INFO] Connecting to Snowflake...");
    await connectToSnowflake();
    logger.info("[INFO] Successfully connected to Snowflake.");

    // Configuration
    const endpoint = AppFolioReports.TenantTickler.name;
    const tableName = `appfolio_${AppFolioReports.TenantTickler.name}`;
    const params = AppFolioReports.TenantTickler.params;
    const paginated = true; // Fetch paginated results
    const insertMethod: SnowFlakeInsertingMethod =
      SnowFlakeInsertingMethod.BulkInsert;
    const batchSize = 50000; // Batch size for batch inserts

    logger.info(`[INFO] Configured endpoint: ${endpoint}`);
    logger.info(`[INFO] Target table: ${tableName}`);
    logger.info(`[INFO] Insert method: ${insertMethod}`);
    logger.info(`[INFO] Batch size: ${batchSize}`);
    logger.info(`[INFO] Paginated fetch: ${paginated}`);

    // Handle AppFolio data
    logger.info("[INFO] Fetching and inserting AppFolio data...");
    await handleAppFolioData(
      endpoint,
      tableName,
      paginated,
      insertMethod,
      batchSize,
      params
    );
    logger.info("[INFO] AppFolio data pipeline completed successfully.");
  } catch (err: any) {
    logger.error(`[ERROR] Pipeline failed: ${err.message}`, {
      stack: err.stack,
    });
    throw err; // Re-throw the error to allow external monitoring systems to capture it
  }
}

// Start the pipeline
main().catch((err) => {
  logger.error("[CRITICAL] Unhandled exception in main pipeline.", {
    error: err,
  });
});
