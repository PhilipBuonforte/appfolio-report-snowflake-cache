import { convertToMMDDYYYY } from "../utils/date";

export interface AppFolioData {
  [key: string]: string | number | null;
}

/**
 * Transforms AppFolio data for Snowflake compatibility.
 * Ensures field names start with text, not numbers, and adds a timestamp.
 * @param data Array of raw data from AppFolio API.
 */
export function transformData(
  data: AppFolioData[],
  endpoint: string,
  param?: any
): AppFolioData[] {
  return data.map((item) => {
    const updatedItem: AppFolioData = {};

    // Iterate over each key-value pair in the item
    Object.entries(item).forEach(([key, value]) => {
      // Check if the key starts with a number
      if (/^\d/.test(key)) {
        // Rename the key to start with a prefix (e.g., "field_")
        const newKey = `field_${key}`;
        updatedItem[newKey] = value;
      } else {
        // Keep the original key if it doesn't start with a number
        updatedItem[key] = value;
      }
    });

    // Add the fetched_at timestamp
    updatedItem["fetched_at"] = new Date().toISOString();

    if (endpoint === "aged_receivables_detail" && param)
      updatedItem["as_of_date"] = convertToMMDDYYYY(param.occurred_on_to);
    else if (endpoint === "rent_roll" && param)
      updatedItem["as_of_date"] = convertToMMDDYYYY(param.as_of_to);
    return updatedItem;
  });
}
