import { Bind } from "snowflake-sdk";
import { connection } from "../clients/snowflakeClient";

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
    console.log("No data to insert.");
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
    // Ensure the table exists
    await new Promise<void>((resolve, reject) => {
      connection.execute({
        sqlText: createTableSQL,
        complete: (err) => {
          if (err) {
            reject(err);
          } else {
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

      await new Promise<void>((resolve, reject) => {
        connection.execute({
          sqlText: insertSQL,
          binds,
          complete: (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          },
        });
      });

      console.log(`Batch inserted: ${i + 1}-${i + batch.length}`);
    }

    console.log("All data inserted successfully.");
  } catch (error) {
    console.error("Error inserting data into Snowflake:", error);
    throw error;
  }
}
