export const HOUSING_TYPES = ["Own House", "Renting", "With Relatives"];

export const FREQUENCIES = ["Weekly", "Twice a month", "Monthly"];

/** Old saved data may say "Bi-monthly"; it always meant twice a month. */
export function normalizeFrequency(f: string | null | undefined): string {
  if (f && FREQUENCIES.includes(f)) return f;
  const t = (f ?? "").toLowerCase();
  if (t.includes("week")) return "Weekly";
  if (t.includes("bi") || t.includes("twice") || t.includes("semi")) return "Twice a month";
  return "Monthly";
}

// Payday schedule. Weekday numbers match the API: 0 = Monday ... 6 = Sunday.
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const END_OF_MONTH = 31;

const ordinal = (n: number) => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10 > 3 ? 0 : n % 10]}`;
};
export const dayLabel = (d: number) => (d === END_OF_MONTH ? "End of month" : ordinal(d));
export const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => dayLabel(i + 1));
export const dayFromLabel = (label: string) => DAY_OPTIONS.indexOf(label) + 1;

export const PAYDAY_PRESETS = [
  { label: "Kinsenas / Katapusan (15th & end of month)", days: [15, END_OF_MONTH] },
];

/** The question changes with how often the person is paid. */
export const INCOME_QUESTION: Record<string, string> = {
  Weekly: "How much do you receive every week?",
  "Twice a month": "How much do you receive each payday?",
  Monthly: "How much do you receive every month?",
};

export interface IncomeBand {
  label: string;
  value: string; // "min-max", stored in Income.range_amount
  min: number;
  max: number;
}

// Income per payday. Edit this list to change the dropdown.
export const INCOME_BANDS: IncomeBand[] = [
  { label: "Below ₱5,000", value: "0-5000", min: 0, max: 5000 },
  { label: "₱5,000 – ₱10,000", value: "5000-10000", min: 5000, max: 10000 },
  { label: "₱10,000 – ₱15,000", value: "10000-15000", min: 10000, max: 15000 },
  { label: "₱15,000 – ₱20,000", value: "15000-20000", min: 15000, max: 20000 },
  { label: "₱20,000 – ₱30,000", value: "20000-30000", min: 20000, max: 30000 },
  { label: "₱30,000 – ₱50,000", value: "30000-50000", min: 30000, max: 50000 },
  { label: "₱50,000 – ₱100,000", value: "50000-100000", min: 50000, max: 100000 },
];

export const bandFor = (label: string) => INCOME_BANDS.find((b) => b.label === label);

/** "5000.00-10000.00" (as saved by the backend) -> the matching band, if there is one. */
export function bandForRange(range: string | null | undefined): IncomeBand | undefined {
  const [lo, hi] = (range ?? "").replace(/[,\s]/g, "").split("-").map(Number);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return undefined;
  return INCOME_BANDS.find((b) => b.min === lo && b.max === hi);
}

// Names line up with the keywords in classify_bill() on the backend
// (electric / water / rent / loan / internet / subscription / groceries / shopping / entertainment).
export const BILL_CATEGORIES = [
  "Electricity", "Water", "Rent", "Loan", "Internet", "Subscription",
  "Groceries", "Shopping", "Entertainment", "Insurance", "Phone", "Other",
];

export const QUICK_ADD_CATEGORIES = ["Electricity", "Water", "Internet", "Rent", "Loan", "Phone"];
