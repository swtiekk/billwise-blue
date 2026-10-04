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
  billerId: number | null;
  reminderDay: number | null;
  isDaily: boolean;
  isDeferred: boolean; // planned for after payday (only Deferrable bills can be)
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
    billerId: b.biller_id ?? null,
    reminderDay: b.reminder_day ?? null,
    isDaily: !!b.is_daily,
    isDeferred: !!b.is_deferred,
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

// Small wrapper so we don't have to import `api` from client here (avoids a circular import).
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

const SCAN_URL = `${BASE_URL}/api/bills/scan/`;

/** Guess a MIME type from a file name when the picker doesn't supply one. */
function guessMimeType(filename: string): string {
  if (/\.pdf$/i.test(filename)) return "application/pdf";
  if (/\.png$/i.test(filename)) return "image/png";
  if (/\.heic$/i.test(filename)) return "image/heic";
  if (/\.webp$/i.test(filename)) return "image/webp";
  return "image/jpeg";
}

/** Make a safe file name — no spaces, no odd characters, ends with the right extension. */
function safeFileName(originalName: string): string {
  const ext = (originalName.match(/\.[a-z0-9]+$/i)?.[0] ?? ".bin").toLowerCase();
  return `bill-upload-${Date.now()}${ext}`;
}

/**
 * The single upload path for every scan.
 *
 * Uses XMLHttpRequest + FormData. On Expo SDK 57, global fetch rejects RN's
 * { uri, name, type } form parts ("Unsupported FormDataPart implementation"),
 * but XHR goes through React Native's own networking, which supports them and
 * reads file:// URIs natively (so Expo Go's path check never runs).
 *
 * Do NOT set Content-Type manually: the multipart boundary is added for us.
 */
function uploadViaFetch(
  uri: string,
  filename: string,
  mimeType: string,
  token: string | null
): Promise<ScanResponse> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("image", {
      uri,
      name: filename,
      type: mimeType,
    } as any);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", SCAN_URL);
    xhr.timeout = 60000;
    xhr.setRequestHeader("Accept", "application/json");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.onload = () => {
      const text = xhr.responseText;
      console.log("[upload] status:", xhr.status);

      if (xhr.status < 200 || xhr.status >= 300) {
        let message = `Scan failed (${xhr.status})`;
        try {
          const parsed = JSON.parse(text);
          message = parsed.error || parsed.detail || message;
        } catch {
          // body wasn't JSON, keep the status-code message
        }
        return reject(new Error(message));
      }

      try {
        resolve(JSON.parse(text) as ScanResponse);
      } catch {
        reject(new Error("The server sent back something I couldn't read."));
      }
    };

    xhr.onerror = () =>
      reject(new Error("Network request failed. Check your connection and that the server is reachable."));
    xhr.ontimeout = () => reject(new Error("The upload took too long. Please try again."));

    xhr.send(form);
  });
}

/**
 * Upload a bill image (or PDF) given a URI. Use for camera captures and gallery picks.
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

  return uploadViaFetch(uri, filename, type, token);
}

/**
 * Upload a bill (image or PDF) from a DocumentPicker result (file:// or content:// URI).
 */
export async function scanBillFromContentUri(
  contentUri: string,
  filename: string,
  mimeType?: string | null
): Promise<ScanResponse> {
  const type = mimeType || guessMimeType(filename);
  const token = await getAccessToken();

  console.log("[scanBillFromContentUri] uri:", contentUri);
  console.log("[scanBillFromContentUri] filename:", filename);
  console.log("[scanBillFromContentUri] mimeType:", type);

  return uploadViaFetch(contentUri, filename, type, token);
}

/**
 * Upload a bill that has ALREADY been read into a base64 string.
 *
 * Kept so existing imports still work. It writes the bytes into the app's own
 * documentDirectory (always readable), uploads that copy, then deletes it.
 */
export async function scanBillFromBase64(
  base64: string,
  filename: string,
  mimeType?: string | null
): Promise<ScanResponse> {
  const type = mimeType || guessMimeType(filename);
  const token = await getAccessToken();

  const copyTarget = `${FileSystem.documentDirectory}${safeFileName(filename)}`;
  try {
    await FileSystem.writeAsStringAsync(copyTarget, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (writeErr: any) {
    console.log("[scanBillFromBase64] write failed:", writeErr?.message);
    throw new Error("Could not prepare the file for upload. Please try again.");
  }

  try {
    return await uploadViaFetch(copyTarget, filename, type, token);
  } finally {
    FileSystem.deleteAsync(copyTarget, { idempotent: true }).catch(() => {});
  }
}

export type { BillInput };