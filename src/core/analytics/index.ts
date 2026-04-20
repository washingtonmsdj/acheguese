/**
 * Exports centralizados do módulo de analytics
 */

export { AnalyticsService } from './AnalyticsService';
export type {
  ServiceResult,
  AnalyticsEventType,
  AnalyticsEventSource,
  AnalyticsEvent,
  AnalyticsMetrics,
  DailyMetrics,
} from './AnalyticsService';

export { AnalyticsPage } from "./pages/AnalyticsPage";
export { useAnalyticsAccess } from "./hooks/useAnalyticsAccess";
export { POWERBI_DASHBOARDS } from "./config/dashboards.config";
export type { DashboardId, DashboardConfig } from "./config/dashboards.config";
