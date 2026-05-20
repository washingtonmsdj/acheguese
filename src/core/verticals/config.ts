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
export type VerticalKey = "gastronomy" | "education";

export interface VerticalConfig {
  key: VerticalKey;
  label: string;
  description: string;
  /** Categorias de business_data elegiveis para este vertical */
  eligibleCategories: BusinessCategory[];
  /** Categoria canonica usada quando a criacao nasce dentro do vertical */
  defaultCategory: BusinessCategory;
  /** Slugs aceitos para entrada contextual de criacao */
  createSlugs: string[];
  /** Copy oficial da criacao contextual, sem duplicar formularios por modulo */
  createCopy: {
    title: string;
    subtitle: string;
    categoryLockedHelp: string;
    nameLabel: string;
    namePlaceholder: string;
    descriptionPlaceholder: string;
  };
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
    defaultCategory: "restaurante",
    createSlugs: ["gastronomia", "gastronomy"],
    createCopy: {
      title: "Cadastrar negocio de gastronomia",
      subtitle: "Primeiro criamos a empresa base; em seguida voce configura cardapio, horarios e operacao gastronomica.",
      categoryLockedHelp: "Esta entrada veio do modulo Gastronomia. A categoria base fica alinhada ao vertical para liberar o setup correto.",
      nameLabel: "Nome do negocio",
      namePlaceholder: "Ex: Restaurante da Praca",
      descriptionPlaceholder: "Explique a cozinha, o tipo de atendimento e o diferencial do negocio.",
    },
    setupRoute: (businessId) => `/central/empresas/${businessId}/gastronomia/setup`,
    dashboardRoute: (businessId) => `/central/empresas/${businessId}/gastronomia`,
  },
  education: {
    key: "education",
    label: "Educacao",
    description: "Gestao de instituicoes de ensino, programas, leads e eventos",
    eligibleCategories: ["educacao"],
    defaultCategory: "educacao",
    createSlugs: ["educacao", "education"],
    createCopy: {
      title: "Cadastrar instituicao de ensino",
      subtitle: "Primeiro criamos a instituicao no cadastro base; em seguida voce completa os dados educacionais do modulo.",
      categoryLockedHelp: "Esta entrada veio do modulo Educacao. A categoria base fica travada para manter o cadastro compativel com o setup educacional.",
      nameLabel: "Nome da instituicao",
      namePlaceholder: "Ex: Escola Municipal Maria Quiteria",
      descriptionPlaceholder: "Explique o tipo de ensino, publico atendido, diferenciais e informacoes institucionais relevantes.",
    },
    setupRoute: (businessId) => `/central/empresas/${businessId}/educacao/setup`,
    dashboardRoute: (businessId) => `/central/empresas/${businessId}/educacao`,
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
 * Verifica se uma categoria e elegivel para um vertical especifico.
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
