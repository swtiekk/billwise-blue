import type { BudgetBill } from "../api/bills";
import type { RiskAssessment } from "../api/types";

/**
 * The last data each screen loaded. A screen shows this straight away and refreshes in the background,
 * so moving between tabs (or reopening Home) never starts from an empty screen.
 * Cleared on login, signup and logout so one account never sees another's numbers.
 */
export const dataCache: { bills: BudgetBill[] | null; risk: RiskAssessment | null } = { bills: null, risk: null };

export function clearDataCache() {
  dataCache.bills = null;
  dataCache.risk = null;
}
