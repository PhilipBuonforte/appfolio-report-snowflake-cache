import axios from "axios";
import dotenv from "dotenv";
import logger from "../utils/logger";

dotenv.config();

const CLIENT_ID = process.env.APPFOLIO_CLIENT_ID!;
const CLIENT_SECRET = process.env.APPFOLIO_CLIENT_SECRET!;
const DATABASE_ID = process.env.APPFOLIO_DATABASE_ID!;

/**
 * Fetches data from AppFolio API.
 * @param endpoint The data endpoint (e.g., "general_ledger").
 * @param params Query parameters for filtering data.
 */
export async function fetchAppFolioData(
  endpoint: string,
  params: Record<string, string | number | boolean | string[]> = {},
  paginated: boolean = false
): Promise<any> {
  try {
    const url = paginated
      ? `https://${CLIENT_ID}:${CLIENT_SECRET}@${DATABASE_ID}.appfolio.com${endpoint}`
      : `https://${CLIENT_ID}:${CLIENT_SECRET}@${DATABASE_ID}.appfolio.com/api/v2/reports/${endpoint}.json`;

    console.log(url, paginated);

    const response = paginated
      ? await axios.post(url, {})
      : await axios.post(url, params);

    if (response.data.results) {
      return {
        results: response.data.results,
        next_page_url: response.data.next_page_url,
      };
    } else {
      return { results: response.data, next_page_url: null };
    }
  } catch (error: any) {
    if (error.response) {
      logger.error(
        `[ERROR] Error fetching data from AppFolio: ${error.response.data}`
      );
      return { results: [], next_page_url: null };
    } else {
      logger.error(
        `[ERROR] Error fetching data from AppFolio: ${error.message}`
      );
      throw error;
    }
  }
}
