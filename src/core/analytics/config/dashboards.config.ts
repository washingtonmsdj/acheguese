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

const POWERBI_GERAL_URL = import.meta.env.VITE_POWERBI_GERAL_URL?.trim() ?? "";

export const POWERBI_DASHBOARDS: Record<string, DashboardConfig> = {
  geral: {
    id: "geral",
    url: POWERBI_GERAL_URL,
    title: "Visao Geral",
    description: "Metricas gerais e indicadores principais do sistema",
    icon: "BarChart3",
    requiredRole: ["admin", "manager"],
  },
} as const;

export type DashboardId = keyof typeof POWERBI_DASHBOARDS;
