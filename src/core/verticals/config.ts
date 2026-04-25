/**
 * VERTICAL CONFIG - SSOT de taxonomia vertical.
 *
 * Regras oficiais:
 * - `business`/`empresas` e dominio base horizontal de entidades empresariais.
 * - `business` nao e vertical.
 * - Apenas chaves presentes em `VerticalKey` sao verticais oficiais.
 * - Estado atual: somente `gastronomy` e vertical oficial.
 * - Verticais futuros so existem quando declarados neste arquivo.
 *
 * Padrao estrutural:
 * - business base + profile vertical opcional 1:1
 */

import type { BusinessCategory } from "@/core/business/types/Business";

// Identificadores canonicos de vertical (estado atual do projeto)
export type VerticalKey = "gastronomy";

export interface VerticalConfig {
  key: VerticalKey;
  label: string;
  description: string;
  /** Categorias de business_data elegiveis para este vertical */
  eligibleCategories: BusinessCategory[];
  /** Rota de setup apos criacao da empresa */
  setupRoute: (businessId: string) => string;
  /** Rota do painel no dashboard */
  dashboardRoute: (businessId: string) => string;
}

export const VERTICAL_CONFIGS: Record<VerticalKey, VerticalConfig> = {
  gastronomy: {
    key: "gastronomy",
    label: "Gastronomia",
    description: "Cardapio, delivery, reservas e gestao gastronomica",
    eligibleCategories: ["restaurante", "lazer"], // lazer inclui bares, cafeterias, sorveterias, etc.
    setupRoute: (businessId) => `/perfil/empresas/${businessId}/gastronomia/setup`,
    dashboardRoute: (businessId) => `/perfil/empresas/${businessId}/gastronomia`,
  },
};

/**
 * Retorna os verticais elegiveis para uma categoria de empresa.
 */
export function getEligibleVerticals(category: BusinessCategory): VerticalConfig[] {
  return Object.values(VERTICAL_CONFIGS).filter((v) =>
    v.eligibleCategories.includes(category),
  );
}

/**
 * Verifica se uma categoria e elegivel para um vertical especifico.
 */
export function isEligibleForVertical(
  category: BusinessCategory,
  vertical: VerticalKey,
): boolean {
  switch (vertical) {
    case "gastronomy":
      return VERTICAL_CONFIGS.gastronomy.eligibleCategories.includes(category);
    default:
      return false;
  }
}
