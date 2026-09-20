import { api } from "./client";
import type {
  RiskAssessment,
  RecommendationsResponse,
  BudgetAllocationSummary,
  NotificationsResponse,
} from "./types";

export const getRisk = () => api.get<RiskAssessment>("/api/risk/assess/");

export const getRecommendations = () => api.get<RecommendationsResponse>("/api/recommendations/");

export const getBudgetAllocation = () => api.get<BudgetAllocationSummary>("/api/budget/allocation/");

export const getNotifications = () => api.get<NotificationsResponse>("/api/notifications/");
