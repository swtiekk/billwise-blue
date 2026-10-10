import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { BillInput } from "../navigation/billBus";

export interface DraftEarner {
  id: string;
  serverId?: number; // set when the earner already exists in the database (edit mode)
  firstName: string;
  lastName: string;
  frequency: string; // Weekly | Twice a month | Monthly
  incomeRange: string; // an INCOME_BANDS label (amount per payday), "" until chosen
  paydayWeekday: number | null; // Weekly: 0 = Monday ... 6 = Sunday
  payday1: number | null; // Monthly / Twice a month: day of month (31 = end of month)
  payday2: number | null; // Twice a month: the second day
}

export interface DraftBill {
  id: string;
  allocationId?: number; // set when the bill already exists in the database (edit mode)
  name: string;
  category: string;
  dueDay: number;
  graceDays: number;
  hasPenalty: boolean;
  billerId?: number; // enrolled biller; its rules fill in grace period and penalty
  reminderDay?: number; // remind me every month on this day (31 = end of month)
  isDaily?: boolean; // min / max are per day instead of per month
  amount?: number;
  dueDate?: string;
  min: string; // Setup 4 inputs (strings so they can be edited freely)
  max: string;
}

/** A dependent is only a relationship. They belong to the household, so no earner needs to be picked. */
export interface DraftDependent {
  id: string;
  relationship: string; // Child | Parent | Grandparent (or the legacy "Parent / grandparent")
}

export interface SetupDraft {
  dependents: DraftDependent[];
  housing: string; // Renting | Not renting
  earners: DraftEarner[];
  bills: DraftBill[];
  dailyFood: string;
  dailyTransport: string;
}

const EMPTY: SetupDraft = {
  dependents: [],
  housing: "",
  earners: [],
  bills: [],
  dailyFood: "",
  dailyTransport: "",
};

const uid = () => Math.random().toString(36).slice(2, 10);

interface SetupValue {
  draft: SetupDraft;
  patch: (p: Partial<Pick<SetupDraft, "housing" | "dailyFood" | "dailyTransport">>) => void;
  addDependent: (relationship: string) => void;
  removeDependent: (id: string) => void;
  addEarner: (firstName: string, lastName: string) => void;
  updateEarner: (id: string, p: Partial<DraftEarner>) => void;
  removeEarner: (id: string) => void;
  addBill: (b: BillInput) => void;
  updateBill: (id: string, p: Partial<DraftBill>) => void;
  removeBill: (id: string) => void;
  /** Replace the whole draft, e.g. with the saved setup when an Edit screen opens. */
  replace: (d: SetupDraft) => void;
  reset: () => void;
}

const SetupContext = createContext<SetupValue | null>(null);

export function SetupProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<SetupDraft>(EMPTY);

  const patch = useCallback<SetupValue["patch"]>((p) => setDraft((d) => ({ ...d, ...p })), []);

  const addDependent = useCallback((relationship: string) => {
    setDraft((d) => ({ ...d, dependents: [...d.dependents, { id: uid(), relationship }] }));
  }, []);

  const removeDependent = useCallback((id: string) => {
    setDraft((d) => ({ ...d, dependents: d.dependents.filter((x) => x.id !== id) }));
  }, []);

  const addEarner = useCallback((firstName: string, lastName: string) => {
    setDraft((d) => ({
      ...d,
      earners: [
        ...d.earners,
        { id: uid(), firstName, lastName, frequency: "Monthly", incomeRange: "", paydayWeekday: null, payday1: null, payday2: null },
      ],
    }));
  }, []);

  const updateEarner = useCallback((id: string, p: Partial<DraftEarner>) => {
    setDraft((d) => ({ ...d, earners: d.earners.map((e) => (e.id === id ? { ...e, ...p } : e)) }));
  }, []);

  const removeEarner = useCallback((id: string) => {
    setDraft((d) => ({ ...d, earners: d.earners.filter((e) => e.id !== id) }));
  }, []);

  const addBill = useCallback((b: BillInput) => {
    setDraft((d) => ({
      ...d,
      bills: [
        ...d.bills,
        {
          id: uid(),
          name: b.name,
          category: b.category,
          dueDay: b.dueDay,
          graceDays: b.graceDays,
          hasPenalty: b.hasPenalty,
          billerId: b.billerId,
          reminderDay: b.reminderDay,
          isDaily: b.isDaily,
          amount: b.amount,
          dueDate: b.dueDate,
          // the enrollment form supplies the estimated range; a scan starts it at the scanned amount
          min: b.min != null ? String(b.min) : b.amount != null ? String(b.amount) : "",
          max: b.max != null ? String(b.max) : b.amount != null ? String(b.amount) : "",
        },
      ],
    }));
  }, []);

  const updateBill = useCallback((id: string, p: Partial<DraftBill>) => {
    setDraft((d) => ({ ...d, bills: d.bills.map((b) => (b.id === id ? { ...b, ...p } : b)) }));
  }, []);

  const removeBill = useCallback((id: string) => {
    setDraft((d) => ({ ...d, bills: d.bills.filter((b) => b.id !== id) }));
  }, []);

  const replace = useCallback((d: SetupDraft) => setDraft(d), []);
  const reset = useCallback(() => setDraft(EMPTY), []);

  const value = useMemo(
    () => ({ draft, patch, addDependent, removeDependent, addEarner, updateEarner, removeEarner, addBill, updateBill, removeBill, replace, reset }),
    [draft, patch, addDependent, removeDependent, addEarner, updateEarner, removeEarner, addBill, updateBill, removeBill, replace, reset]
  );

  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>;
}

export function useSetup(): SetupValue {
  const ctx = useContext(SetupContext);
  if (!ctx) throw new Error("useSetup must be used inside <SetupProvider>");
  return ctx;
}

/** What the backend stores: children, and seniors (a parent or grandparent). */
export function dependentCounts(deps: DraftDependent[]) {
  const children = deps.filter((d) => d.relationship === "Child").length;
  return { children, seniors: deps.length - children };
}

/** Sum of the income bands chosen so far (per pay period). */
export function combinedIncome(earners: DraftEarner[], bandFor: (label: string) => { min: number; max: number } | undefined) {
  return earners.reduce(
    (acc, e) => {
      const band = bandFor(e.incomeRange);
      return band ? { min: acc.min + band.min, max: acc.max + band.max } : acc;
    },
    { min: 0, max: 0 }
  );
}
