import type { BudgetBill } from "../api/bills";
import { daysUntil } from "./dates";

export interface Reason {
  text: string;
  /** push: a reason to pay sooner. ease: a reason it can wait or is less risky. */
  tone: "push" | "ease";
}

// The five Chapter III rules plus the extensions that fill their gaps (api/views.py classify_bill).
const ESSENTIAL = ["Rule 1", "Rule 2", "Rule 2 (out of period)", "Rule 2 extension (no penalty)"];
const IMPORTANT = ["Rule 3", "Rule 3 (no grace)", "Rule 3 (no penalty)"];
const OPTIONAL = ["Rule 4a", "Rule 4b"];

/**
 * Plain-language reasons behind a bill's priority. The rule that fired (from the backend) decides the
 * service type; the bill's own penalty, grace period and due date supply the rest. Nothing is invented.
 */
export function priorityReasons(b: BudgetBill): Reason[] {
  const rule = b.ruleApplied as string | null;
  const out: Reason[] = [];

  if (b.status !== "paid" && b.dueDate && !b.isDaily) {
    const d = daysUntil(b.dueDate);
    if (d < 0) out.push({ text: "Past its due date", tone: "push" });
    else if (d === 0) out.push({ text: "Due today", tone: "push" });
    else if (d === 1) out.push({ text: "Due tomorrow", tone: "push" });
    else if (d <= 3) out.push({ text: `Due in ${d} days`, tone: "push" });
  }

  if (!rule || rule === "Fallback") {
    out.push({
      text: rule === "Fallback" ? "Category not recognized, so a cautious default was used" : "Ranked using its due date, penalty and service type",
      tone: "ease",
    });
    return out;
  }

  if (ESSENTIAL.includes(rule)) out.push({ text: "Essential service", tone: "push" });
  else if (IMPORTANT.includes(rule)) out.push({ text: "Important service", tone: "push" });
  else if (OPTIONAL.includes(rule)) out.push({ text: "Optional spending", tone: "ease" });

  if (b.hasPenalty) {
    out.push({ text: "Paying late can add a penalty", tone: "push" });
    out.push(
      b.graceDays > 0
        ? { text: `${b.graceDays}-day grace period (it only delays the penalty)`, tone: "ease" }
        : { text: "No grace period after the due date", tone: "push" }
    );
  } else {
    out.push({ text: "No late penalty", tone: "ease" });
  }

  if (rule === "Rule 2 (out of period)") out.push({ text: "Due after this pay period, so it can wait", tone: "ease" });

  return out;
}
