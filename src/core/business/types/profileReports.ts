export const BUSINESS_PROFILE_REPORT_REASONS = [
  "fraud",
  "impersonation",
  "misleading",
  "harmful",
  "privacy_or_safety",
  "duplicate",
  "closed_or_not_here",
  "policy_violation",
  "other",
] as const;

export type BusinessProfileReportReason =
  (typeof BUSINESS_PROFILE_REPORT_REASONS)[number];

export type BusinessProfileReportStatus =
  | "pending"
  | "under_review"
  | "resolved"
  | "dismissed";

export interface BusinessProfileReportRecord {
  id: string;
  business_id: string;
  reason: BusinessProfileReportReason;
  status: BusinessProfileReportStatus;
  created_at: string;
}
