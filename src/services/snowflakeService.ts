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
 * Duplicates the specified table in Snowflake by creating a new table with the same structure and data.
 * @param originalTableName Name of the table to duplicate.
 * @param newTableName Name of the new table to be created.
 */
export async function duplicateTable(
  originalTableName: string,
  newTableName: string
): Promise<void> {
  // SQL to duplicate the table
  const duplicateTableSQL = `CREATE TABLE ${newTableName} AS SELECT * FROM ${originalTableName};`;

  logger.info(
    `[INFO] Duplicating table '${originalTableName}' to '${newTableName}'...`
  );
  logger.debug(`[DEBUG] Executing SQL: ${duplicateTableSQL}`);

  await new Promise<void>((resolve, reject) => {
    connection.execute({
      sqlText: duplicateTableSQL,
      complete: (err) => (err ? reject(err) : resolve()),
    });
  });

  logger.info(
    `[INFO] Table '${originalTableName}' duplicated successfully as '${newTableName}'.`
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

// Add this function to execute the stored procedure
// ...existing imports and functions...

/**
 * Executes the silver_lands master queries stored procedure
 * @throws Error if the stored procedure execution fails
 */
export async function executeSnowflakeProcedure(): Promise<void> {
  try {
    logger.info("[INFO] Executing Snowflake stored procedure...");

    await new Promise<void>((resolve, reject) => {
      connection.execute({
        sqlText: "CALL silver_lands.silver_lands_data.run_master_queries()",
        complete: (err) => (err ? reject(err) : resolve()),
      });
    });

    logger.info("[INFO] Snowflake stored procedure executed successfully.");
  } catch (err: any) {
    logger.error("[ERROR] Failed to execute Snowflake stored procedure:", {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}
