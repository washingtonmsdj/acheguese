// Re-export de tipos de mobilidade do módulo
// Isso permite que core e outros módulos acessem tipos sem depender do módulo mobility

export type { RideRequest } from "./types";

// Stub types for mobility.generated
export type RideReportsRow = Record<string, unknown>;
export type ReportStatus = "pending" | "reviewed" | "resolved";
export type ReportSeverity = "low" | "medium" | "high";

// Stub constants for mobility.constants
export const MOBILITY_CONSTANTS = {
  MAX_SEARCH_RADIUS_KM: 50,
  DEFAULT_SEARCH_RADIUS_KM: 10,
  MAX_PASSENGERS: 4,
} as const;
