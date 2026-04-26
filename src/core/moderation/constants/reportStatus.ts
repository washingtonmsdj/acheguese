export const MODERATION_REPORT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type ModerationReportStatus =
  (typeof MODERATION_REPORT_STATUS)[keyof typeof MODERATION_REPORT_STATUS];

