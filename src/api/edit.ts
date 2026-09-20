import { api } from "./client";
import type { ApiBill, Household } from "./types";
import type { SetupDraft } from "../context/SetupContext";
import type { BillInput } from "../navigation/billBus";
import { bandFor, bandForRange } from "../constants/options";
import { parseRange } from "./bills";

// ---------------------------------------------------------------- read

export interface ServerEarner {
  earner_id: number;
  first_name: string;
  last_name: string;
  income_id: number | null;
  frequency: string;
  range_amount: string;
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
    totalMembers: h.total_members ? String(h.total_members) : "",
    dependents: String(h.no_of_dependents ?? 0),
    housing: h.housing_type || "",
    earners: s.earners.map((e) => ({
      id: `e${e.earner_id}`,
      serverId: e.earner_id,
      firstName: e.first_name,
      lastName: e.last_name,
      frequency: e.frequency || "Monthly",
      incomeRange: bandForRange(e.range_amount)?.label ?? "",
      nextPayday: e.next_payday ?? "",
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
      total_members: Number(d.totalMembers),
      no_of_dependents: Number(d.dependents || "0"),
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
      next_payday: e.nextPayday,
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
  amount: b.amount ?? null,
  min_amount: b.min ?? b.amount ?? 0,
  max_amount: b.max ?? b.amount ?? 0,
});

export const createSetupBill = (b: BillInput) => api.post<ApiBill>("/api/setup/bills/", billBody(b));

export const updateSetupBill = (id: string, b: BillInput) => api.put<ApiBill>(`/api/setup/bills/${id}/`, billBody(b));

export const deleteSetupBill = (id: string) => api.delete(`/api/setup/bills/${id}/`);

// ---------------------------------------------------------------- Update This Period's Bills

export const updateBillAmounts = (items: { id: string; amount: number }[]) =>
  api.post("/api/setup/bills/amounts/", {
    bills: items.map((i) => ({ allocation_id: Number(i.id), amount: i.amount })),
  });
