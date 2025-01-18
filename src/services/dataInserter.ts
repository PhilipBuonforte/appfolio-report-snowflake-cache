import { Bind } from "snowflake-sdk";
import { connection } from "../clients/snowflakeClient";
import logger from "../utils/logger"; // Import Winston logger

/**
 * Inserts data into a Snowflake table in batches.
 * @param data Array of objects to insert (each object is a row).
 * @param tableName The Snowflake table name.
 * @param batchSize Number of rows to insert per batch.
 */
export async function insertDataToSnowflake(
  data: any[],
  tableName: string,
  batchSize: number = 5000 // Default batch size
): Promise<void> {
  if (data.length === 0) {
    logger.info("[INFO] No data to insert.");
    return;
  }

  // Dynamically build the SQL query
  const keys = Object.keys(data[0]); // Get column names from the first object
  const placeholders = `(${keys.map(() => "?").join(", ")})`;

  // SQL to create the table if it doesn't exist
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${keys.map((key) => `${key} STRING`).join(", ")}
    );
  `;

  try {
    logger.info(`[INFO] Ensuring table '${tableName}' exists.`);
    logger.debug(`[DEBUG] Executing SQL: ${createTableSQL}`);

    // Ensure the table exists
    await new Promise<void>((resolve, reject) => {
      connection.execute({
        sqlText: createTableSQL,
        complete: (err) => {
          if (err) {
            logger.error(
              `[ERROR] Failed to create or verify table: ${err.message}`
            );
            reject(err);
          } else {
            logger.info(
              `[INFO] Table '${tableName}' checked/created successfully.`
            );
            resolve();
          }
        },
      });
    });

    // Batch the data and insert in chunks
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const values = batch.map(() => placeholders).join(", "); // Combine placeholders for the batch
      const insertSQL = `INSERT INTO ${tableName} (${keys.join(
        ", "
      )}) VALUES ${values}`;

      const binds: Bind[] = batch.flatMap((item) =>
        Object.values(item)
      ) as Bind[]; // Flatten the batch into a single array of binds

      logger.info(
        `[INFO] Inserting batch ${Math.ceil((i + 1) / batchSize)} (Rows: ${
          batch.length
        })...`
      );
      logger.debug(`[DEBUG] Executing SQL: ${insertSQL}`);
      logger.debug(`[DEBUG] Binds: ${JSON.stringify(binds.slice(0, 10))}...`);

      await new Promise<void>((resolve, reject) => {
        connection.execute({
          sqlText: insertSQL,
          binds,
          complete: (err) => {
            if (err) {
              logger.error(`[ERROR] Failed to insert batch: ${err.message}`);
              reject(err);
            } else {
              logger.info(
                `[INFO] Batch inserted successfully: Rows ${i + 1} to ${
                  i + batch.length
                }.`
              );
              resolve();
            }
          },
        });
      });
    }

    logger.info("[INFO] All data inserted successfully.");
  } catch (error: any) {
    logger.error(
      `[ERROR] Error inserting data into Snowflake: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    throw error;
  }
}
