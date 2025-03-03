import { DateTime } from "luxon"; // Ensure luxon is installed: npm install luxon

/**
 * Calculate the time (in milliseconds) to wait until the next 8 AM EST
 */
export function getTimeUntilNext8AM(): number {
  const now = DateTime.now().setZone("America/New_York"); // Current time in EST
  const next8AM =
    now.hour < 8 // If it's before 8 AM, use today; otherwise, use tomorrow
      ? now.set({ hour: 8, minute: 0, second: 0, millisecond: 0 })
      : now
          .plus({ days: 1 })
          .set({ hour: 8, minute: 0, second: 0, millisecond: 0 });

  return next8AM.diff(now).as("milliseconds"); // Time difference in milliseconds
}

/**
 * Check if the current time is within the allowed window (8 AM - 8 PM EST)
 */
export function isWithinAllowedTime(): boolean {
  const now = DateTime.now().setZone("America/New_York"); // Get current time in EST
  const startHour = 7; // 7 AM
  const endHour = 22; // 22 PM
  return now.hour >= startHour && now.hour < endHour; // Check if the current hour is within the range
}
