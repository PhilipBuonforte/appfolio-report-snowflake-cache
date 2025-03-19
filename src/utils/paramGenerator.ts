import { AgedReceivablesParam } from "../types/AgedReceivablesParam";
import { GeneralLedgerParam } from "../types/GeneralLedgerParam";
import { RentRollParam } from "../types/RentRollParam";
import { generateDates, getFormattedDate, getStartAndEndOfMonth } from "./date";
import { getReportCacheState, saveState } from "./state";

export function generateGeneralLedgerParams(): {
  params: GeneralLedgerParam[];
  from: string;
  to: string;
  isFirstRun: boolean;
} {
  const report_name = "general_ledger";
  let startDate = "01/01/2023";
  const endDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).toLocaleDateString("en-US");
  const intervalInMonths = 1;
  const state = getReportCacheState(report_name);
  console.log(state.isFirstRun);
  const params: GeneralLedgerParam[] = [];
  const start = state.isFirstRun
    ? new Date(startDate)
    : new Date(new Date().setMonth(new Date().getMonth() - 3)); // Ensure this returns a Date object

  const end = new Date(endDate);

  // Get the "from" and "to" dates
  const from = state.isFirstRun ? "" : getFormattedDate(start); // First date in the array
  const to = state.isFirstRun ? "" : getFormattedDate(end); // Last date in the array

  let currentStart = new Date(start);

  while (currentStart < end) {
    const currentEnd = new Date(currentStart);
    currentEnd.setMonth(currentEnd.getMonth() + intervalInMonths);

    // Ensure the end date doesn't exceed today's date
    if (currentEnd > end) {
      currentEnd.setTime(end.getTime());
    }

    params.push({
      property_visibility: "all",
      project_visibility: "all",
      accounting_basis: "accrual",
      reverse_transaction: "1",
      posted_on_from: currentStart.toLocaleDateString("en-US"),
      posted_on_to: currentEnd.toLocaleDateString("en-US"),
    });

    // Move to the next interval
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1); // Avoid overlap
  }

  if (state.isFirstRun) saveState(report_name, { isFirstRun: false });

  return { params, from, to, isFirstRun: state.isFirstRun };
}

export function generateAgedReceivablesParams(): {
  params: AgedReceivablesParam[];
  from: string;
  to: string;
  isFirstRun: boolean;
} {
  const report_name = "aged_receivables_detail";
  const state = getReportCacheState(report_name);
  const now = new Date();

  // Define January 1, 2023, as the starting date
  const startDate = new Date("2023-01-01");

  if (state.isFirstRun) {
    // Generate params for all days since January 1, 2023, to today
    const allDates = generateDates(startDate, now);
    const params = allDates.map((date) => ({
      paginate_results: false,
      property_visibility: "all",
      tenant_statuses: [],
      occurred_on_to: date,
    }));

    // Update state to indicate the first run is complete
    saveState(report_name, { isFirstRun: false });

    // Get the "from" and "to" dates
    const from = ""; // First date in the array
    const to = ""; // Last date in the array

    return { params, from, to, isFirstRun: true };
  } else {
    const dayOfMonth = now.getDate();
    const params: AgedReceivablesParam[] = [];

    if (dayOfMonth <= 14) {
      // Fetch the entire previous month
      const previousMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // Handle January edge case
      const yearForPreviousMonth =
        now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const { start: prevStart, end: prevEnd } = getStartAndEndOfMonth(
        yearForPreviousMonth,
        previousMonth
      );

      const previousMonthDates = generateDates(prevStart, prevEnd);
      params.push(
        ...previousMonthDates.map((date) => ({
          paginate_results: false,
          property_visibility: "all",
          tenant_statuses: [],
          occurred_on_to: date,
        }))
      );

      // Fetch current month's data up to today
      const currentMonth = now.getMonth() + 1; // Current month is zero-based in JavaScript
      const { start: currStart } = getStartAndEndOfMonth(
        now.getFullYear(),
        currentMonth
      );

      const currentMonthDates = generateDates(currStart, now);
      params.push(
        ...currentMonthDates.map((date) => ({
          paginate_results: false,
          property_visibility: "all",
          tenant_statuses: [],
          occurred_on_to: date,
        }))
      );
    } else {
      // Fetch current month's data up to today (from the 15th onward)
      const currentMonth = now.getMonth() + 1;
      const { start: currStart } = getStartAndEndOfMonth(
        now.getFullYear(),
        currentMonth
      );

      const currentMonthDates = generateDates(currStart, now);
      params.push(
        ...currentMonthDates.map((date) => ({
          paginate_results: false,
          property_visibility: "all",
          tenant_statuses: [],
          occurred_on_to: date,
        }))
      );
    }

    // Get the "from" and "to" dates
    const from = params.length > 0 ? params[0].occurred_on_to : ""; // First date in the array
    const to =
      params.length > 0 ? params[params.length - 1].occurred_on_to : ""; // Last date in the array

    return { params, from, to, isFirstRun: false };
  }
}

