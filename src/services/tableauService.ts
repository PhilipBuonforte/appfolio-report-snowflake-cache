import axios from "axios";
import dotenv from "dotenv";
import logger from "../utils/logger";

// Load environment variables
dotenv.config();

// Tableau Configuration
const TABLEAU_SERVER = process.env.TABLEAU_SERVER;
const TABLEAU_SITE_ID = process.env.TABLEAU_SITE_ID;
const WORKBOOK_ID = process.env.TABLEAU_WORKBOOK_ID;

// Personal Access Token (PAT)
const PAT_NAME = process.env.TABLEAU_PAT_NAME;
const PAT_SECRET = process.env.TABLEAU_PAT_SECRET;

// API URLs
const API_VERSION = "3.14";
const SIGN_IN_URL = `${TABLEAU_SERVER}/api/${API_VERSION}/auth/signin`;
const REFRESH_URL = `${TABLEAU_SERVER}/api/${API_VERSION}/sites/${TABLEAU_SITE_ID}/workbooks/${WORKBOOK_ID}/refresh`;

// Create an Axios instance for handling requests
const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Authenticates with Tableau using a PAT and triggers an extract refresh.
 * @throws Error if authentication or refresh fails
 */
export async function refreshTableauExtract(): Promise<void> {
  try {
    logger.info("[INFO] Starting Tableau extract refresh process...");

    // Step 1: Sign in to Tableau and get a session token
    const authPayload = {
      credentials: {
        personalAccessTokenName: PAT_NAME,
        personalAccessTokenSecret: PAT_SECRET,
        site: { contentUrl: "silverlands" },
      },
    };

    logger.info("[INFO] Authenticating with Tableau...");
    const authResponse = await axiosInstance.post(SIGN_IN_URL, authPayload);

    if (authResponse.status !== 200) {
      const error = `Authentication failed: ${authResponse.status} - ${authResponse.statusText}`;
      logger.error(`[ERROR] ${error}`);
      throw new Error(error);
    }

    const token = authResponse.data.credentials.token;
    logger.info("[INFO] Authentication successful");

    // Step 2: Refresh the extract
    const refreshHeaders = {
      "X-Tableau-Auth": token,
    };

    logger.info("[INFO] Triggering Tableau extract refresh...");
    const refreshResponse = await axiosInstance.post(
      REFRESH_URL,
      {},
      { headers: refreshHeaders }
    );

    if (refreshResponse.status === 200 || refreshResponse.status === 202) {
      logger.info("[INFO] Tableau Extract Refresh Triggered Successfully");
    } else {
      const error = `Failed to trigger refresh: ${refreshResponse.status} - ${refreshResponse.statusText}`;
      logger.error(`[ERROR] ${error}`);
      throw new Error(error);
    }
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error";
    logger.error("[ERROR] Tableau Extract Refresh failed:", {
      error: errorMessage,
      stack: error.stack,
    });
    throw error; // Re-throw to allow calling code to handle the error
  }
}
