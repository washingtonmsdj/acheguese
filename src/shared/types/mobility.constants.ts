/**
 * Mobility constants compatibility shim.
 *
 * Canonical ownership lives in `@/core/mobility/constants`.
 * This file preserves the historical import path used by shared/types/constants.
 */

export {
  BUSINESS_RULES,
  DB_TABLES,
  FILTER_TYPES,
  MOBILITY_QUERY_KEYS,
  PACKAGE_SIZE,
  REALTIME_CHANNELS,
  REPORT_SEVERITY,
  REPORT_TYPE,
  RIDE_MODE,
  RIDE_STATUS,
  RIDE_TYPES,
  SOURCE_TYPE,
  TIMEOUTS,
  USER_TYPES,
} from "@/core/mobility/constants";

export type {
  FilterType,
  PackageSize,
  ReportSeverity,
  ReportType,
  RideMode,
  RideStatus,
  RideType,
  SourceType,
  UserType,
} from "@/core/mobility/constants";
