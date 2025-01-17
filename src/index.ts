import { connectToSnowflake } from "./clients/snowflakeClient";
import AppFolioReports from "./const/appfolio";
import { SnowFlakeInsertingMethod } from "./const/enum";
import { handleAppFolioData } from "./services/appfolioService";

async function main() {
  await connectToSnowflake();

  const endpoint = AppFolioReports.BudgetDetail;
  const tableName = `appfolio_${AppFolioReports.BudgetDetail}`;
  const paginated = true; // Fetch paginated results
  const insertMethod: SnowFlakeInsertingMethod =
    SnowFlakeInsertingMethod.BulkInsert;
  const batchSize = 1000; // Batch size for batch inserts

  await handleAppFolioData(
    endpoint,
    tableName,
    paginated,
    insertMethod,
    batchSize
  );
}

main().catch((err) => console.error("Pipeline failed:", err));
