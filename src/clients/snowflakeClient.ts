import snowflake from "snowflake-sdk";
import { SnowflakeConfig } from "../config/snowflake";
import logger from "../utils/logger"; // Import the Winston logger

const connection = snowflake.createConnection({
  account: SnowflakeConfig.account,
  username: SnowflakeConfig.username,
  password: SnowflakeConfig.password,
  database: SnowflakeConfig.database,
  schema: SnowflakeConfig.schema,
  warehouse: SnowflakeConfig.warehouse,
  role: SnowflakeConfig.role,
});

/**
 * Establish a connection to Snowflake using Promises for asynchronous handling.
 * Logs the connection status using Winston.
 */
export function connectToSnowflake(): Promise<void> {
  return new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        logger.error(`[ERROR] Failed to connect to Snowflake: ${err.message}`);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function disconnectFromSnowflake(): Promise<void> {
  return new Promise((resolve, reject) => {
    connection.destroy((err) => {
      if (err) {
        logger.error(
          `[ERROR] Failed to disconnect from Snowflake: ${err.message}`
        );
        reject(err);
      } else {
        logger.info("[INFO] Connection to Snowflake closed.");
        resolve();
      }
    });
  });
}

// Export the Snowflake connection object
export { connection };
