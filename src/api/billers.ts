import { api } from "./client";

/** A company the household pays. Its grace period / penalty rules are applied for the user. */
export interface Biller {
  biller_id: number;
  name: string;
  category: string; // one of BILL_CATEGORIES
  city: string;
  grace_period_days: number;
  has_penalty: boolean;
  rules_verified: boolean;
}

export const getBillers = () => api.get<Biller[]>("/api/billers/");
