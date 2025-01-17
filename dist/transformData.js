"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformData = transformData;
/**
 * Transforms AppFolio data for Snowflake compatibility.
 * @param data Array of raw data from AppFolio API.
 */
function transformData(data) {
    return data.map((item) => ({
        ...item,
        fetched_at: new Date().toISOString(), // Add a timestamp
    }));
}
