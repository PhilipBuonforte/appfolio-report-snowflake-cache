import snowflake from "snowflake-sdk";
import dotenv from "dotenv";

dotenv.config();

console.log(
  "Snowflake Environment Variables:",
  process.env.SNOWFLAKE_ACCOUNT,
  process.env.SNOWFLAKE_USER,
  process.env.SNOWFLAKE_PASSWORD,
  process.env.SNOWFLAKE_DATABASE,
  process.env.SNOWFLAKE_SCHEMA,
  process.env.SNOWFLAKE_WAREHOUSE
);

const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT!,
  username: process.env.SNOWFLAKE_USER!,
  password: process.env.SNOWFLAKE_PASSWORD!,
  database: process.env.SNOWFLAKE_DATABASE!,
  schema: process.env.SNOWFLAKE_SCHEMA!,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
  role: process.env.SNOWFLAKE_ROLE!,
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