export function generateRentRollParams(): {
  params: RentRollParam[];
  from: string;
  to: string;
  isFirstRun: boolean;
} {
  const report_name = "rent_roll";
  const state = getReportCacheState(report_name);
  const now = new Date();

  // Define January 1, 2023, as the starting date
  const startDate = new Date("2023-01-01");

  if (state.isFirstRun) {
    // Generate params for all days since January 1, 2023, to today
    const allDates = generateDates(startDate, now);
    const params = allDates.map((date) => ({
      paginate_results: false,
      unit_visibility: "all",
      property_visibility: "all",
      non_revenue_units: "1",
      as_of_to: date,
    }));

    // Update state to indicate the first run is complete
    saveState(report_name, { isFirstRun: false });

    // Get the "from" and "to" dates
    const from = ""; // First date in the array
    const to = ""; // Last date in the array

    return { params, from, to, isFirstRun: true };
  } else {
    const dayOfMonth = now.getDate();
    const params: RentRollParam[] = [];

    if (dayOfMonth <= 14) {
      // Fetch the entire previous month
      const previousMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // Handle January edge case
      const yearForPreviousMonth =
        now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const { start: prevStart, end: prevEnd } = getStartAndEndOfMonth(
        yearForPreviousMonth,
        previousMonth
      );

      const previousMonthDates = generateDates(prevStart, prevEnd);
      params.push(
        ...previousMonthDates.map((date) => ({
          paginate_results: false,
          unit_visibility: "all",
          property_visibility: "all",
          non_revenue_units: "1",
          as_of_to: date,
        }))
      );

      // Fetch current month's data up to today
      const currentMonth = now.getMonth() + 1; // Current month is zero-based in JavaScript
      const { start: currStart } = getStartAndEndOfMonth(
        now.getFullYear(),
        currentMonth
      );

      const currentMonthDates = generateDates(currStart, now);
      params.push(
        ...currentMonthDates.map((date) => ({
          paginate_results: false,
          unit_visibility: "all",
          property_visibility: "all",
          non_revenue_units: "1",
          as_of_to: date,
        }))
      );
    } else {
      // Fetch current month's data up to today (from the 15th onward)
      const currentMonth = now.getMonth() + 1;
      const { start: currStart } = getStartAndEndOfMonth(
        now.getFullYear(),
        currentMonth
      );

      const currentMonthDates = generateDates(currStart, now);
      params.push(
        ...currentMonthDates.map((date) => ({
          paginate_results: false,
          unit_visibility: "all",
          property_visibility: "all",
          non_revenue_units: "1",
          as_of_to: date,
        }))
      );
    }

    const from = params.length > 0 ? params[0].as_of_to : ""; // First date in the array
    const to = params.length > 0 ? params[params.length - 1].as_of_to : ""; // Last date in the array

    return { params, from, to, isFirstRun: false };
  }
}
