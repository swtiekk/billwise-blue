import { Platform } from "react-native";
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
  if (/loan|sss|gsis|pag-?ibig|bdo/.test(t)) return "loan";
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

/** Guess a MIME type from a file name when the picker doesn't supply one. */
function guessMimeType(filename: string): string {
  if (/\.pdf$/i.test(filename)) return "application/pdf";
  if (/\.png$/i.test(filename)) return "image/png";
  if (/\.heic$/i.test(filename)) return "image/heic";
  if (/\.webp$/i.test(filename)) return "image/webp";
  return "image/jpeg";
}

/** "data:image/png;base64,AAAA..." -> "image/png" (empty string if it can't be read). */
function mimeFromDataUri(uri: string): string {
  const semicolon = uri.indexOf(";");
  const comma = uri.indexOf(",");
  const end = semicolon > 0 ? semicolon : comma;
  return end > 5 ? uri.slice(5, end) : "";
}

/** A browser hands back the whole picture as a data: URI; never print thousands of characters of it. */
function shortUri(uri: string): string {
  return uri.length > 120 ? `${uri.slice(0, 60)}...(${uri.length} characters)` : uri;
}

/**
 * Print the OCR response in a way that's easy to read in the Metro terminal:
 * the extracted fields one per line, then the raw OCR text wrapped in markers.
 */
function logScanResponse(status: number, bodyText: string) {
  console.log("[scanBill] status:", status);
  try {
    const parsed = JSON.parse(bodyText);
    console.log("[scanBill] extracted:", {
      amount: parsed?.extracted?.amount ?? null,
      due_date: parsed?.extracted?.due_date ?? null,
      merchant: parsed?.extracted?.merchant ?? null,
    });
    console.log("[scanBill] method:", parsed?.method ?? parsed?.source_type ?? "?",
                "confidence:", parsed?.confidence ?? "?");
    console.log("[scanBill] raw_text START >>>");
    console.log(parsed?.raw_text ?? "(no raw_text)");
    console.log("[scanBill] raw_text END <<<");
  } catch {
    // Not JSON — just print whatever came back
    console.log("[scanBill] body (non-JSON):", bodyText);
  }
}

/**
 * Attach the picture as the "image" field. A phone and a browser need different shapes:
 *
 * - On a phone, React Native's networking understands { uri, name, type } and reads the file
 *   itself.
 * - In a browser that object is NOT understood: it is sent as the text "[object Object]", the
 *   server finds no file, and answers 'No file provided. Use form field "image"'. A browser needs
 *   real bytes, so read them from the picked image's address (a blob: or data: URI) and attach
 *   them as a Blob with a file name.
 */
async function addImagePart(form: FormData, uri: string, filename: string, mimeType: string): Promise<void> {
  if (Platform.OS === "web") {
    let blob: Blob;
    try {
      blob = await (await fetch(uri)).blob();
    } catch {
      throw new Error("Could not read the selected file. Please try again.");
    }
    // Make sure the file carries the right type, whatever the browser reported
    const typed = blob.slice(0, blob.size, mimeType || blob.type || "image/jpeg");
    (form as any).append("image", typed, filename);
    return;
  }
  form.append("image", { uri, name: filename, type: mimeType } as any);
}

/**
 * Upload via XMLHttpRequest + FormData.
 *
 * Why not the other options:
 * - FileSystem.uploadAsync fails in Expo Go with "Location ... isn't readable"
 *   for files that come from DocumentPicker.
 * - Global fetch + FormData fails on this SDK with "Unsupported FormDataPart implementation".
 * - XHR goes through React Native's own networking, which supports { uri, name, type }
 *   form parts and reads file:// URIs natively. In a browser it is the normal XHR.
 *
 * Do NOT set Content-Type manually: the multipart boundary is added for you.
 */
async function uploadViaXhr(
  uri: string,
  filename: string,
  mimeType: string,
  token: string | null
): Promise<ScanResponse> {
  const form = new FormData();
  await addImagePart(form, uri, filename, mimeType);

  return new Promise<ScanResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/api/bills/scan/`);
    xhr.timeout = 60000;
    xhr.setRequestHeader("Accept", "application/json");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.onload = () => {
      const text = xhr.responseText;
      logScanResponse(xhr.status, text);

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

    // Log the actual file size so we can verify the phone isn't uploading a
    // downsampled thumbnail instead of the full-resolution photo. This runs
    // in parallel with the upload; the log appears in Metro once it resolves.
    // (Not available in a browser: expo-file-system has no file paths to read there.)
    if (Platform.OS !== "web") {
      FileSystem.getInfoAsync(uri)
        .then((info: any) => {
          console.log("[uploadViaXhr] file size:", info?.size ?? "unknown", "bytes");
        })
        .catch(() => {
          console.log("[uploadViaXhr] could not read file size for", uri);
        });
    }

    xhr.send(form);
  });
}

/**
 * Upload a bill image (or PDF) to the backend OCR endpoint.
 * Used for camera captures, gallery picks and DocumentPicker files.
 */
export async function scanBill(
  uri: string,
  name?: string | null,
  mimeType?: string | null
): Promise<ScanResponse> {
  // On the web the picked image's address is a long data: or blob: string, not a file path
  const isInline = uri.startsWith("data:") || uri.startsWith("blob:");
  const type =
    mimeType ||
    (uri.startsWith("data:") ? mimeFromDataUri(uri) : "") ||
    guessMimeType(name || uri);
  const extension = type === "application/pdf" ? "pdf" : type === "image/png" ? "png" : "jpg";
  const filename =
    name || (isInline ? `bill-${Date.now()}.${extension}` : uri.split("/").pop() || "bill.jpg");

  const token = await getAccessToken();

  console.log("[scanBill] uri:", shortUri(uri));
  console.log("[scanBill] filename:", filename);
  console.log("[scanBill] mimeType:", type);
  console.log("[scanBill] url:", `${BASE_URL}/api/bills/scan/`);

  return uploadViaXhr(uri, filename, type, token);
}

export type { BillInput };