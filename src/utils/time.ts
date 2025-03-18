import { DateTime } from "luxon"; // Ensure luxon is installed: npm install luxon

/**
 * Calculate the time (in milliseconds) to wait until the next 7 AM EST
 */
export function getTimeUntilNext7AM(): number {
  const now = DateTime.now().setZone("America/Denver");
  const next7AM =
    now.hour < 7
      ? now.set({ hour: 7, minute: 0, second: 0, millisecond: 0 })
      : now
          .plus({ days: 1 })
          .set({ hour: 7, minute: 0, second: 0, millisecond: 0 });

  return next7AM.diff(now).as("milliseconds");
}

/**
 * Check if the current time is within the allowed window (7 AM - 10 PM MT)
 */
export function isWithinAllowedTime(): boolean {
  const now = DateTime.now().setZone("America/Denver"); // Get current time in MT
  const startHour = 7; // 7 AM MT
  const endHour = 22; // 10 PM MT
  return now.hour >= startHour && now.hour < endHour;
}

/**
 * Returns the date and time of the next hour mark (0 minutes, 0 seconds, 0 milliseconds).
 *
 * @returns The date and time of the next hour mark in the local time zone.
 */
export function getNextHourMark(): Date {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(nextHour.getHours() + 1);
  return nextHour;
}
