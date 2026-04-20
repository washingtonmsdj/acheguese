/**
 * Configuracao de dashboards do Power BI.
 */
export interface DashboardConfig {
  id: string;
  url: string;
  title: string;
  description: string;
  icon?: string;
  requiredRole?: string[];
}

export const POWERBI_DASHBOARDS: Record<string, DashboardConfig> = {
  geral: {
    id: "geral",
    url: "https://app.powerbi.com/view?r=eyJrIjoiNjU1Yzc2M2UtYTQyNC00NmRlLWFjYzEtMmQ0MDYyYWM5NWUzIiwidCI6IjNhNTRiNmNkLTBlZDQtNDk5Zi05MDllLTM5NTY1NzUxYWRlZCJ9",
    title: "Visao Geral",
    description: "Metricas gerais e indicadores principais do sistema",
    icon: "BarChart3",
    requiredRole: ["admin", "manager"],
  },
} as const;

export type DashboardId = keyof typeof POWERBI_DASHBOARDS;
