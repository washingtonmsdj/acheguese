export const ADMIN_USER_REPORT_STATUS = {
  PENDING: 'pending',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;

export type AdminUserReportStatus =
  (typeof ADMIN_USER_REPORT_STATUS)[keyof typeof ADMIN_USER_REPORT_STATUS];
