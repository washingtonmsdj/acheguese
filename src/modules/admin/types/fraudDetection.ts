export const FRAUD_ALERT_STATUS = {
  PENDING: "pending",
  INVESTIGATING: "investigating",
  CONFIRMED: "confirmed",
  FALSE_POSITIVE: "false_positive",
  RESOLVED: "resolved",
} as const;

export type FraudAlertStatus =
  (typeof FRAUD_ALERT_STATUS)[keyof typeof FRAUD_ALERT_STATUS];
