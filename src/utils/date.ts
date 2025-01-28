// Format a date as MM/DD/YYYY
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US");
}

// Generate an array of dates between two dates
export function generateDates(from: Date, to: Date): string[] {
  const dates: string[] = [];
  let currentDate = new Date(from);

  while (currentDate <= to) {
    dates.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

// Get the start and end dates of a given month
export function getStartAndEndOfMonth(
  year: number,
  month: number
): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1); // Start of the month
  const end = new Date(year, month, 0); // Last day of the month
  return { start, end };
}
