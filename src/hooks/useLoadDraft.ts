import { useCallback, useEffect, useState } from "react";
import { useSetup } from "../context/SetupContext";
import { fetchCurrentSetup, toDraft } from "../api/edit";
import { errorMessage } from "../api/client";

/**
 * Edit screens are the setup screens opened with saved data. When `enabled`, this loads the
 * current setup into the shared draft; the screen shows <ScreenLoading> until it is ready.
 */
export function useLoadDraft(enabled: boolean) {
  const { replace } = useSetup();
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      replace(toDraft(await fetchCurrentSetup()));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [replace]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { loading, error, reload: load };
}
