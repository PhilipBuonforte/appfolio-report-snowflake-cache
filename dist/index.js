"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const snowflakeClient_1 = require("./clients/snowflakeClient");
const appfolio_1 = __importDefault(require("./const/appfolio"));
const enum_1 = require("./const/enum");
const appfolioService_1 = require("./services/appfolioService");
const logger_1 = __importDefault(require("./utils/logger")); // Import Winston logger
async function main() {
    try {
        logger_1.default.info("[INFO] Starting the AppFolio data pipeline...");
        // Connect to Snowflake
        logger_1.default.info("[INFO] Connecting to Snowflake...");
        await (0, snowflakeClient_1.connectToSnowflake)();
        logger_1.default.info("[INFO] Successfully connected to Snowflake.");
        // Configuration
        const endpoint = appfolio_1.default.TenantTickler.name;
        const tableName = `appfolio_${appfolio_1.default.TenantTickler.name}`;
        const params = appfolio_1.default.TenantTickler.params;
        const paginated = true; // Fetch paginated results
        const insertMethod = enum_1.SnowFlakeInsertingMethod.BulkInsert;
        const batchSize = 50000; // Batch size for batch inserts
        logger_1.default.info(`[INFO] Configured endpoint: ${endpoint}`);
        logger_1.default.info(`[INFO] Target table: ${tableName}`);
        logger_1.default.info(`[INFO] Insert method: ${insertMethod}`);
        logger_1.default.info(`[INFO] Batch size: ${batchSize}`);
        logger_1.default.info(`[INFO] Paginated fetch: ${paginated}`);
        // Handle AppFolio data
        logger_1.default.info("[INFO] Fetching and inserting AppFolio data...");
        await (0, appfolioService_1.handleAppFolioData)(endpoint, tableName, paginated, insertMethod, batchSize, params);
        logger_1.default.info("[INFO] AppFolio data pipeline completed successfully.");
    }
    catch (err) {
        logger_1.default.error(`[ERROR] Pipeline failed: ${err.message}`, {
            stack: err.stack,
        });
        throw err; // Re-throw the error to allow external monitoring systems to capture it
    }
}
// Start the pipeline
main().catch((err) => {
    logger_1.default.error("[CRITICAL] Unhandled exception in main pipeline.", {
        error: err,
    });
});
