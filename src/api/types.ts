// Shapes returned by the Django backend.
// DRF serializes DecimalField values as strings ("4250.00"), so money is `string` here
// and converted with Number() where it is displayed.

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  message: string;
  household_id: number;
  first_name: string;
  last_name: string;
  email: string;
  tokens: AuthTokens;
}

// GET /api/household/
export interface Household {
  household_id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_members: number;
  no_of_earners: number;
  no_of_dependents: number;
  housing_type: string;
  daily_food_expense_min: string;
  daily_food_expense_max: string;
  daily_transport_expense_min: string;
  daily_transport_expense_max: string;
  setup_completed: boolean;
}

// Rule engine output — which of the 5 Chapter III rules classified a bill.
export type RuleApplied =
  | "Rule 1"
  | "Rule 2"
  | "Rule 3"
  | "Rule 4a"
  | "Rule 4b"
  | "Fallback"
  | null;

// BudgetAllocationSerializer
export interface ApiBill {
  budget_allocation_id: number;
  income: number;
  item: number;
  item_desc?: string;
  category_desc?: string; // omitted by DRF when the item has no category

  // from BudgetItem (added to the serializer in the Phase 1 patch):
  due_day?: number;
  grace_period_days?: number;
  penalty_classification?: boolean;

  amount: string | null;
  actual_due_date: string | null; // YYYY-MM-DD
  is_confirmed: boolean;
  budget_amount_range: string;
  budget_start_date: string;
  budget_end_date: string;
  budget_classification: "Non-deferrable" | "Deferrable" | null;
  priority_level: "High" | "Medium" | "Low" | null;

  // Rule engine output — which rule fired and why
  rule_applied?: RuleApplied;

  period_half: string | null;
  bill_reminder: boolean;
  is_paid?: boolean; // only if you applied the optional is_paid migration
  paid_date?: string | null;
}

export type RiskLabel = "STABLE" | "AT RISK" | "CRITICAL";

// GET /api/risk/assess/
export interface RiskAssessment {
  combined_income: string;
  total_bill_allocations: string;
  remaining_budget_min: string;
  remaining_budget_max: string;
  total_daily_expense_min: string;
  total_daily_expense_max: string;
  days_until_next_payday: number;
  total_daily_need_min: string;
  total_daily_need_max: string;
  risk_level: "LOW RISK" | "MODERATE RISK" | "HIGH RISK";
  color_indicator: "GREEN" | "AMBER" | "RED";
  label: RiskLabel;
  next_payday: string | null;
}

export interface DeferrableBill {
  budget_allocation_id: number;
  item_desc: string | null;
  category_desc: string | null;
  priority_level: string | null;
  budget_classification: string | null;
  rule_applied?: RuleApplied; // ← added so the frontend can show the reason
  amount_range: string;
  actual_due_date: string | null;
}

// GET /api/recommendations/
export interface RecommendationsResponse {
  risk_level: string;
  label: RiskLabel;
  color_indicator: string;
  activate_deferral: boolean;
  deferrable_bills: DeferrableBill[];
  estimated_budget_freed: string;
  message: string;
}

// GET /api/budget/allocation/
export interface BudgetAllocationSummary {
  period_half: string | null;
  total_allocated_min: string;
  total_allocated_max: string;
  by_category: { category: string; min: string; max: string; bill_count: number }[];
}

// GET /api/notifications/
export interface ApiNotification {
  type: "overdue" | "due_soon" | "upcoming" | "risk_alert";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  bill_id?: number;
  due_date?: string;
  risk_level?: string;
}

export interface NotificationsResponse {
  count: number;
  notifications: ApiNotification[];
}

// POST /api/bills/scan/
export interface ScanResponse {
  message: string;
  extracted: {
    amount: number | null;
    due_date: string | null; // YYYY-MM-DD
    merchant: string | null;
  };
  raw_text: string;
  note: string;
}