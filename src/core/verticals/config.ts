/**
 * VERTICAL CONFIG — SSOT de verticais de negócio
 *
 * Define quais categorias de business_data são elegíveis para cada vertical.
 * Escalável: adicionar novos verticais aqui sem tocar em outros módulos.
 *
 * Padrão: business base + profile vertical opcional 1:1
 * Verticais atuais: gastronomy
 * Verticais futuros: tourism, delivery, real-estate, specialized-services
 */

import type { BusinessCategory } from '@/core/business/types/Business';

// ── Identificadores canônicos de vertical ────────────────────────────────────

export type VerticalKey = 'gastronomy'; // | 'tourism' | 'real-estate' | ...

// ── Configuração de cada vertical ────────────────────────────────────────────

export interface VerticalConfig {
  key: VerticalKey;
  label: string;
  description: string;
  /** Categorias de business_data elegíveis para este vertical */
  eligibleCategories: BusinessCategory[];
  /** Rota de setup após criação da empresa */
  setupRoute: (businessId: string) => string;
  /** Rota do painel no dashboard */
  dashboardRoute: (businessId: string) => string;
}

export const VERTICAL_CONFIGS: Record<VerticalKey, VerticalConfig> = {
  gastronomy: {
    key: 'gastronomy',
    label: 'Gastronomia',
    description: 'Cardápio, delivery, reservas e gestão gastronômica',
    eligibleCategories: ['restaurante', 'lazer'], // lazer inclui bares, cafeterias, sorveterias, etc.
    setupRoute: (businessId) => `/dashboard/business/${businessId}/gastronomy/setup`,
    dashboardRoute: (businessId) => `/dashboard/business/${businessId}/gastronomy/dashboard`,
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Retorna os verticais elegíveis para uma categoria de empresa.
 */
export function getEligibleVerticals(category: BusinessCategory): VerticalConfig[] {
  return Object.values(VERTICAL_CONFIGS).filter((v) =>
    v.eligibleCategories.includes(category),
  );
}

/**
 * Verifica se uma categoria é elegível para um vertical específico.
 */
export function isEligibleForVertical(
  category: BusinessCategory,
  vertical: VerticalKey,
): boolean {
  return VERTICAL_CONFIGS[vertical].eligibleCategories.includes(category);
}
