import { CheckCircle2, AlertTriangle } from "lucide-react-native";
import { C } from "../theme";
import type { PisoMood } from "../components/Piso";
import type { RiskLabel } from "../api/types";

/** How each risk level looks everywhere (Home tile, Tips card, Piso's face). Wording follows your flow. */
export const STATUS: Record<
  RiskLabel,
  { label: string; note: string; bg: string; fg: string; Icon: any; mood: PisoMood; step: 0 | 1 | 2 }
> = {
  STABLE: { label: "Stable", note: "You're covered", bg: C.greenBg, fg: "#0B6B53", Icon: CheckCircle2, mood: "happy", step: 0 },
  "AT RISK": { label: "At risk", note: "Watch your spending", bg: C.amberBg, fg: "#9A4308", Icon: AlertTriangle, mood: "worried", step: 1 },
  CRITICAL: { label: "Critical", note: "Act on this soon", bg: C.redBg, fg: "#A3182F", Icon: AlertTriangle, mood: "worried", step: 2 },
};
