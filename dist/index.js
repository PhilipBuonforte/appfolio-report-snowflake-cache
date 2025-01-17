"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appfolioClient_1 = require("./appfolioClient");
const transformData_1 = require("./transformData");
const snowflakeClient_1 = require("./snowflakeClient");
const insertData_1 = require("./insertData");
async function main() {
    try {
        // Connect to Snowflake
        await (0, snowflakeClient_1.connectToSnowflake)();
        // Fetch data from AppFolio API
        const endpoint = "general_ledger"; // Replace with your desired endpoint
        const params = {
            paginate_results: false,
            from_date: "2025-01-01",
            to_date: "2025-01-16",
        };
        const rawData = await (0, appfolioClient_1.fetchAppFolioData)(endpoint, params);
        console.log("Raw Data:", rawData);
        // Transform the data
        const transformedData = (0, transformData_1.transformData)(rawData);
        console.log("Transformed Data:", transformedData);
        // Insert data into Snowflake
        await (0, insertData_1.insertDataToSnowflake)(transformedData, "appfolio_general_ledger");
        console.log("Pipeline completed successfully.");
    }
    catch (error) {
        console.error("Pipeline failed:", error);
    }
}
main();
