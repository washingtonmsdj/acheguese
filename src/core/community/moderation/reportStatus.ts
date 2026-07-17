export const MODERATION_REPORT_STATUS = {
  PENDING: "pending",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  REMOVED: "removed",
  DISMISSED: "dismissed",
} as const;

export type ModerationReportStatus =
  (typeof MODERATION_REPORT_STATUS)[keyof typeof MODERATION_REPORT_STATUS];
