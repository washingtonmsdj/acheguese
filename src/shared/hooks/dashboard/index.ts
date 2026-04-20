/**
 * Shared dashboard hooks compatibility barrel.
 *
 * SSOT: the runtime implementations live in modules/dashboard/hooks.
 * This path remains as a stable import surface for legacy callers.
 */
export { useDashboardAccess } from "@/core/business/hooks/useDashboardAccess";
export { useDashboardTabs } from "@/core/business/hooks/useDashboardTabs";
