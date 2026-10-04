import { useCallback, useState } from "react";
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

  const refresh = useCallback(async () => {
    if (!dataCache.bills) setLoading(true);
    try {
      const fresh = await fetchBills();
      dataCache.bills = fresh;
      setBills(fresh);
      setError(null);
      setLoaded(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return { bills, loading, loaded, error, refresh };
}
