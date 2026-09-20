import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { BillInput } from "../navigation/billBus";

export interface DraftEarner {
  id: string;
  firstName: string;
  lastName: string;
  frequency: string; // Weekly | Bi-monthly | Monthly
  incomeRange: string; // an INCOME_BANDS label, "" until chosen
  nextPayday: string; // YYYY-MM-DD, "" until chosen
}

export interface DraftBill {
  id: string;
  name: string;
  category: string;
  dueDay: number;
  graceDays: number;
  hasPenalty: boolean;
  amount?: number;
  dueDate?: string;
  min: string; // Setup 4 inputs (strings so they can be edited freely)
  max: string;
}

export interface SetupDraft {
  totalMembers: string;
  dependents: string;
  housing: string;
  earners: DraftEarner[];
  bills: DraftBill[];
  dailyFood: string;
  dailyTransport: string;
}

const EMPTY: SetupDraft = {
  totalMembers: "",
  dependents: "0",
  housing: "",
  earners: [],
  bills: [],
  dailyFood: "",
  dailyTransport: "",
};

const uid = () => Math.random().toString(36).slice(2, 10);

interface SetupValue {
  draft: SetupDraft;
  patch: (p: Partial<Pick<SetupDraft, "totalMembers" | "dependents" | "housing" | "dailyFood" | "dailyTransport">>) => void;
  addEarner: (firstName: string, lastName: string) => void;
  updateEarner: (id: string, p: Partial<DraftEarner>) => void;
  removeEarner: (id: string) => void;
  addBill: (b: BillInput) => void;
  updateBill: (id: string, p: Partial<DraftBill>) => void;
  removeBill: (id: string) => void;
  reset: () => void;
}

const SetupContext = createContext<SetupValue | null>(null);

export function SetupProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<SetupDraft>(EMPTY);

  const patch = useCallback<SetupValue["patch"]>((p) => setDraft((d) => ({ ...d, ...p })), []);

  const addEarner = useCallback((firstName: string, lastName: string) => {
    setDraft((d) => ({
      ...d,
      earners: [
        ...d.earners,
        { id: uid(), firstName, lastName, frequency: "Monthly", incomeRange: "", nextPayday: "" },
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
          amount: b.amount,
          dueDate: b.dueDate,
          // a scanned bill already has an amount, so start the range there
          min: b.amount != null ? String(b.amount) : "",
          max: b.amount != null ? String(b.amount) : "",
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

  const reset = useCallback(() => setDraft(EMPTY), []);

  const value = useMemo(
    () => ({ draft, patch, addEarner, updateEarner, removeEarner, addBill, updateBill, removeBill, reset }),
    [draft, patch, addEarner, updateEarner, removeEarner, addBill, updateBill, removeBill, reset]
  );

  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>;
}

export function useSetup(): SetupValue {
  const ctx = useContext(SetupContext);
  if (!ctx) throw new Error("useSetup must be used inside <SetupProvider>");
  return ctx;
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
    