"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAppFolioData = fetchAppFolioData;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const BASE_URL = process.env.APPFOLIO_BASE_URL;
const CLIENT_ID = process.env.APPFOLIO_CLIENT_ID;
const CLIENT_SECRET = process.env.APPFOLIO_CLIENT_SECRET;
const DATABASE_ID = process.env.APPFOLIO_DATABASE_ID;
/**
 * Fetches data from AppFolio API.
 * @param endpoint The data endpoint (e.g., "general_ledger").
 * @param params Query parameters for filtering data.
 */
async function fetchAppFolioData(endpoint, params = {}) {
    try {
        const url = `https://${CLIENT_ID}:${CLIENT_SECRET}@${DATABASE_ID}.appfolio.com/api/v1/reports/${endpoint}.json`;
        const response = await axios_1.default.get(url, {
            params,
        });
        return response.data;
    }
    catch (error) {
        console.error("Error fetching data from AppFolio:", error.message);
        throw error;
    }
}
