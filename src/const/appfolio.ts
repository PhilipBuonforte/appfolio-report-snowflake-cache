import {
  generateAgedReceivablesParams,
  generateGeneralLedgerParams,
  generateRentRollParams,
} from "../utils/paramGenerator";
import { SnowFlakeInsertingMethod } from "./enum";

const GenerateAppFolioReports = () => {
  const agedReceivablesParams = generateAgedReceivablesParams();
  const rentRollParams = generateRentRollParams();

  return {
    // Correct params
    GeneralLedger: {
      name: "general_ledger",
      insertMethod: SnowFlakeInsertingMethod.BulkInsert,
      params: generateGeneralLedgerParams(
        "01/01/2023",
        new Date().toLocaleDateString("en-US"),
        2
      ),
    },

    // Correct params
    BudgetDetail: {
      name: "property_budget",
      insertMethod: SnowFlakeInsertingMethod.BulkInsert,
      params: [
        {
          year_to: "2023-12",
          property_visibility: "all",
        },
        {
          year_to: "2024-12",
          property_visibility: "all",
        },
        {
          year_to: "2025-12",
          property_visibility: "all",
        },
      ],
    },
    // Correct params
    IncomeStatement: {
      name: "income_statement",
      insertMethod: SnowFlakeInsertingMethod.BulkInsert,
      params: [
        {
          property_visibility: "all",
          accounting_basis: "Accrual",
          level_of_detail: "detail_view",
          include_zero_balance_gl_accounts: "1",
          posted_on_to: `${new Date().getFullYear()}-12`,
        },
      ],
    },
    // Correct params
    TenantTickler: {
      name: "tenant_tickler",
      insertMethod: SnowFlakeInsertingMethod.BulkInsert,
      params: [
        {
          property_visibility: "all",
          occurred_on_from: "01/01/2023",
          occurred_on_to: new Date().toLocaleDateString("en-US"),
        },
      ],
    },
    // Correct params
    UnitVacancy: {
      name: "unit_vacancy",
      insertMethod: SnowFlakeInsertingMethod.BulkInsert,
      params: [
        {
          unit_visibility: "all",
          property_visibility: "all",
        },
      ],
    },

    // Correct params
    ChartOfAccounts: {
      name: "chart_of_accounts",
      insertMethod: SnowFlakeInsertingMethod.BulkInsert,
      params: [{}],
    },

    AgedReceivableDetail: {
      name: "aged_receivables_detail",
      insertMethod: SnowFlakeInsertingMethod.BulkUpsert,
      params: agedReceivablesParams.params,
      optionalParams: {
        isFirstRun: agedReceivablesParams.isFirstRun,
        from: agedReceivablesParams.from,
        to: agedReceivablesParams.to,
      },
    },

    RentRoll: {
      name: "rent_roll",
      insertMethod: SnowFlakeInsertingMethod.BulkUpsert,
      params: rentRollParams.params,
      optionalParams: {
        isFirstRun: rentRollParams.isFirstRun,
        from: rentRollParams.from,
        to: rentRollParams.to,
      },
    },
  };
};

export default GenerateAppFolioReports;
