import * as FileSystem from "expo-file-system/legacy";
import { BASE_URL } from "./client";
import { getAccessToken } from "./tokenStorage";
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
  amount: number | null;
  amountMin: number;
  amountMax: number;
  dueDate: string | null;
  dueDay: number | null;
  graceDays: number;
  hasPenalty: boolean;
  priority: "High" | "Medium" | "Low" | null;
  classification: "Non-deferrable" | "Deferrable" | null;
  ruleApplied: RuleApplied;
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
  if (d <= 3) return "due-soon";
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
    ruleApplied: b.rule_applied ?? null,
    periodHalf: b.period_half,
    status: deriveStatus(b),
  };
}

/** "₱2,500" or "₱2,000 – ₱2,500" */
export function amountLabel(b: Pick<BudgetBill, "amountMin" | "amountMax">): string {
  return b.amountMin === b.amountMax ? fmt(b.amountMin) : `${fmt(b.amountMin)} – ${fmt(b.amountMax)}`;
}

export async function fetchBills(): Promise<BudgetBill[]> {
  const rows = await apiGetBills();
  return [...rows]
    .sort((a, b) => (a.actual_due_date ?? "9999-12-31").localeCompare(b.actual_due_date ?? "9999-12-31"))
    .map(mapBill);
}

// Small wrapper so we don't have to import `api` from client here (avoids a circular import
// after we moved the scan upload to expo-file-system).
async function apiGetBills(): Promise<ApiBill[]> {
  const res = await fetch(`${BASE_URL}/api/bills/`, {
    headers: { Authorization: `Bearer ${await getAccessToken()}` },
  });
  if (!res.ok) throw new Error(`Failed to load bills (${res.status})`);
  return res.json();
}

// ---------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------

/** Guess a MIME type from a file name when the picker doesn't supply one. */
function guessMimeType(filename: string): string {
  if (/\.pdf$/i.test(filename)) return "application/pdf";
  if (/\.png$/i.test(filename)) return "image/png";
  if (/\.heic$/i.test(filename)) return "image/heic";
  if (/\.webp$/i.test(filename)) return "image/webp";
  return "image/jpeg";
}

/**
 * Upload a bill image (or PDF) to the backend OCR endpoint.
 *
 * Uses `expo-file-system/legacy`'s `uploadAsync` instead of RN's `fetch` + FormData.
 * RN's FormData is unreliable for file uploads on the new Hermes + JSI architecture
 * (throws "Unsupported FormDataPart implementation") and often mangles the multipart
 * body. `uploadAsync` builds the multipart request natively, which is why it's the
 * recommended approach for Expo.
 */
export async function scanBill(
  uri: string,
  name?: string | null,
  mimeType?: string | null
): Promise<ScanResponse> {
  const filename = name || uri.split("/").pop() || "bill.jpg";
  const type = mimeType || guessMimeType(filename);

  const token = await getAccessToken();

  console.log("[scanBill] uri:", uri);
  console.log("[scanBill] filename:", filename);
  console.log("[scanBill] mimeType:", type);
  console.log("[scanBill] url:", `${BASE_URL}/api/bills/scan/`);
  console.log("[scanBill] uploadAsync available:", typeof FileSystem.uploadAsync);

  if (typeof FileSystem.uploadAsync !== "function") {
    throw new Error(
      "expo-file-system/legacy does not export uploadAsync. " +
        "Make sure `expo-file-system` is installed and Metro was restarted with --clear."
    );
  }

  // Use the numeric value (1 = MULTIPART). Enum names changed across SDKs; the
  // numeric value is stable and always accepted by the underlying native call.
  const result = await FileSystem.uploadAsync(
    `${BASE_URL}/api/bills/scan/`,
    uri,
    {
      httpMethod: "POST",
      uploadType: 1, // FileSystemUploadType.MULTIPART
      fieldName: "image",
      mimeType: type,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    } as any
  );

  console.log("[scanBill] status:", result.status);
  console.log("[scanBill] body:", result.body);

  if (result.status < 200 || result.status >= 300) {
    let message = `Scan failed (${result.status})`;
    try {
      const parsed = JSON.parse(result.body);
      message = parsed.error || parsed.detail || message;
    } catch {
      // body wasn't JSON — keep the status-code message
    }
    throw new Error(message);
  }

  return JSON.parse(result.body) as ScanResponse;
}

export type { BillInput };