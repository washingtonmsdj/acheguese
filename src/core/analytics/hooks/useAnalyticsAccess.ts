import { useSessionContext } from "@/core/session";
import type { DashboardId, DashboardConfig } from "@/core/analytics/config/dashboards.config";
import { POWERBI_DASHBOARDS } from "@/core/analytics/config/dashboards.config";

export function useAnalyticsAccess() {
  const { activeProfile } = useSessionContext();
  const hasAccess = Boolean(activeProfile);

  const canViewDashboard = (dashboardId: DashboardId): boolean => {
    if (!activeProfile) return false;

    const dashboard = POWERBI_DASHBOARDS[dashboardId];
    if (!dashboard) return false;

    if (!dashboard.requiredRole || dashboard.requiredRole.length === 0) {
      return hasAccess;
    }

    return dashboard.requiredRole.includes((activeProfile as any).role || "");
  };

  const getAvailableDashboards = (): DashboardConfig[] => {
    if (!hasAccess) return [];
    return Object.values(POWERBI_DASHBOARDS).filter((dashboard) =>
      canViewDashboard(dashboard.id as DashboardId),
    );
  };

  return {
    hasAccess,
    canViewDashboard,
    getAvailableDashboards,
  };
}
