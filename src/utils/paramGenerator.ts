import { AgedReceivablesParam } from "../types/AgedReceivablesParam";
import { GeneralLedgerParam } from "../types/GeneralLedgerParam";

export function generateGeneralLedgerParams(
  startDate: string,
  endDate: string,
  intervalInMonths: number
): GeneralLedgerParam[] {
  const paramsList: GeneralLedgerParam[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let currentStart = new Date(start);

  while (currentStart < end) {
    const currentEnd = new Date(currentStart);
    currentEnd.setMonth(currentEnd.getMonth() + intervalInMonths);

    // Ensure the end date doesn't exceed today's date
    if (currentEnd > end) {
      currentEnd.setTime(end.getTime());
    }

    paramsList.push({
      property_visibility: "all",
      project_visibility: "all",
      accounting_basis: "accrual",
      posted_on_from: currentStart.toLocaleDateString("en-US"),
      posted_on_to: currentEnd.toLocaleDateString("en-US"),
    });

    // Move to the next interval
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1); // Avoid overlap
  }

  return paramsList;
}


export function generateAgedReceivablesParams(
): AgedReceivablesParam[] {
  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the current month
  const formattedDate = endOfMonth.toLocaleDateString("en-US"); // Format as MM/DD/YYYY

  return [
    {
      paginate_results: false,
      property_visibility: "all",
      tenant_statuses: [],
      occurred_on_to: formattedDate
    },
  ];
}
