import { api } from "./client";
import type { ApiBill, ScanResponse, RuleApplied } from "./types";
import type { BillCategory, BillStatus } from "../data";
import type { BillInput } from "../navigation/billBus";
import { fmt } from "../theme";
import { daysUntil } from "../utils/dates";

// ---------------------------------------------------------------
// Category helpers
// ---------------------------------------------------------------

/** Icon key used by <CategoryIcon>. */
export function categoryFromText(text?: string | null): BillCategory {
  const t = (text ?? "").toLowerCase();
  if (/electric|cepalco/.test(t)) return "electricity";
  if (/water|water district/.test(t)) return "water";
  if (/internet|wifi|wi-fi|broadband|fiber|converge/.test(t)) return "internet";
  if (/\brent\b|lease/.test(t)) return "rent";
  if (/insur|philhealth/.test(t)) return "insurance";
  if (/loan|sss|pag-?ibig|bdo/.test(t)) return "loan";
  if (/phone|mobile|postpaid|prepaid|globe|smart/.test(t)) return "phone";
  return "other";
}

const LABEL_BY_KEY: Record<BillCategory, string> = {
  electricity: "Electricity",
  water: "Water",
  internet: "Internet",
  rent: "Rent",
  insurance: "Insurance",
  loan: "Loan",
  phone: "Phone",
  other: "Other",
};

/** Dropdown label (one of BILL_CATEGORIES) guessed from free text such as a merchant name. */
export const guessCategoryLabel = (text?: string | null) => LABEL_BY_KEY[categoryFromText(text)];

// ---------------------------------------------------------------
// Backend allocation -> app bill
// ---------------------------------------------------------------

export interface BudgetBill {
  id: string;
  name: string;
  category: BillCategory; // icon key
  categoryDesc: string;
  amount: number | null; // last actual amount (set by Update This Period's Bills or a scan)
  amountMin: number;
  amountMax: number;
  dueDate: string | null; // YYYY-MM-DD
  dueDay: number | null;
  graceDays: number;
  hasPenalty: boolean;
  priority: "High" | "Medium" | "Low" | null;
  classification: "Non-deferrable" | "Deferrable" | null;
  ruleApplied: RuleApplied; // ← NEW: which Chapter III rule classified this bill
  periodHalf: string | null;
  status: BillStatus;
}

/** "2000.00-2500.00" -> [2000, 2500] */
export function parseRange(range: string | null | undefined): [number, number] {
  const parts = (range ?? "").replace(/[,\s]/g, "").split("-");
  const lo = Number(parts[0]);
  const hi = Number(parts[1] ?? parts[0]);
  const safeLo = Number.isFinite(lo) ? lo : 0;
  return [safeLo, Number.isFinite(hi) ? hi : safeLo];
}

function deriveStatus(b: ApiBill): BillStatus {
  if (b.is_paid) return "paid";
  if (!b.actual_due_date) return "upcoming";
  const d = daysUntil(b.actual_due_date);
  if (d < 0) return "overdue";
  if (d <= 3) return "due-soon"; // same window the backend uses for notifications
  return "upcoming";
}

export function mapBill(b: ApiBill): BudgetBill {
  const [lo, hi] = parseRange(b.budget_amount_range);
  const categoryDesc = b.category_desc ?? "Other";
  return {
    id: String(b.budget_allocation_id),
    name: b.item_desc ?? "Bill",
    category: categoryFromText(`${categoryDesc} ${b.item_desc ?? ""}`),
    categoryDesc,
    amount: b.amount != null ? Number(b.amount) : null,
    amountMin: lo,
    amountMax: hi,
    dueDate: b.actual_due_date,
    dueDay: b.due_day ?? null,
    graceDays: b.grace_period_days ?? 0,
    hasPenalty: !!b.penalty_classification,
    priority: b.priority_level,
    classification: b.budget_classification,
    ruleApplied: b.rule_applied ?? null, // ← NEW
    periodHalf: b.period_half,
    status: deriveStatus(b),
  };
}

/** "₱2,500" or "₱2,000 – ₱2,500" */
export function amountLabel(b: Pick<BudgetBill, "amountMin" | "amountMax">): string {
  return b.amountMin === b.amountMax ? fmt(b.amountMin) : `${fmt(b.amountMin)} – ${fmt(b.amountMax)}`;
}

export async function fetchBills(): Promise<BudgetBill[]> {
  const rows = await api.get<ApiBill[]>("/api/bills/");
  return [...rows]
    .sort((a, b) => (a.actual_due_date ?? "9999-12-31").localeCompare(b.actual_due_date ?? "9999-12-31"))
    .map(mapBill);
}

// ---------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------

export async function scanBill(uri: string): Promise<ScanResponse> {
  const filename = uri.split("/").pop() || "bill.jpg";
  const type = /\.png$/i.test(filename) ? "image/png" : "image/jpeg";

  const form = new FormData();
  // React Native's FormData accepts { uri, name, type } for files
  form.append("image", { uri, name: filename, type } as any);

  // Tesseract can be slow on the first request, so allow more time than usual.
  return api.post<ScanResponse>("/api/bills/scan/", form, { timeoutMs: 60000 });
}

export type { BillInput };