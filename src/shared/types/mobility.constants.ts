/**
 * COMPATIBILIDADE TRANSITÓRIA
 *
 * RIDE_STATUS e RideStatus agora vivem em:
 *   src/modules/mobility/constants/index.ts
 *
 * Este arquivo re-exporta daquele módulo para não quebrar imports existentes.
 * @deprecated Importe diretamente de "@/modules/mobility/constants"
 */
export {
  RIDE_STATUS,
  type RideStatus,
} from "@/modules/mobility/constants";

// ============================================
// REPORT STATUS
// ============================================

export const REPORT_STATUS = {
  PENDING: "pending",
  INVESTIGATING: "investigating",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

// ============================================
// REPORT SEVERITY
// ============================================

export const REPORT_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export type ReportSeverity =
  (typeof REPORT_SEVERITY)[keyof typeof REPORT_SEVERITY];

// ============================================
// REPORT TYPES
// ============================================

export const REPORT_TYPE = {
  DRIVER_BEHAVIOR: "driver_behavior",
  SAFETY_CONCERN: "safety_concern",
  ROUTE_ISSUE: "route_issue",
  PAYMENT_DISPUTE: "payment_dispute",
  VEHICLE_CONDITION: "vehicle_condition",
  CANCELLATION_ABUSE: "cancellation_abuse",
  HARASSMENT: "harassment",
  FRAUD: "fraud",
  OTHER: "other",
} as const;

export type ReportType = (typeof REPORT_TYPE)[keyof typeof REPORT_TYPE];

// ============================================
// HELPERS
// ============================================

export function isValidRideStatus(status: string): status is RideStatus {
  return Object.values(RIDE_STATUS).includes(status as RideStatus);
}

export function isValidReportStatus(status: string): status is ReportStatus {
  return Object.values(REPORT_STATUS).includes(status as ReportStatus);
}

export function isValidReportSeverity(
  severity: string,
): severity is ReportSeverity {
  return Object.values(REPORT_SEVERITY).includes(severity as ReportSeverity);
}

export function isValidReportType(type: string): type is ReportType {
  return Object.values(REPORT_TYPE).includes(type as ReportType);
}
