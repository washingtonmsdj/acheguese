/**
 * Map Utilities
 * Configuration for map marker types
 */

export interface TypeConfigItem {
  abbr: string;
  label: string;
  color: string;
}

export const typeConfig: Record<string, TypeConfigItem> = {
  empresa: { abbr: "E", label: "Empresas", color: "#3B82F6" },
  profissional: { abbr: "P", label: "Profissionais", color: "#10B981" },
  classificado: { abbr: "C", label: "Classificados", color: "#F59E0B" },
  evento: { abbr: "EV", label: "Eventos", color: "#8B5CF6" },
  alerta: { abbr: "!", label: "Alertas", color: "#EF4444" },
  mobilidade: { abbr: "M", label: "Mobilidade", color: "#6366F1" },
};
