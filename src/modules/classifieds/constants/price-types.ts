/**
 * 📋 SSOT: TIPOS DE PREÇO
 *
 * Define os tipos de precificação disponíveis para anúncios.
 */

export interface PriceType {
  id: string;
  label: string;
  description: string;
  icon: string;
  showInput: boolean;
}

export const PRICE_TYPES: readonly PriceType[] = [
  { id: "fixo", label: "Fixo", description: "Preço definido", icon: "💰", showInput: true },
  { id: "negociavel", label: "Negociável", description: "Aceita proposta", icon: "🤝", showInput: true },
  { id: "gratis", label: "Grátis", description: "Doação", icon: "🎁", showInput: false },
  { id: "sob_consulta", label: "Sob consulta", description: "Consulte o vendedor", icon: "💬", showInput: false },
] as const;

export function getPriceTypeLabel(id: string): string {
  return PRICE_TYPES.find((p) => p.id === id)?.label || id;
}
