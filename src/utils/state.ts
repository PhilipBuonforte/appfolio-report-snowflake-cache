import fs from "fs";
import path from "path";

const STATE_FILE = path.resolve(
  __dirname,
  "../../temp/report_cache_state.json"
);

// Load the state for all functions
export function loadState(): Record<string, any> {
  if (!fs.existsSync(STATE_FILE)) {
    return {};
  }
  const data = fs.readFileSync(STATE_FILE, "utf-8");
  return JSON.parse(data);
}

// Save the state for a specific function
export function saveState(functionName: string, state: any) {
  const allStates = loadState();
  allStates[functionName] = state;
  fs.writeFileSync(STATE_FILE, JSON.stringify(allStates, null, 2));
}

// Fetch the state for a specific function
export function getReportCacheState(functionName: string): any {
  const allStates = loadState();
  return allStates[functionName] || { isFirstRun: true };
}
