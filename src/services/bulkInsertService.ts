import { connection } from "../clients/snowflakeClient";
import fs from "fs";
import path from "path";
import logger from "../utils/logger"; // Import Winston logger

/**
 * Ensures that the directory for the temporary file exists.
 * @param filePath Path to the file.
 */
function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    logger.info(`[INFO] Directory does not exist. Creating: ${dir}`);
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
    logger.info("[INFO] No data to insert.");
    return;
  }

  const keys = Object.keys(data[0]); // Column names
  const csvFilePath = path.resolve(__dirname, `../../temp/${tableName}.csv`);
  const normalizedCsvFilePath = csvFilePath.replace(/\\/g, "/"); // Normalize path for Windows

  logger.info(`[INFO] Preparing bulk insert for table: ${tableName}`);
  logger.debug(`[DEBUG] Keys/Columns: ${keys.join(", ")}`);
  logger.debug(`[DEBUG] CSV file path: ${csvFilePath}`);

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
  logger.debug("[DEBUG] Sample CSV content:");
  logger.debug(csvContent.split("\n").slice(0, 5).join("\n")); // Log first 5 lines

  // Write to the file
  fs.writeFileSync(csvFilePath, csvContent);
  logger.info("[INFO] CSV file written successfully.");

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
    logger.info("[INFO] Ensuring table exists...");
    logger.debug(`[DEBUG] Executing SQL: ${createTableSQL}`);
    await new Promise<void>((resolve, reject) => {
      connection.execute({
        sqlText: createTableSQL,
        complete: (err) => (err ? reject(err) : resolve()),
      });
    });
    logger.info(`[INFO] Table '${tableName}' checked/created successfully.`);

    logger.info("[INFO] Uploading CSV file to Snowflake stage...");
    logger.debug(`[DEBUG] Executing SQL: ${putSQL}`);
    await new Promise<void>((resolve, reject) => {
      connection.execute({
        sqlText: putSQL,
        complete: (err, stmt, rows) => {
          if (err) {
            logger.error("[ERROR] CSV upload failed:", err);
            reject(err);
          } else {
            logger.info(
              `[INFO] CSV uploaded successfully. Rows affected: ${rows}`
            );
            resolve();
          }
        },
      });
    });

    logger.info("[INFO] Loading data from stage to Snowflake table...");
    logger.debug(`[DEBUG] Executing SQL: ${copySQL}`);
    await new Promise<void>((resolve, reject) => {
      connection.execute({
        sqlText: copySQL,
        complete: (err, stmt, rows) => {
          if (err) {
            logger.error("[ERROR] Data load failed:", err);
            reject(err);
          } else {
            logger.info(
              `[INFO] Data loaded successfully. Rows affected: ${rows}`
            );
            resolve();
          }
        },
      });
    });

    logger.info("[INFO] Bulk insert completed successfully.");
  } catch (error) {
    logger.error("[ERROR] Bulk insert failed:", error);
    throw error;
  }
}
