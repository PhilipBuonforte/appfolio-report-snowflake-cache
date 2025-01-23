import { connection } from "../clients/snowflakeClient";
import logger from "../utils/logger";

/**
 * Generates the SQL statement for creating a Snowflake table.
 * @param tableName Name of the table to create.
 * @param columns Array of column names.
 * @returns SQL string for table creation.
 */
function generateCreateTableSQL(tableName: string, columns: string[]): string {
  const columnDefinitions = columns
    .map((column) => `${column} STRING`)
    .join(", ");
  return `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columnDefinitions}
      );
    `;
}

/**
 * Ensures the specified table exists in Snowflake.
 * @param tableName Name of the table to check/create.
 * @param columns Array of column names.
 */
export async function ensureTableExists(
  tableName: string,
  columns: string[]
): Promise<void> {
  const createTableSQL = generateCreateTableSQL(tableName, columns);
  logger.debug(`[DEBUG] Executing SQL: ${createTableSQL}`);

  await new Promise<void>((resolve, reject) => {
    connection.execute({
      sqlText: createTableSQL,
      complete: (err) => (err ? reject(err) : resolve()),
    });
  });

  logger.info(`[INFO] Table '${tableName}' checked/created successfully.`);
}

/**
 * Drops the specified table in Snowflake.
 * @param tableName Name of the table to drop.
 */
export async function dropTable(tableName: string): Promise<void> {
  const dropTableSQL = `DROP TABLE IF EXISTS ${tableName};`;
  logger.info(`[INFO] Dropping table '${tableName}' if it exists...`);
  logger.debug(`[DEBUG] Executing SQL: ${dropTableSQL}`);

  await new Promise<void>((resolve, reject) => {
    connection.execute({
      sqlText: dropTableSQL,
      complete: (err) => (err ? reject(err) : resolve()),
    });
  });

  logger.info(
    `[INFO] Table '${tableName}' dropped successfully (if it existed).`
  );
}

/**
 * Renames a table in Snowflake.
 * @param oldName Current name of the table.
 * @param newName New name for the table.
 */
export async function renameTable(
  oldName: string,
  newName: string
): Promise<void> {
  const renameTableSQL = `ALTER TABLE ${oldName} RENAME TO ${newName};`;
  logger.info(`[INFO] Renaming table '${oldName}' to '${newName}'...`);
  logger.debug(`[DEBUG] Executing SQL: ${renameTableSQL}`);

  await new Promise<void>((resolve, reject) => {
    connection.execute({
      sqlText: renameTableSQL,
      complete: (err) => (err ? reject(err) : resolve()),
    });
  });

  logger.info(
    `[INFO] Table '${oldName}' renamed to '${newName}' successfully.`
  );
}
