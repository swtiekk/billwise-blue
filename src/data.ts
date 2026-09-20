export type BillStatus = "overdue" | "due-soon" | "upcoming" | "paid";
export type BillCategory =
  | "electricity" | "water" | "internet" | "rent"
  | "insurance" | "loan" | "phone" | "other";

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  category: BillCategory;
  isPriority: boolean;
  isRecurring: boolean;
}

export const INITIAL_BILLS: Bill[] = [
  { id: "1", name: "Meralco Electric Bill", amount: 4250, dueDate: "Sep 14", status: "overdue", category: "electricity", isPriority: true, isRecurring: true },
  { id: "2", name: "Globe Home Internet", amount: 1899, dueDate: "Sep 17", status: "due-soon", category: "internet", isPriority: true, isRecurring: true },
  { id: "3", name: "Maynilad Water Bill", amount: 780, dueDate: "Sep 20", status: "due-soon", category: "water", isPriority: false, isRecurring: true },
  { id: "4", name: "SSS Loan Payment", amount: 3500, dueDate: "Sep 25", status: "upcoming", category: "loan", isPriority: true, isRecurring: true },
  { id: "5", name: "PhilHealth Premium", amount: 900, dueDate: "Sep 28", status: "upcoming", category: "insurance", isPriority: false, isRecurring: true },
  { id: "6", name: "PLDT Mobile Plan", amount: 999, dueDate: "Aug 31", status: "paid", category: "phone", isPriority: false, isRecurring: true },
  { id: "7", name: "BDO Personal Loan", amount: 5200, dueDate: "Oct 1", status: "upcoming", category: "loan", isPriority: true, isRecurring: true },
];

