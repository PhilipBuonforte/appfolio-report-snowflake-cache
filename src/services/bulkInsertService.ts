import { connection } from "../clients/snowflakeClient";
import fs from "fs";
import path from "path";

/**
 * Ensures that the directory for the temporary file exists.
 * @param filePath Path to the file.
 */
function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    console.log(`[INFO] Directory does not exist. Creating: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Inserts data into Snowflake using bulk CSV upload.
 * @param data Array of rows to insert.
 * @param tableName Name of the Snowflake table.
 */
export async function bulkInsert(
  data: any[],
  tableName: string
): Promise<void> {
  if (data.length === 0) {
    console.log("[INFO] No data to insert.");
    return;
  }

  const keys = Object.keys(data[0]); // Column names
  const csvFilePath = path.resolve(__dirname, `../../temp/${tableName}.csv`);
  const normalizedCsvFilePath = csvFilePath.replace(/\\/g, "/"); // Normalize path for Windows

  console.log(`[INFO] Preparing bulk insert for table: ${tableName}`);
  console.log(`[INFO] Keys/Columns: ${keys.join(", ")}`);
  console.log(`[INFO] CSV file path: ${csvFilePath}`);

  // Ensure the directory exists
  ensureDirectoryExists(csvFilePath);

  // Generate CSV content with proper escaping
  const csvContent = [
    keys.join(","), // CSV header
    ...data.map((row) =>
      keys
        .map((key) => {
          const value = row[key];
          if (value == null) return ""; // Handle null/undefined values
          if (typeof value === "string") {
            // Escape special characters
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value; // For non-string values
        })
        .join(",")
    ),
  ].join("\n");

  // Debug: Log sample CSV content
  console.log("[DEBUG] Sample CSV content:");
  console.log(csvContent.split("\n").slice(0, 5).join("\n")); // Log first 5 lines

  // Write to the file
  fs.writeFileSync(csvFilePath, csvContent);
  console.log("[INFO] CSV file written successfully.");

  // Snowflake commands
  const stageName = `@%${tableName}`;
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${keys.map((key) => `${key} STRING`).join(", ")}
    );
  `;
  const putSQL = `PUT 'file://${normalizedCsvFilePath}' ${stageName}`;
  const copySQL = `
    COPY INTO ${tableName}
    FROM ${stageName}
    FILE_FORMAT = (
      TYPE = 'CSV'
      FIELD_OPTIONALLY_ENCLOSED_BY = '"'
      SKIP_HEADER = 1
      NULL_IF = ('')
    );
  `;

  try {
    console.log("[INFO] Ensuring table exists...");
    console.log(`[DEBUG] Executing SQL: ${createTableSQL}`);
    await new Promise<void>((resolve, reject) => {
      connection.execute({
        sqlText: createTableSQL,
        complete: (err) => (err ? reject(err) : resolve()),
      });
    });

    console.log("[INFO] Uploading CSV file to Snowflake stage...");
    console.log(`[DEBUG] Executing SQL: ${putSQL}`);
    await new Promise<void>((resolve, reject) => {
      connection.execute({
        sqlText: putSQL,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error("[ERROR] CSV upload failed:", err);
            reject(err);
          } else {
            console.log(
              `[INFO] CSV uploaded successfully. Rows affected: ${rows}`
            );
            resolve();
          }
        },
      });
    });

    console.log("[INFO] Loading data from stage to Snowflake table...");
    console.log(`[DEBUG] Executing SQL: ${copySQL}`);
    await new Promise<void>((resolve, reject) => {
      connection.execute({
        sqlText: copySQL,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error("[ERROR] Data load failed:", err);
            reject(err);
          } else {
            console.log(
              `[INFO] Data loaded successfully. Rows affected: ${rows}`
            );
            resolve();
          }
        },
      });
    });

    console.log("[INFO] Bulk insert completed successfully.");
  } catch (error) {
    console.error("[ERROR] Bulk insert failed:", error);
    throw error;
  }
}
