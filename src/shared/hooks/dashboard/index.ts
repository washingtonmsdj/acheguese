/**
 * Shared dashboard hooks compatibility barrel.
 *
 * SSOT: the runtime implementations live in modules/dashboard/hooks.
 * This path remains as a stable import surface for legacy callers.
 */
export { useDashboardAccess } from "@/modules/dashboard/hooks/useDashboardAccess";
export { useDashboardTabs } from "@/modules/dashboard/hooks/useDashboardTabs";
