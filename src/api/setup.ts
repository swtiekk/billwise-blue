import { api } from "./client";
import { getRecommendations, getRisk } from "./insights";
import type { Household } from "./types";
import type { SetupDraft } from "../context/SetupContext";
import { bandFor } from "../constants/options";

export interface SetupPayload {
  household: { no_of_children: number; no_of_seniors: number; housing_type: string };
  earners: {
    first_name: string;
    last_name: string;
    frequency: string;
    range_amount: string;
    payday_weekday: number | null;
    payday_day_1: number | null;
    payday_day_2: number | null;
  }[];
  bills: {
    item_desc: string;
    category: string;
    due_day: number;
    due_date: string | null;
    grace_period_days: number;
    penalty_classification: boolean;
    biller_id: number | null;
    reminder_day: number | null;
    is_daily: boolean;
    amount: number | null;
    min_amount: number;
    max_amount: number;
  }[];
  daily_food: number;
  daily_transport: number;
}

export function buildSetupPayload(d: SetupDraft): SetupPayload {
  return {
    household: {
      no_of_children: Number(d.children || "0"),
      no_of_seniors: Number(d.seniors || "0"),
      housing_type: d.housing,
    },
    earners: d.earners.map((e) => ({
      first_name: e.firstName,
      last_name: e.lastName,
      frequency: e.frequency,
      range_amount: bandFor(e.incomeRange)?.value ?? "",
      payday_weekday: e.frequency === "Weekly" ? e.paydayWeekday : null,
      payday_day_1: e.frequency === "Weekly" ? null : e.payday1,
      payday_day_2: e.frequency === "Twice a month" ? e.payday2 : null,
    })),
    bills: d.bills.map((b) => ({
      item_desc: b.name,
      category: b.category,
      due_day: b.dueDay,
      due_date: b.dueDate ?? null,
      grace_period_days: b.graceDays,
      penalty_classification: b.hasPenalty,
      biller_id: b.billerId ?? null,
      reminder_day: b.reminderDay ?? null,
      is_daily: !!b.isDaily,
      amount: b.amount ?? null,
      min_amount: Number(b.min),
      max_amount: Number(b.max),
    })),
    daily_food: Number(d.dailyFood),
    daily_transport: Number(d.dailyTransport),
  };
}

/** One request saves household, earners, incomes and bills in a single transaction. */
export const submitSetup = (payload: SetupPayload) =>
  api.post<{ message: string; household: Household }>("/api/setup/submit/", payload, { timeoutMs: 30000 });

/** Classify bills, then compute risk + recommendations (the "Analysis" screen). */
export async function runAnalysis() {
  await api.post("/api/bills/prioritize/");
  const [risk, recommendations] = await Promise.all([getRisk(), getRecommendations()]);
  return { risk, recommendations };
}
