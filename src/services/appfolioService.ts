import { fetchAppFolioData } from "../clients/appfolioClient";
import { SnowFlakeInsertingMethod } from "../const/enum";
import { batchInsert } from "./batchInsertService";
import { bulkInsert } from "./bulkInsertService";
import { transformData } from "./dataTransformer";

export async function handleAppFolioData(
  endpoint: string,
  tableName: string,
  paginated: boolean,
  insertMethod: SnowFlakeInsertingMethod,
  batchSize: number = 5000
): Promise<void> {
  const rawData = await fetchAppFolioData(endpoint, {}, paginated);

  // Transform the data
  const transformedData = transformData(rawData);

  if (insertMethod === SnowFlakeInsertingMethod.BatchInsert) {
    await batchInsert(transformedData, tableName, batchSize);
  } else if (insertMethod === SnowFlakeInsertingMethod.BulkInsert) {
    await bulkInsert(transformedData, tableName);
  }
}
