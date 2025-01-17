import { SnowFlakeInsertingMethod } from "../const/enum";
import dotenv from "dotenv";

dotenv.config();

export const USE_PAGINATED_CACHE = true;

export const CACHING_METHOD = SnowFlakeInsertingMethod.BatchInsert;

export const SnowflakeConfig = {
  account: process.env.SNOWFLAKE_ACCOUNT || "",
  username: process.env.SNOWFLAKE_USER || "",
  password: process.env.SNOWFLAKE_PASSWORD || "",
  database: process.env.SNOWFLAKE_DATABASE || "",
  schema: process.env.SNOWFLAKE_SCHEMA || "",
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || "",
  role: process.env.SNOWFLAKE_ROLE || "",
};