export interface StatusStyle {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

// Ported from the web version's STATUS_CONFIG — Tailwind class names
// swapped for real hex values since RN has no utility classes.
export const STATUS_CONFIG: Record<BillStatus, StatusStyle> = {
  overdue:    { label: "Overdue",  bg: "#FFF1F2", text: "#E11D48", dot: "#FB7185" }, // rose
  "due-soon": { label: "Due Soon", bg: "#FFFBEB", text: "#D97706", dot: "#FBBF24" }, // amber
  upcoming:   { label: "Upcoming", bg: "#F1F5F9", text: "#64748B", dot: "#94A3B8" }, // slate
  paid:       { label: "Paid",     bg: "#ECFDF5", text: "#059669", dot: "#34D399" }, // emerald
};

export const CATEGORIES: { key: BillCategory; label: string }[] = [
  { key: "electricity", label: "Electric" },
  { key: "water", label: "Water" },
  { key: "internet", label: "Internet" },
  { key: "rent", label: "Rent" },
  { key: "insurance", label: "Insurance" },
  { key: "loan", label: "Loan" },
  { key: "phone", label: "Phone" },
  { key: "other", label: "Other" },
];

export const BUDGET_DATA = [
  { name: "Loans", value: 8700, color: "#2563EB", allocated: 30 },
  { name: "Utilities", value: 5929, color: "#60A5FA", allocated: 21 },
  { name: "Insurance", value: 900, color: "#93C5FD", allocated: 10 },
  { name: "Savings", value: 5000, color: "#DBEAFE", allocated: 18 },
  { name: "Food", value: 6000, color: "#1D4ED8", allocated: 21 },
];

export const RISK_FACTORS = [
  { label: "Overdue Bills", score: 35, impact: "High", detail: "You have 1 overdue bill worth ₱4,250. Late fees may apply and credit score could be affected." },
  { label: "Debt-to-Income Ratio", score: 18, impact: "Medium", detail: "Your loan payments represent 31% of your monthly income. Ideal is below 28%." },
  { label: "Emergency Fund", score: 10, impact: "Medium", detail: "No emergency fund detected. Aim for 3-6 months of expenses saved." },
  { label: "Bill Variety Risk", score: 5, impact: "Low", detail: "Good spread across utility types. No single provider dependency is critical." },
] as const;

export const TIPS = [
  { title: "Pay Meralco First", desc: "Overdue electricity bills incur 2% monthly surcharges. Prioritize this payment today.", action: "Mark as Paid", iconKey: "electricity" as BillCategory },
  { title: "Set Up Auto-Pay", desc: "Globe Home Internet is due in 3 days. Enable auto-debit to avoid disconnection fees.", action: "Set Reminder", iconKey: "bell" },
  { title: "SSS Loan Restructuring", desc: "Your SSS loan is 31% of income. Check if SSS restructuring can lower your monthly payment.", action: "Learn More", iconKey: "loan" as BillCategory },
  { title: "Build Emergency Fund", desc: "Save ₱500/month extra to build a ₱10K emergency buffer within 20 months.", action: "Start Saving", iconKey: "savings" },
] as const;

export type NotifKind = "overdue" | "due-soon" | "risk" | "info";
export type NotifGroup = "Today" | "This Week";

export interface Notif {
  id: string;
  kind: NotifKind;
  title: string;
  desc: string;
  time: string;
  group: NotifGroup;
  read: boolean;
}

export const INITIAL_NOTIFS: Notif[] = [
  { id: "n1", kind: "overdue", title: "Meralco Bill is Overdue", desc: "Your ₱4,250 electric bill was due Sep 14. Late surcharges of 2% may apply.", time: "2 hours ago", group: "Today", read: false },
  { id: "n2", kind: "due-soon", title: "Globe Internet Due in 3 Days", desc: "₱1,899 is due on Sep 17. Pay before the due date to avoid disconnection.", time: "5 hours ago", group: "Today", read: false },
  { id: "n3", kind: "risk", title: "Risk Score Increased to 68", desc: "Your financial risk is now High. Overdue bills are the primary driver. Check your recommendations.", time: "Today, 8:00 AM", group: "Today", read: false },
  { id: "n4", kind: "due-soon", title: "Maynilad Water Bill Coming Up", desc: "₱780 is due Sep 20 — 3 days from now. Set a reminder to stay on track.", time: "Yesterday", group: "This Week", read: true },
  { id: "n5", kind: "info", title: "SSS Loan Payment Reminder", desc: "Your ₱3,500 SSS loan payment is due Sep 25. You have 8 days to prepare.", time: "Mon, 9:00 AM", group: "This Week", read: true },
  { id: "n6", kind: "info", title: "Budget Tip: Reduce Loan Exposure", desc: "Loan payments make up 31% of your income. Consider restructuring to lower your risk score.", time: "Sun, 11:30 AM", group: "This Week", read: true },
];

export const SETTINGS_GROUPS = [
  { section: "Account", items: [
    { iconKey: "user", label: "Personal Information", sub: "Maria Santos" },
    { iconKey: "phone", label: "Linked Mobile", sub: "+63 917 852 3601" },
    { iconKey: "mail", label: "Email Address", sub: "maria.santos@gmail.com" },
  ]},
  { section: "Bills & Budget", items: [
    { iconKey: "bell", label: "Bill Reminders", sub: "3 days before due" },
    { iconKey: "wallet", label: "Monthly Budget", sub: "₱28,000" },
    { iconKey: "chart", label: "Risk Alerts", sub: "Enabled" },
  ]},
  { section: "App Settings", items: [
    { iconKey: "lock", label: "Security & Privacy", sub: "Biometric enabled" },
    { iconKey: "globe", label: "Language", sub: "Filipino / English" },
    { iconKey: "palette", label: "Theme", sub: "Light" },
  ]},
  { section: "Support", items: [
    { iconKey: "help", label: "Help Center", sub: "" },
    { iconKey: "star", label: "Rate BillWise", sub: "" },
    { iconKey: "message", label: "Send Feedback", sub: "" },
  ]},
] as const;