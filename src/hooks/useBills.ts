import { useCallback, useRef, useState } from "react";
import { BudgetBill, fetchBills } from "../api/bills";
import { errorMessage } from "../api/client";
import { dataCache } from "./dataCache";

/**
 * Loads the household's bills. Callbacks are stable, so they are safe in useFocusEffect.
 * Starts from the last loaded bills and refreshes quietly: `loading` is true only when there is nothing to show yet.
 */
export function useBills() {
  const [bills, setBills] = useState<BudgetBill[]>(dataCache.bills ?? []);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(dataCache.bills != null);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const refresh = useCallback(async () => {
    // Only the newest request may update the screen. Without this, a slower, older request (for example the
    // refresh on coming back to a screen, sent before a save finished) can land last and hide the new bill.
    const mine = ++latest.current;
    if (!dataCache.bills) setLoading(true);
    try {
      const fresh = await fetchBills();
      if (mine !== latest.current) return;
      dataCache.bills = fresh;
      setBills(fresh);
      setError(null);
      setLoaded(true);
    } catch (e) {
      if (mine === latest.current) setError(errorMessage(e));
    } finally {
      if (mine === latest.current) setLoading(false);
    }
  }, []);

  return { bills, loading, loaded, error, refresh };
}
