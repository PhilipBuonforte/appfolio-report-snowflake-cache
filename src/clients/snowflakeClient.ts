import snowflake from "snowflake-sdk";
import { SnowflakeConfig } from "../config/snowflake";
import logger from "../utils/logger";

let connection: snowflake.Connection | null = null;

/**
 * Establish a new Snowflake connection.
 */
export async function connectToSnowflake(): Promise<void> {
  if (connection) {
    logger.warn(
      "[WARN] Existing Snowflake connection found. Destroying and reconnecting."
    );
    await disconnectFromSnowflake(); // Ensure previous connection is closed properly
  }

  connection = snowflake.createConnection({
    account: SnowflakeConfig.account,
    username: SnowflakeConfig.username,
    password: SnowflakeConfig.password,
    database: SnowflakeConfig.database,
    schema: SnowflakeConfig.schema,
    warehouse: SnowflakeConfig.warehouse,
    role: SnowflakeConfig.role,
  });

  return new Promise((resolve, reject) => {
    connection!.connect((err, conn) => {
      if (err) {
        logger.error(`[ERROR] Failed to connect to Snowflake: ${err.message}`, {
          error: err,
        });
        connection = null;
        return reject(err);
      }
      logger.info("[INFO] Successfully connected to Snowflake.");
      resolve();
    });
  });
}

/**
 * Close the active Snowflake connection.
 */
export async function disconnectFromSnowflake(): Promise<void> {
  if (!connection) {
    logger.warn("[WARN] No active Snowflake connection to disconnect.");
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    connection!.destroy((err) => {
      if (err) {
        logger.error(
          `[ERROR] Failed to disconnect from Snowflake: ${err.message}`,
          { error: err }
        );
        return reject(err);
      }
      logger.info("[INFO] Connection to Snowflake closed.");
      connection = null; // Reset connection reference
      resolve();
    });
  });
}

/**
 * Ensures there is an active Snowflake connection
 * @throws Error if connection is null
 */
export function ensureConnection() {
  if (!connection) {
    const error = new Error("Snowflake connection is not initialized");
    logger.error("[ERROR] Snowflake connection error:", { error });
    throw error;
  }
  return connection;
}

// Export the connection for use
export { connection };
