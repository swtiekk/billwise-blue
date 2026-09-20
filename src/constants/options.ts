export const HOUSING_TYPES = ["Own House", "Renting", "With Relatives"];

export const FREQUENCIES = ["Weekly", "Bi-monthly", "Monthly"];

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

// Names line up with the keywords in classify_bill() on the backend
// (electric / water / rent / loan / internet / subscription / groceries / shopping / entertainment).
export const BILL_CATEGORIES = [
  "Electricity", "Water", "Rent", "Loan", "Internet", "Subscription",
  "Groceries", "Shopping", "Entertainment", "Insurance", "Phone", "Other",
];

export const QUICK_ADD_CATEGORIES = ["Electricity", "Water", "Internet", "Rent", "Loan", "Phone"];
