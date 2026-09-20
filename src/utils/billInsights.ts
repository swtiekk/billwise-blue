import type { BudgetBill } from "../api/bills";
import { amountLabel } from "../api/bills";
import type { RiskAssessment, RiskLabel } from "../api/types";
import { daysUntil } from "./dates";
import { fmt } from "../theme";

// ---------------------------------------------------------------- ranking / grouping

export type Half = "1st Half" | "2nd Half";

export const halfOf = (b: BudgetBill): Half =>
  b.periodHalf === "1st Half" || b.periodHalf === "2nd Half"
    ? b.periodHalf
    : (b.dueDay ?? 1) <= 15
    ? "1st Half"
    : "2nd Half";

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 } as const;

/** High -> Medium -> Low -> unclassified; ties broken by due date. */
export function sortByPriority(bills: BudgetBill[]): BudgetBill[] {
  return [...bills].sort((a, b) => {
    const pa = a.priority ? PRIORITY_RANK[a.priority] : 3;
    const pb = b.priority ? PRIORITY_RANK[b.priority] : 3;
    if (pa !== pb) return pa - pb;
    return (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31");
  });
}

export function sumBills(bills: BudgetBill[]) {
  return bills.reduce(
    (acc, b) => ({ min: acc.min + b.amountMin, max: acc.max + b.amountMax, count: acc.count + 1 }),
    { min: 0, max: 0, count: 0 }
  );
}

export const rangeText = (min: number, max: number) => (min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`);

// ---------------------------------------------------------------- explanations

/** One-line reason for a bill's classification (mirrors the rule engine on the backend). */
export function explainBill(b: BudgetBill): string {
  if (b.classification === "Non-deferrable") {
    return "Essential bill with a late penalty and little or no grace period. It can't be postponed, so pay it first.";
  }
  if (b.classification === "Deferrable") {
    if (b.priority === "Low") {
      return "Not essential and no penalty for paying late. It's the first bill to postpone if money runs short.";
    }
    return b.graceDays > 0
      ? `Can be delayed if needed: there's a ${b.graceDays}-day grace period before a penalty applies.`
      : "Can be delayed if money runs short, but a penalty may apply the longer it waits.";
  }
  return "Not classified yet. Re-run the analysis to assign a priority.";
}

// ---------------------------------------------------------------- risk projection

/** Same thresholds as assess_financial_risk() in risk.py (uses the conservative remaining budget). */
export function projectRisk(risk: RiskAssessment, freed: number): RiskLabel {
  const remaining = Number(risk.remaining_budget_min) + freed;
  const need = Number(risk.total_daily_need_min);
  if (need === 0 || remaining > need) return "STABLE";
  if (remaining >= need * 0.8) return "AT RISK";
  return "CRITICAL";
}

// ---------------------------------------------------------------- tips

export type TipKind = "warning" | "success" | "info";
export interface Tip {
  id: string;
  kind: TipKind;
  icon: "alert" | "check" | "info" | "calendar";
  title: string;
  desc: string;
}

const names = (bills: BudgetBill[]) =>
  bills.slice(0, 3).map((b) => b.name).join(", ") + (bills.length > 3 ? ` and ${bills.length - 3} more` : "");

const whenText = (days: number) => (days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`);

export function buildTips(bills: BudgetBill[], risk: RiskAssessment | null): Tip[] {
  const tips: Tip[] = [];
  const open = bills.filter((b) => b.status !== "paid");

  if (risk) {
    if (risk.label === "CRITICAL") {
      tips.push({ id: "risk", kind: "warning", icon: "alert", title: "Your budget is critical", desc: "Your remaining budget won't cover daily expenses until payday. Consider deferring the bills below." });
    } else if (risk.label === "AT RISK") {
      tips.push({ id: "risk", kind: "warning", icon: "alert", title: "Your budget is at risk", desc: "Your remaining budget may not cover daily expenses until payday. Consider deferring the bills below." });
    } else {
      tips.push({ id: "risk", kind: "success", icon: "check", title: "Your budget looks stable", desc: `Your remaining budget covers daily expenses until your next payday (${risk.days_until_next_payday} days).` });
    }
  }

  const overdue = open.filter((b) => b.status === "overdue");
  if (overdue.length > 0) {
    tips.push({
      id: "overdue",
      kind: "warning",
      icon: "alert",
      title: overdue.length === 1 ? `${overdue[0].name} is overdue` : `${overdue.length} bills are overdue`,
      desc: overdue.length === 1
        ? "Pay it as soon as you can to limit late penalties."
        : `${names(overdue)}. Pay them as soon as you can to limit late penalties.`,
    });
  }

  for (const b of open.filter((x) => x.status === "due-soon").slice(0, 3)) {
    const d = b.dueDate ? daysUntil(b.dueDate) : 0;
    tips.push({
      id: `due-${b.id}`,
      kind: "warning",
      icon: "calendar",
      title: `${b.name} is due ${whenText(d)}`,
      desc: `${amountLabel(b)} · ${b.priority ?? "Unclassified"} priority${b.hasPenalty ? " · a late penalty applies" : ""}.`,
    });
  }

  const nonDeferrable = open.filter((b) => b.classification === "Non-deferrable");
  if (nonDeferrable.length > 0) {
    const total = sumBills(nonDeferrable);
    tips.push({
      id: "nondef",
      kind: "info",
      icon: "info",
      title: "Pay these first",
      desc: `${nonDeferrable.length} non-deferrable bill${nonDeferrable.length > 1 ? "s" : ""} total ${rangeText(total.min, total.max)} this period.`,
    });
  }

  const unclassified = bills.filter((b) => !b.priority);
  if (unclassified.length > 0) {
    tips.push({
      id: "unclassified",
      kind: "info",
      icon: "info",
      title: `${unclassified.length} bill${unclassified.length > 1 ? "s aren't" : " isn't"} classified`,
      desc: "Re-run the analysis to assign a priority to each bill.",
    });
  }

  if (tips.length === 0) {
    tips.push({ id: "empty", kind: "info", icon: "info", title: "No recommendations yet", desc: "Add bills to get personalised recommendations." });
  }
  return tips;
}
