/**
 * Exports centralizados do módulo de administração
 */

export { AdminService } from './services/AdminService';
export type {
  ServiceResult,
  BusinessSummary,
  ProfileSummary,
  PlanUsage,
  AuditLog,
} from './services/AdminService';

// Re-export all services
export * from './services';

// Hooks
export { useSiteSettings } from './hooks/useSiteSettings';
export { useRealtimeMetrics } from './hooks/useRealtimeMetrics';
export { useReputationStats } from './hooks/useReputationStats';
