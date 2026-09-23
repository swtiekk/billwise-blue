import { useCallback, useState } from "react";
import type { RiskAssessment } from "../api/types";
import { getRisk } from "../api/insights";
import { errorMessage } from "../api/client";

export function useRisk() {
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getRisk();
      setRisk(data);
      setError(null);
    } catch (e) {
      // Silent on cancellations — the user probably navigated away.
      if (isCanceled(e)) return;
      setError(errorMessage(e));
    }
  }, []);

  return { risk, error, refresh };
}

/** True if the error looks like an aborted/canceled fetch. */
function isCanceled(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const anyE = e as any;
  if (anyE.name === "CanceledError" || anyE.name === "AbortError") return true;
  const msg = String(anyE.message ?? "").toLowerCase();
  return msg.includes("cancel") || msg.includes("abort");
}

/**
 * The backend returns a label (STABLE / AT RISK / CRITICAL) with a colour indicator
 * (GREEN / AMBER / RED), not a 0-100 score, so the bar snaps to three positions.
 */
export function riskDisplay(risk: RiskAssessment | null) {
  if (!risk) {
    return { label: "Checking…", color: "#BFDBFE", barColor: "#94A3B8", pct: 0 };
  }
  switch (risk.label) {
    case "CRITICAL":
      return { label: "Critical", color: "#FCA5A5", barColor: "#FB7185", pct: 90 };
    case "AT RISK":
      return { label: "At Risk", color: "#FCD34D", barColor: "#FBBF24", pct: 55 };
    default:
      return { label: "Stable", color: "#6EE7B7", barColor: "#34D399", pct: 20 };
  }
}