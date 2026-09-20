import type { BudgetBill } from "../api/bills";
import { amountLabel } from "../api/bills";
import { splitISO } from "../utils/dates";

export type ReminderKind = "3-days" | "1-day" | "due-today";

export interface PlannedReminder {
  when: Date;
  kind: ReminderKind;
  billId: string;
  title: string;
  body: string;
}

/** Reminders arrive at this local hour (9 = 9:00 AM). */
export const REMIND_HOUR = 9;

const OFFSETS: { days: number; kind: ReminderKind }[] = [
  { days: 3, kind: "3-days" },
  { days: 1, kind: "1-day" },
  { days: 0, kind: "due-today" },
];

// "Meralco Electric Bill" already ends in "bill", so don't say "bill bill".
const billLabel = (name: string) => (/bill\s*$/i.test(name.trim()) ? name.trim() : `${name.trim()} bill`);

function textFor(kind: ReminderKind, bill: BudgetBill): { title: string; body: string } {
  const label = billLabel(bill.name);
  const priority = bill.priority ? ` | ${bill.priority.toUpperCase()} PRIORITY` : "";

  switch (kind) {
    case "3-days":
      return {
        title: `${label} due in 3 days!`,
        body: `Amount: ${amountLabel(bill)}${priority}\n${bill.hasPenalty ? "Pay now to avoid penalty" : "Plan your payment"}`,
      };
    case "1-day":
      return {
        title: `${label} due TOMORROW!`,
        body: bill.hasPenalty ? "Don't miss it — penalty applies" : "Don't forget to pay it",
      };
    default:
      return {
        title: `${label} is due TODAY!`,
        body: bill.hasPenalty ? "Pay now to avoid penalty" : "Pay it today",
      };
  }
}

/**
 * Every reminder that should still fire, soonest first.
 * Skips paid bills, bills without a due date, and reminder times that have already passed.
 */
export function buildReminderPlan(bills: BudgetBill[], now: Date = new Date()): PlannedReminder[] {
  const plan: PlannedReminder[] = [];

  for (const bill of bills) {
    if (bill.status === "paid" || !bill.dueDate) continue;
    const parts = splitISO(bill.dueDate);
    if (!parts) continue;
    const [year, month, day] = parts;

    for (const { days, kind } of OFFSETS) {
      // Date() rolls a day of 0 or less back into the previous month, so due day 2 minus 3 works
      const when = new Date(year, month - 1, day - days, REMIND_HOUR, 0, 0, 0);
      if (when.getTime() <= now.getTime()) continue;
      plan.push({ when, kind, billId: bill.id, ...textFor(kind, bill) });
    }
  }

  return plan.sort((a, b) => a.when.getTime() - b.when.getTime());
}
