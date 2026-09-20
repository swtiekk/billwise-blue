import { useCallback, useState } from "react";
import type { RecommendationsResponse } from "../api/types";
import { getRecommendations } from "../api/insights";
import { errorMessage } from "../api/client";

export function useRecommendations() {
  const [recs, setRecs] = useState<RecommendationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRecs(await getRecommendations());
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  return { recs, error, refresh };
}
