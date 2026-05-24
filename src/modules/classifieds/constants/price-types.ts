import { DollarSign, Gift, Handshake, MessageCircle, type LucideIcon } from "lucide-react";

/**
 * SSOT: TIPOS DE PREÇO
 *
 * Define os tipos de precificação disponíveis para anúncios.
 */

export interface PriceType {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  showInput: boolean;
}

export const PRICE_TYPES: readonly PriceType[] = [
  { id: "fixo", label: "Fixo", description: "Preço definido", icon: DollarSign, showInput: true },
  { id: "negociavel", label: "Negociável", description: "Aceita proposta", icon: Handshake, showInput: true },
  { id: "gratis", label: "Grátis", description: "Doação", icon: Gift, showInput: false },
  { id: "sob_consulta", label: "Sob consulta", description: "Consulte o vendedor", icon: MessageCircle, showInput: false },
] as const;

export function getPriceTypeLabel(id: string): string {
  return PRICE_TYPES.find((p) => p.id === id)?.label || id;
}
