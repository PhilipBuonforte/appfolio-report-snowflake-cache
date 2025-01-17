import { Bind } from "snowflake-sdk";
import { connection } from "./snowflakeClient";

/**
 * Inserts data into a Snowflake table, creating the table if it does not exist.
 * @param data Array of objects to insert (each object is a row).
 * @param tableName The Snowflake table name.
 */
export async function insertDataToSnowflake(
  data: any[],
  tableName: string
): Promise<void> {
  if (data.length === 0) {
    console.log("No data to insert.");
    return;
  }

  // Dynamically build the SQL query
  const keys = Object.keys(data[0]); // Get column names from the first object
  const placeholders = keys.map(() => "?").join(", ");

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

    // Insert the data
    const insertSQL = `INSERT INTO ${tableName} (${keys.join(
      ", "
    )}) VALUES (${placeholders})`;

    await Promise.all(
      data.map(
        (item) =>
          new Promise<void>((resolve, reject) => {
            const binds = Object.values(item) as Bind[]; // Ensure `binds` is a flat array of primitive types
            connection.execute({
              sqlText: insertSQL,
              binds: binds, // Assign the correctly typed `binds` array
              complete: (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              },
            });
          })
      )
    );

    console.log("Data inserted successfully.");
  } catch (error) {
    console.error("Error inserting data into Snowflake:", error);
    throw error;
  }
}
