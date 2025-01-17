import { connection } from "../clients/snowflakeClient";
import { Bind } from "snowflake-sdk";

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
    console.log("No data to insert.");
    return;
  }

  const keys = Object.keys(data[0]);
  const placeholders = `(${keys.map(() => "?").join(", ")})`;
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
        complete: (err) => (err ? reject(err) : resolve()),
      });
    });

    // Insert data in batches
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const values = batch.map(() => placeholders).join(", ");
      const insertSQL = `INSERT INTO ${tableName} (${keys.join(", ")}) VALUES ${values}`;
      const binds: Bind[] = batch.flatMap((row) => Object.values(row)) as Bind[];

      await new Promise<void>((resolve, reject) => {
        connection.execute({
          sqlText: insertSQL,
          binds,
          complete: (err) => (err ? reject(err) : resolve()),
        });
      });

      console.log(`Batch inserted: ${i + 1} - ${i + batch.length}`);
    }

    console.log("All data inserted successfully.");
  } catch (error) {
    console.error("Batch insert error:", error);
    throw error;
  }
}