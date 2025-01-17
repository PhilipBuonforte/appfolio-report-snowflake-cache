import snowflake from "snowflake-sdk";
import { SnowflakeConfig } from "../config/snowflake";

const connection = snowflake.createConnection({
  account: SnowflakeConfig.account,
  username: SnowflakeConfig.username,
  password: SnowflakeConfig.password,
  database: SnowflakeConfig.database,
  schema: SnowflakeConfig.schema,
  warehouse: SnowflakeConfig.warehouse,
  role: SnowflakeConfig.role,
});

export function connectToSnowflake(): Promise<void> {
  return new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        reject(`Failed to connect to Snowflake: ${err.message}`);
      } else {
        console.log("Connected to Snowflake.");
        resolve();
      }
    });
  });
}

export { connection };
