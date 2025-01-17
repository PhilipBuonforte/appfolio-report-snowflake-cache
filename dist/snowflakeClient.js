"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = void 0;
exports.connectToSnowflake = connectToSnowflake;
const snowflake_sdk_1 = __importDefault(require("snowflake-sdk"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log("Snowflake Environment Variables:", process.env.SNOWFLAKE_ACCOUNT, process.env.SNOWFLAKE_USER, process.env.SNOWFLAKE_PASSWORD, process.env.SNOWFLAKE_DATABASE, process.env.SNOWFLAKE_SCHEMA, process.env.SNOWFLAKE_WAREHOUSE);
const connection = snowflake_sdk_1.default.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USER,
    password: process.env.SNOWFLAKE_PASSWORD,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    role: process.env.SNOWFLAKE_ROLE,
});
exports.connection = connection;
function connectToSnowflake() {
    return new Promise((resolve, reject) => {
        connection.connect((err, conn) => {
            if (err) {
                reject(`Failed to connect to Snowflake: ${err.message}`);
            }
            else {
                console.log("Connected to Snowflake.");
                resolve();
            }
        });
    });
}
