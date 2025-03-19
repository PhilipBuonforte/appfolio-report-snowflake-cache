import {
  connectToSnowflake,
  disconnectFromSnowflake,
} from "./clients/snowflakeClient";
import GenerateAppFolioReports from "./const/appfolio";
import { handleAppFolioData } from "./services/appfolioService";
import { executeSnowflakeProcedure } from "./services/snowflakeService";
import { refreshTableauExtract } from "./services/tableauService";
import logger from "./utils/logger"; // Import Winston logger
import {
  getNextHourMark,
  getTimeUntilNext7AM,
  isWithinAllowedTime,
} from "./utils/time";

let AppFolioReports = GenerateAppFolioReports();

type AppFolioReportKey = keyof typeof AppFolioReports;

/**
 * Process a single report with retry logic
 */
async function processReport(reportKey: AppFolioReportKey, retries = 3) {
  const report = AppFolioReports[reportKey];

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(
        `[INFO] Attempting to process report: ${reportKey} (Attempt ${attempt}/${retries})`
      );

      const endpoint = report.name;
      const tableName = `appfolio_${report.name}`;
      const insertMethod = report.insertMethod;
      const params = report.params;
      const optionalParams = report.optionalParams;
      const paginated = true; // Fetch paginated results
      const batchSize = 50000; // Batch size for batch inserts

      // Handle AppFolio data
      logger.info("[INFO] Fetching and inserting AppFolio data...");
      await handleAppFolioData(
        endpoint,
        tableName,
        paginated,
        insertMethod,
        batchSize,
        params,
        optionalParams
      );

      logger.info(`[INFO] Report ${reportKey} completed successfully.`);
      return; // Exit the retry loop on success
    } catch (err: any) {
      logger.error(
        `[ERROR] Failed to process report ${reportKey} on attempt ${attempt}: ${err.message}`,
        {
          stack: err.stack,
        }
      );

      if (attempt === retries) {
        logger.error(
          `[ERROR] Max retries reached for report ${reportKey}. Skipping...`
        );
        throw err; // Re-throw the error after max retries
      }

      logger.warn(
        `[WARN] Retrying report ${reportKey} (Attempt ${
          attempt + 1
        }/${retries})...`
      );
    }
  }
}

/**
 * Process all reports sequentially
 */
async function processAllReports() {
  AppFolioReports = GenerateAppFolioReports();

  logger.info("[INFO] Starting the AppFolio data pipeline...");

  // Process each report in sequence
  const reportKeys = Object.keys(AppFolioReports) as Array<AppFolioReportKey>;

  for (let i = 0; i < reportKeys.length; i++) {
    const reportKey = reportKeys[i];
    logger.info(
      `[INFO] Starting report ${i + 1}/${reportKeys.length}: ${reportKey}`
    );

    try {
      await processReport(reportKey); // Process each report with retry logic
    } catch (err) {
      logger.error(
        `[CRITICAL] Failed to process report ${reportKey}. Moving to the next report.`
      );
    }
  }

  logger.info("[INFO] All reports processed successfully.");
}

/**
 * Main function to run the pipeline at intervals
 */
async function main() {
  try {
    // Connect to Snowflake
    logger.info("[INFO] Connecting to Snowflake...");
    await connectToSnowflake();
    logger.info("[INFO] Successfully connected to Snowflake.");

    logger.info("[INFO] Starting a new pipeline iteration...");
    await processAllReports(); // Process all reports sequentially

    logger.info(
      "[INFO] Execute stored procedure after reports are processed..."
    );
    await executeSnowflakeProcedure();

    await refreshTableauExtract();

    // Calculate time until next hour mark
    const endTime = new Date();

    // Disconnecting from Snowflake
    logger.info("[INFO] Disconnecting from Snowflake...");
    await disconnectFromSnowflake();
    logger.info("[INFO] Successfully disconnected from Snowflake.");
  } catch (err) {
    logger.error("[CRITICAL] Unhandled exception in the pipeline.", {
      error: err,
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
