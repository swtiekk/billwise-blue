import { useCallback, useState } from "react";
import { BudgetBill, fetchBills } from "../api/bills";
import { errorMessage } from "../api/client";

/** Loads the household's bills. Callbacks are stable, so they are safe in useFocusEffect. */
export function useBills() {
  const [bills, setBills] = useState<BudgetBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setBills(await fetchBills());
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
