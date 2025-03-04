import { DateTime } from "luxon"; // Ensure luxon is installed: npm install luxon

/**
 * Calculate the time (in milliseconds) to wait until the next 7 AM EST
 */
export function getTimeUntilNext7AM(): number {
  const now = DateTime.now().setZone("America/New_York");
  const next7AM =
    now.hour < 7
      ? now.set({ hour: 7, minute: 0, second: 0, millisecond: 0 })
      : now
          .plus({ days: 1 })
          .set({ hour: 7, minute: 0, second: 0, millisecond: 0 });

  return next7AM.diff(now).as("milliseconds");
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
