import { fetchAppFolioData } from "./appfolioClient";
import { transformData } from "./transformData";
import { connectToSnowflake } from "./snowflakeClient";
import { insertDataToSnowflake } from "./insertData";

async function main() {
  try {
    // Connect to Snowflake
    await connectToSnowflake();

    // Fetch data from AppFolio API
    const endpoint = "general_ledger"; // Replace with your desired endpoint
    const params = {
      paginate_results: false,
      from_date: "2025-01-01",
      to_date: "2025-01-02",
    };

    const rawData = await fetchAppFolioData(endpoint, params);

    // Transform the data
    const transformedData = transformData(rawData);

    // Insert data into Snowflake
    await insertDataToSnowflake(transformedData, "appfolio_general_ledger");

    console.log("Pipeline completed successfully.");
  } catch (error) {
    console.error("Pipeline failed:", error);
  }
}

main();
