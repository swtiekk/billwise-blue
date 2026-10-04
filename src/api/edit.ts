import { api } from "./client";
import type { ApiBill, Household } from "./types";
import type { SetupDraft } from "../context/SetupContext";
import type { BillInput } from "../navigation/billBus";
import { bandFor, bandForRange, normalizeFrequency } from "../constants/options";
import { parseRange } from "./bills";

// ---------------------------------------------------------------- read

export interface ServerEarner {
  earner_id: number;
  first_name: string;
  last_name: string;
  income_id: number | null;
  frequency: string;
  range_amount: string;
  payday_weekday: number | null;
  payday_day_1: number | null;
  payday_day_2: number | null;
  next_payday: string | null;
}

export interface CurrentSetup {
  household: Household;
  earners: ServerEarner[];
  bills: ApiBill[];
}

export const fetchCurrentSetup = () => api.get<CurrentSetup>("/api/setup/current/");

export const getHousehold = () => api.get<Household>("/api/household/");

const num = (v: string | number | null | undefined) => String(Number(v ?? 0));

/** Turn the saved setup into the same draft shape the setup screens already use. */
export function toDraft(s: CurrentSetup): SetupDraft {
  const h = s.household;
  return {
    children: String(h.no_of_children ?? 0),
    seniors: String(h.no_of_seniors ?? 0),
    housing: h.housing_type || "",
    earners: s.earners.map((e) => ({
      id: `e${e.earner_id}`,
      serverId: e.earner_id,
      firstName: e.first_name,
      lastName: e.last_name,
      frequency: normalizeFrequency(e.frequency),
      incomeRange: bandForRange(e.range_amount)?.label ?? "",
      paydayWeekday: e.payday_weekday,
      payday1: e.payday_day_1,
      payday2: e.payday_day_2,
    })),
    bills: s.bills.map((b) => {
      const [lo, hi] = parseRange(b.budget_amount_range);
      return {
        id: `b${b.budget_allocation_id}`,
        allocationId: b.budget_allocation_id,
        name: b.item_desc ?? "Bill",
        category: b.category_desc ?? "Other",
        dueDay: b.due_day ?? 1,
        graceDays: b.grace_period_days ?? 0,
        hasPenalty: !!b.penalty_classification,
        billerId: b.biller_id ?? undefined,
        reminderDay: b.reminder_day ?? undefined,
        isDaily: !!b.is_daily,
        amount: b.amount != null ? Number(b.amount) : undefined,
        dueDate: b.actual_due_date ?? undefined,
        min: String(lo),
        max: String(hi),
      };
    }),
    dailyFood: num(h.daily_food_expense_min),
    dailyTransport: num(h.daily_transport_expense_min),
  };
}

// ---------------------------------------------------------------- save (one call per edit screen)

export const saveHouseholdEdit = (d: SetupDraft) =>
  api.put("/api/setup/household/", {
    household: {
      no_of_children: Number(d.children || "0"),
      no_of_seniors: Number(d.seniors || "0"),
      housing_type: d.housing,
    },
    earners: d.earners.map((e) => ({
      earner_id: e.serverId ?? null,
      first_name: e.firstName,
      last_name: e.lastName,
    })),
  });

export const saveIncomeEdit = (d: SetupDraft) =>
  api.put("/api/setup/income/", {
    earners: d.earners.map((e) => ({
      earner_id: e.serverId,
      frequency: e.frequency,
      range_amount: bandFor(e.incomeRange)?.value ?? "",
      payday_weekday: e.frequency === "Weekly" ? e.paydayWeekday : null,
      payday_day_1: e.frequency === "Weekly" ? null : e.payday1,
      payday_day_2: e.frequency === "Twice a month" ? e.payday2 : null,
    })),
  });

export const saveRangesEdit = (d: SetupDraft) =>
  api.put("/api/setup/ranges/", {
    bills: d.bills
      .filter((b) => b.allocationId != null)
      .map((b) => ({ allocation_id: b.allocationId, min_amount: Number(b.min), max_amount: Number(b.max) })),
    daily_food: Number(d.dailyFood),
    daily_transport: Number(d.dailyTransport),
  });

// ---------------------------------------------------------------- bills (Edit Budget Items)

const billBody = (b: BillInput) => ({
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
  min_amount: b.min ?? b.amount ?? 0,
  max_amount: b.max ?? b.amount ?? 0,
});

export const createSetupBill = (b: BillInput) => api.post<ApiBill>("/api/setup/bills/", billBody(b));

export const updateSetupBill = (id: string, b: BillInput) => api.put<ApiBill>(`/api/setup/bills/${id}/`, billBody(b));

/** The priority a bill would get if saved now (nothing is written). Used by the scan review. */
export interface PriorityPreview {
  priority_level: "High" | "Medium" | "Low";
  budget_classification: string;
  rule_applied: string;
  reason: string;
  grace_period_days: number;
  penalty_classification: boolean;
}
export const previewPriority = (b: { name: string; category: string; dueDate: string; billerId?: number | null }) =>
  api.post<PriorityPreview>("/api/bills/preview-priority/", {
    item_desc: b.name,
    category: b.category,
    due_date: b.dueDate,
    biller_id: b.billerId ?? null,
  });

/** Plan to pay a deferrable bill after payday (or undo it). The bill's real due date doesn't change. */
export const setBillDeferred = (id: string, deferred: boolean) => api.post<ApiBill>(`/api/bills/${id}/defer/`, { deferred });

/** Mark a bill paid (or undo it). BillWise only monitors: this records that you paid it elsewhere. */
export const setBillPaid = (id: string, paid: boolean) => api.post<ApiBill>(`/api/bills/${id}/pay/`, { is_paid: paid });

export const deleteSetupBill = (id: string) => api.delete(`/api/setup/bills/${id}/`);

// ---------------------------------------------------------------- Update This Period's Bills

export const updateBillAmounts = (items: { id: string; amount: number }[]) =>
  api.post("/api/setup/bills/amounts/", {
    bills: items.map((i) => ({ allocation_id: Number(i.id), amount: i.amount })),
  });
