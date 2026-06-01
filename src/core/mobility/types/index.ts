/**
 * Public mobility type contracts.
 */
export * from './mobility.generated';
export * from './types';
export type { MobilityRide } from './ride';

export type RideReportsRow = Record<string, unknown>;
export type ReportStatus = "pending" | "reviewed" | "resolved";
export type ReportSeverity = "low" | "medium" | "high";
export type PaymentMethod =
  | "cash"
  | "card"
  | "pix"
  | "dinheiro"
  | "cartao"
  | "credito"
  | "debito";

export type ResolutionStrategy =
  | "text_resolution"
  | "alias_resolution"
  | "geospatial_resolution"
  | "text"
  | "alias"
  | "geospatial"
  | "gps_only"
  | "ambiguous"
  | "unresolved";

export interface RideMigrationFailure {
  ride_id: string;
  reason: string;
  pickup_strategy: ResolutionStrategy;
  dropoff_strategy: ResolutionStrategy;
  data?: Record<string, unknown>;
}

export interface RideMigrationResult {
  total: number;
  pickup_location_resolved: number;
  dropoff_location_resolved: number;
  pickup_address_created: number;
  dropoff_address_created: number;
  resolved_by_text: number;
  resolved_by_alias: number;
  resolved_by_geospatial: number;
  gps_only_addresses: number;
  ambiguous: number;
  unresolved: number;
  skipped_already_migrated: number;
  failed_other: number;
  failures: RideMigrationFailure[];
}

export const MOBILITY_CONSTANTS = {
  MAX_SEARCH_RADIUS_KM: 50,
  DEFAULT_SEARCH_RADIUS_KM: 10,
  MAX_PASSENGERS: 4,
} as const;
