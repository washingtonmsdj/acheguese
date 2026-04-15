/**
 * Map Utilities
 * Configuration for map marker types
 */

export interface TypeConfigItem {
  emoji: string;
  label: string;
  color: string;
}

export const typeConfig: Record<string, TypeConfigItem> = {
  empresa: { emoji: "🏢", label: "Empresas", color: "#3B82F6" },
  profissional: { emoji: "👨‍💼", label: "Profissionais", color: "#10B981" },
  classificado: { emoji: "📦", label: "Classificados", color: "#F59E0B" },
  evento: { emoji: "🎉", label: "Eventos", color: "#8B5CF6" },
  alerta: { emoji: "⚠️", label: "Alertas", color: "#EF4444" },
  mobilidade: { emoji: "🚗", label: "Mobilidade", color: "#6366F1" },
};
