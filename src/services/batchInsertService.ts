import { connection } from "../clients/snowflakeClient";
import { Bind } from "snowflake-sdk";
import logger from "../utils/logger"; // Import Winston logger

/**
 * Inserts data into Snowflake in batches.
 * @param data Array of rows to insert.
 * @param tableName Name of the Snowflake table.
 * @param batchSize Number of rows per batch.
 */
export async function batchInsert(
  data: any[],
  tableName: string,
  batchSize: number = 5000
): Promise<void> {
  if (data.length === 0) {
    logger.info("[INFO] No data to insert.");
    return;
  }

  const keys = Object.keys(data[0]); // Extract column names from the first row
  const placeholders = `(${keys.map(() => "?").join(", ")})`; // Placeholder for SQL values
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${keys.map((key) => `${key} STRING`).join(", ")}
    );
  `;

  try {
    // Ensure the table exists
    logger.info(`[INFO] Ensuring table '${tableName}' exists.`);
    logger.debug(`[DEBUG] Executing SQL: ${createTableSQL}`);
    await new Promise<void>((resolve, reject) => {
      connection.execute({
        sqlText: createTableSQL,
        complete: (err) => (err ? reject(err) : resolve()),
      });
    });
    logger.info(`[INFO] Table '${tableName}' checked/created successfully.`);

    // Insert data in batches
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize); // Get the current batch
      const values = batch.map(() => placeholders).join(", "); // Create placeholders for batch
      const insertSQL = `INSERT INTO ${tableName} (${keys.join(
        ", "
      )}) VALUES ${values}`;
      const binds: Bind[] = batch.flatMap((row) =>
        Object.values(row)
      ) as Bind[]; // Flatten the batch into binds

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
          complete: (err) => (err ? reject(err) : resolve()),
        });
      });

      logger.info(
        `[INFO] Batch inserted successfully: Rows ${i + 1} to ${
          i + batch.length
        }.`
      );
    }

    logger.info("[INFO] All data inserted successfully.");
  } catch (error: any) {
    logger.error(`[ERROR] Batch insert failed: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}
