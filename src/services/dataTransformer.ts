export interface AppFolioData {
  [key: string]: string | number | null;
}

/**
 * Transforms AppFolio data for Snowflake compatibility.
 * @param data Array of raw data from AppFolio API.
 */
export function transformData(data: AppFolioData[]): AppFolioData[] {
  return data.map((item) => ({
    ...item,
    fetched_at: new Date().toISOString(), // Add a timestamp
  }));
}