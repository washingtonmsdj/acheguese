/**
 * Canonical analytics core exports.
 * UI, dashboard configuration and presentation hooks do not belong in core.
 */

export { AnalyticsService } from "./AnalyticsService";
export type {
  ServiceResult,
  AnalyticsEventType,
  AnalyticsEventSource,
  RecentAnalyticsEvent,
  AnalyticsMetrics,
  DailyMetrics,
} from "./AnalyticsService";
