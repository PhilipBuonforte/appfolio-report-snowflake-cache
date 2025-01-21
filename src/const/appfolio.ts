const AppFolioReports = {
  GeneralLedger: {
    name: "general_ledger",
    params: {
      accounting_basis: "accrual",
      from_date: "01/01/2024",
      to_date: new Date().toLocaleDateString("en-US"), // Dynamically sets today's date in MM/DD/YYYY format
    },
  },

  RentRoll: {
    name: "rent_roll",
    params: {
      status: "all",
      from_date: "01/01/2024",
      to_date: new Date().toLocaleDateString("en-US"),
    },
  },
  BudgetDetail: {
    name: "property_budget",
    params: {
      status: "all",
      from_date: "01/01/2024",
      to_date: new Date().toLocaleDateString("en-US"),
    },
  },
  IncomeStatement: {
    name: "income_statement",
    params: {
      status: "all",
      from_date: "01/01/2024",
      to_date: new Date().toLocaleDateString("en-US"),
    },
  },
  TenantTickler: {
    name: "tenant_tickler",
    params: {
      status: "all",
      from_date: "01/01/2024",
      to_date: new Date().toLocaleDateString("en-US"),
    },
  },
  UnitVacancy: {
    name: "unit_vacancy",
    params: {
      from_date: "01/01/2024",
      to_date: new Date().toLocaleDateString("en-US"), // Dynamically sets today's date in MM/DD/YYYY format
    },
  },
};

export default AppFolioReports;
