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
 * Generates a unique file name for the CSV file.
 * @param tableName Name of the Snowflake table.
 * @returns Unique file name with timestamp.
 */
export function generateUniqueFileName(tableName: string): string {
  return `${tableName}_${Date.now()}.csv`;
}

/**
 * Converts data into CSV format with proper escaping.
 * @param data Array of rows to convert.
 * @param keys Column names (keys).
 * @returns CSV content as a string.
 */
function generateCsvContent(data: any[], keys: string[]): string {
  return [
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
}

/**
 * Writes the CSV content to a file.
 * @param filePath Path to the file.
 * @param content CSV content to write.
 */
function writeCsvToFile(filePath: string, content: string): void {
  ensureDirectoryExists(filePath);
  fs.writeFileSync(filePath, content);
  logger.info("[INFO] CSV file written successfully.");
}

/**
 * Executes a SQL query using the Snowflake connection.
 * @param sqlText SQL query to execute.
 * @param description Description of the operation (for logging).
 */
async function executeSnowflakeQuery(
  sqlText: string,
  description: string
): Promise<void> {
  logger.info(`[INFO] ${description}...`);
  logger.debug(`[DEBUG] Executing SQL: ${sqlText}`);
  await new Promise<void>((resolve, reject) => {
    connection.execute({
      sqlText,
      complete: (err, stmt, rows) => {
        if (err) {
          logger.error(`[ERROR] ${description} failed:`, err);
          reject(err);
        } else {
          logger.info(
            `[INFO] ${description} succeeded. Rows affected: ${rows?.length}`
          );
          resolve();
        }
      },
    });
  });
}

/**
 * Deletes a file if it exists.
 * @param filePath Path to the file.
 */
function deleteFileIfExists(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    logger.info(`[INFO] Temporary file '${filePath}' deleted successfully.`);
  }
}

/**
 * Performs a bulk insert into a Snowflake table using a CSV file.
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
  const uniqueFileName = generateUniqueFileName(tableName);
  const csvFilePath = path.resolve(__dirname, `../../temp/${uniqueFileName}`);

  logger.info(`[INFO] Preparing bulk insert for table: ${tableName}`);
  logger.debug(`[DEBUG] Keys/Columns: ${keys.join(", ")}`);
  logger.debug(`[DEBUG] CSV file path: ${csvFilePath}`);

  // Generate and write CSV content
  const csvContent = generateCsvContent(data, keys);
  logger.debug("[DEBUG] Sample CSV content:");
  logger.debug(csvContent.split("\n").slice(0, 5).join("\n")); // Log first 5 lines
  writeCsvToFile(csvFilePath, csvContent);

  await uploadCsvFile(tableName, csvFilePath);
}

export async function saveToCsv(
  data: any[],
  tableName: string,
  uniqueFileName: string
): Promise<void> {
  const keys = Object.keys(data[0]); // Column names
  const csvFilePath = path.resolve(__dirname, `../../temp/${uniqueFileName}`);

  logger.info(`[INFO] Preparing bulk insert for table: ${tableName}`);
  logger.debug(`[DEBUG] Keys/Columns: ${keys.join(", ")}`);
  logger.debug(`[DEBUG] CSV file path: ${csvFilePath}`);

  // Generate and write CSV content
  const csvContent = generateCsvContent(data, keys);

  writeCsvToFile(csvFilePath, csvContent);
}

export async function uploadFilesToSnowFlake(
  csvFileNames: string[],
  tableName: string
) {
  for (let index = 0; index < csvFileNames.length; index++) {
    const fileName = csvFileNames[index];
    const csvFilePath = path.resolve(__dirname, `../../temp/${fileName}`);

    await uploadCsvFile(tableName, csvFilePath);
  }
}

export async function uploadCsvFile(tableName: string, csvFilePath: string) {
  // Snowflake commands
  const stageName = `@%${tableName}`;
  const normalizedCsvFilePath = csvFilePath.replace(/\\/g, "/"); // Normalize path for Windows

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
    // Upload CSV file to Snowflake stage
    await executeSnowflakeQuery(
      putSQL,
      "Uploading CSV file to Snowflake stage"
    );

    // Load data from stage to Snowflake table
    await executeSnowflakeQuery(copySQL, "Loading data into Snowflake table");

    logger.info("[INFO] Bulk insert completed successfully.");
  } catch (error) {
    logger.error("[ERROR] Bulk insert failed:", error);
    throw error;
  } finally {
    // Clean up temporary file
    try {
      deleteFileIfExists(csvFilePath);
    } catch (err) {
      logger.error(
        `[ERROR] Failed to delete temporary file '${csvFilePath}':`,
        err
      );
    }
  }
}

/**
 * Removes existing records from a Snowflake table based on a date range.
 * @param tableName Name of the Snowflake table.
 * @param field_name Date field name to filter on.
 * @param from Start date in 'MM-DD-YYYY' format.
 * @param to End date in 'MM-DD-YYYY' format.
 */
export async function removeExistingRecords(
  tableName: string,
  field_name: string,
  from: string,
  to: string
) {
  try {
    // Convert 'MM-DD-YYYY' to 'YYYY-MM-DD' format using TO_DATE() function for both field and date range
    const sqlText = `
      DELETE FROM ${tableName}
      WHERE TO_DATE(${field_name}, 'MM-DD-YYYY') BETWEEN TO_DATE('${from}', 'MM-DD-YYYY') AND TO_DATE('${to}', 'MM-DD-YYYY');
    `;

    await executeSnowflakeQuery(
      sqlText,
      `Removing existing records from Snowflake table based on date range: ${from} to ${to}`
    );
  } catch (error) {
    logger.error("[ERROR] Removing existing records failed:", error);
    throw error;
  }
}
