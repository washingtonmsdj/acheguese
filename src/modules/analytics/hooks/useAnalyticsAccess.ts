/**
 * Hook para controle de acesso aos dashboards de analytics
 * 
 * Verifica se o usuário tem permissão para visualizar dashboards
 * baseado em seu perfil e role.
 */

import { useSessionContext } from '@/core/session';
import type { DashboardId, DashboardConfig } from '../config/dashboards.config';
import { POWERBI_DASHBOARDS } from '../config/dashboards.config';

export function useAnalyticsAccess() {
  const { activeProfile } = useSessionContext();

  /**
   * Verifica se usuário tem acesso geral aos analytics
   * 
   * NOTA: Atualmente permite acesso a todos os usuários autenticados.
   * Para restringir, descomente as linhas abaixo e comente a linha atual.
   */
  const hasAccess = Boolean(activeProfile); // Permite todos os usuários autenticados
  
  // Para restringir apenas a admin e manager, use:
  // const hasAccess = Boolean(
  //   activeProfile?.role === 'admin' || 
  //   activeProfile?.role === 'manager'
  // );

  /**
   * Verifica se usuário pode visualizar um dashboard específico
   */
  const canViewDashboard = (dashboardId: DashboardId): boolean => {
    if (!activeProfile) return false;

    const dashboard = POWERBI_DASHBOARDS[dashboardId];
    if (!dashboard) return false;

    // Se não tem roles requeridos, qualquer um com acesso pode ver
    if (!dashboard.requiredRole || dashboard.requiredRole.length === 0) {
      return hasAccess;
    }

    // Verificar se o role do usuário está na lista de permitidos
    return dashboard.requiredRole.includes((activeProfile as any).role || '');
  };

  /**
   * Retorna lista de dashboards que o usuário pode acessar
   */
  const getAvailableDashboards = (): DashboardConfig[] => {
    if (!hasAccess) return [];

    return Object.values(POWERBI_DASHBOARDS).filter((dashboard) =>
      canViewDashboard(dashboard.id as DashboardId)
    );
  };

  return {
    hasAccess,
    canViewDashboard,
    getAvailableDashboards,
  };
}
