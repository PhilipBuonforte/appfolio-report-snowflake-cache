"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertDataToSnowflake = insertDataToSnowflake;
const snowflakeClient_1 = require("./snowflakeClient");
/**
 * Inserts data into a Snowflake table.
 * @param data Array of objects to insert (each object is a row).
 * @param tableName The Snowflake table name.
 */
async function insertDataToSnowflake(data, tableName) {
    if (data.length === 0) {
        console.log("No data to insert.");
        return;
    }
    // Dynamically build the SQL query
    const keys = Object.keys(data[0]); // Get column names from the first object
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${tableName} (${keys.join(", ")}) VALUES (${placeholders})`;
    try {
        await Promise.all(data.map((item) => new Promise((resolve, reject) => {
            const binds = Object.values(item); // Ensure `binds` is a flat array of primitive types
            snowflakeClient_1.connection.execute({
                sqlText: sql,
                binds: binds, // Assign the correctly typed `binds` array
                complete: (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                },
            });
        })));
        console.log("Data inserted successfully.");
    }
    catch (error) {
        console.error("Error inserting data into Snowflake:", error);
        throw error;
    }
}
