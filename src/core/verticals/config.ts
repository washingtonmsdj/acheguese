/**
 * VERTICAL CONFIG - SSOT de taxonomia vertical.
 *
 * Regras oficiais:
 * - `business`/`empresas` é domínio base horizontal de entidades empresariais.
 * - `business` não é vertical.
 * - Apenas chaves presentes em `VerticalKey` são verticais oficiais.
 * - Estado atual: `gastronomy` e `education` são verticais oficiais.
 * - Verticais futuros só existem quando declarados neste arquivo.
 *
 * Padrão estrutural:
 * - business base + profile vertical opcional 1:1
 */

import type { BusinessCategory } from "@/core/business/types/Business";

// Identificadores canônicos de vertical (estado atual do projeto)
export type VerticalKey = "gastronomy" | "education";

export interface VerticalConfig {
  key: VerticalKey;
  label: string;
  description: string;
  /** Categorias de business_data elegíveis para este vertical */
  eligibleCategories: BusinessCategory[];
  /** Categoria canônica usada quando a criação nasce dentro do vertical */
  defaultCategory: BusinessCategory;
  /** Slugs aceitos para entrada contextual de criação */
  createSlugs: string[];
  /** Copy oficial da criação contextual, sem duplicar formulários por módulo */
  createCopy: {
    title: string;
    subtitle: string;
    categoryLockedHelp: string;
    nameLabel: string;
    namePlaceholder: string;
    descriptionPlaceholder: string;
  };
  /** Rota de setup após criação da empresa */
  setupRoute: (businessId: string) => string;
  /** Rota do painel no dashboard */
  dashboardRoute: (businessId: string) => string;
}

export const VERTICAL_CONFIGS: Record<VerticalKey, VerticalConfig> = {
  gastronomy: {
    key: "gastronomy",
    label: "Gastronomia",
    description: "Cardápio, delivery, reservas e gestão gastronômica",
    eligibleCategories: ["restaurante", "lazer"], // lazer inclui bares, cafeterias, sorveterias, etc.
    defaultCategory: "restaurante",
    createSlugs: ["gastronomia"],
    createCopy: {
      title: "Cadastrar negócio de gastronomia",
      subtitle: "Primeiro criamos a empresa base; em seguida você configura cardápio, horários e operação gastronômica.",
      categoryLockedHelp: "Esta entrada veio do módulo Gastronomia. A categoria base fica alinhada ao vertical para liberar o setup correto.",
      nameLabel: "Nome do negócio",
      namePlaceholder: "Ex: Restaurante da Praça",
      descriptionPlaceholder: "Explique a cozinha, o tipo de atendimento e o diferencial do negócio.",
    },
    setupRoute: (businessId) => `/central/empresas/${businessId}/gastronomia/setup`,
    dashboardRoute: (businessId) => `/central/empresas/${businessId}/gastronomia`,
  },
  education: {
    key: "education",
    label: "Educação",
    description: "Gestão de instituições de ensino, programas, leads e eventos",
    eligibleCategories: ["educacao"],
    defaultCategory: "educacao",
    createSlugs: ["educacao"],
    createCopy: {
      title: "Cadastrar instituição de ensino",
      subtitle: "Primeiro criamos a instituição no cadastro base; em seguida você completa os dados educacionais do módulo.",
      categoryLockedHelp: "Esta entrada veio do módulo Educação. A categoria base fica travada para manter o cadastro compatível com o setup educacional.",
      nameLabel: "Nome da instituição",
      namePlaceholder: "Ex: Escola Municipal Maria Quitéria",
      descriptionPlaceholder: "Explique o tipo de ensino, público atendido, diferenciais e informações institucionais relevantes.",
    },
    setupRoute: (businessId) => `/central/empresas/${businessId}/educacao/setup`,
    dashboardRoute: (businessId) => `/central/empresas/${businessId}/educacao`,
  },
};

/**
 * Retorna os verticais elegíveis para uma categoria de empresa.
 */
export function getEligibleVerticals(category: BusinessCategory): VerticalConfig[] {
  return Object.values(VERTICAL_CONFIGS).filter((v) =>
    v.eligibleCategories.includes(category),
  );
}

export function getVerticalByCreateSlug(slug?: string | null): VerticalConfig | null {
  if (!slug) return null;

  const normalizedSlug = slug.trim().toLowerCase();
  return (
    Object.values(VERTICAL_CONFIGS).find((vertical) =>
      vertical.createSlugs.includes(normalizedSlug),
    ) ?? null
  );
}

export function getBusinessCreateRoute(vertical?: VerticalKey): string {
  if (!vertical) return "/central/empresas/nova";

  const config = VERTICAL_CONFIGS[vertical];
  return `/central/empresas/nova/${config.createSlugs[0]}`;
}

/**
 * Verifica se uma categoria é elegível para um vertical específico.
 */
export function isEligibleForVertical(
  category: BusinessCategory,
  vertical: VerticalKey,
): boolean {
  switch (vertical) {
    case "gastronomy":
      return VERTICAL_CONFIGS.gastronomy.eligibleCategories.includes(category);
    case "education":
      return VERTICAL_CONFIGS.education.eligibleCategories.includes(category);
    default:
      return false;
  }
}
