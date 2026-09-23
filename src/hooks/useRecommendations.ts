import { useCallback, useState } from "react";
import type { RecommendationsResponse } from "../api/types";
import { getRecommendations } from "../api/insights";
import { errorMessage } from "../api/client";

export function useRecommendations() {
  const [recs, setRecs] = useState<RecommendationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getRecommendations();
      setRecs(data);
      setError(null);
    } catch (e) {
      // A canceled request just means the user navigated away before it finished.
      // Don't surface that as a user-facing error.
      if (isCanceled(e)) return;
      setError(errorMessage(e));
    }
  }, []);

  return { recs, error, refresh };
}

/** True if the error looks like an aborted/canceled fetch. */
function isCanceled(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const anyE = e as any;
  if (anyE.name === "CanceledError" || anyE.name === "AbortError") return true;
  const msg = String(anyE.message ?? "").toLowerCase();
  return msg.includes("cancel") || msg.includes("abort");
}