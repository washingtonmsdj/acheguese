/**
 * SSOT de categorias de empresas.
 *
 * Regras:
 * - categoria é o agrupador canônico usado por banco, schema, rotas e filtros;
 * - subcategoria/segmento detalha o nicho sem criar novas categorias soltas;
 * - UI deve importar daqui em vez de declarar listas locais.
 */

import { getRequiredRecordValue } from "@/shared/utils/recordLookup";

export const BUSINESS_CATEGORIES = [
  "restaurante",
  "mercado",
  "farmacia",
  "saude",
  "educacao",
  "servicos",
  "lazer",
  "outros",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export const BUSINESS_CATEGORY_LABELS: Record<BusinessCategory, string> = {
  restaurante: "Gastronomia",
  mercado: "Mercados",
  farmacia: "Farmácias",
  saude: "Saúde",
  educacao: "Educação",
  servicos: "Serviços",
  lazer: "Lazer",
  outros: "Outros",
} as const;

export const BUSINESS_SUBCATEGORIES: Record<BusinessCategory, readonly string[]> = {
  restaurante: [
    "Restaurante",
    "Lanchonete",
    "Pizzaria",
    "Hamburgueria",
    "Padaria",
    "Cafeteria",
    "Sorveteria",
    "Confeitaria",
    "Marmitaria",
    "Bar",
    "Comida regional",
    "Delivery de comida",
  ],
  mercado: [
    "Supermercado",
    "Mercadinho",
    "Mercearia",
    "Hortifruti",
    "Açougue",
    "Peixaria",
    "Atacado",
    "Produtos naturais",
  ],
  farmacia: [
    "Drogaria",
    "Farmácia de manipulação",
    "Farmácia popular",
    "Cosméticos",
    "Produtos hospitalares",
    "Farmácia veterinária",
  ],
  saude: [
    "Clínica médica",
    "Consultório",
    "Odontologia",
    "Fisioterapia",
    "Psicologia",
    "Nutrição",
    "Laboratório",
    "Exames",
    "Estética",
  ],
  educacao: [
    "Escola",
    "Creche",
    "Curso livre",
    "Reforço escolar",
    "Faculdade",
    "Ensino técnico",
    "Idiomas",
    "Música",
    "Esporte",
    "Preparatório",
  ],
  servicos: [
    "Assistência técnica",
    "Oficina mecânica",
    "Lava jato",
    "Autopeças",
    "Eletricista",
    "Encanador",
    "Pintor",
    "Chaveiro",
    "Limpeza",
    "Jardinagem",
    "Marcenaria",
    "Serralheria",
    "Beleza e estética",
    "Pet shop",
  ],
  lazer: [
    "Academia",
    "Pilates",
    "Yoga",
    "Dança",
    "Artes marciais",
    "Parque",
    "Entretenimento",
    "Turismo",
    "Eventos",
  ],
  outros: [
    "Loja",
    "Vestuário",
    "Calçados",
    "Eletrônicos",
    "Móveis",
    "Decoração",
    "Papelaria",
    "Livraria",
    "Presentes",
    "Outro segmento",
  ],
} as const;

export const BUSINESS_CATEGORY_OPTIONS = BUSINESS_CATEGORIES.map((category) => ({
  value: category,
  label: getRequiredRecordValue(BUSINESS_CATEGORY_LABELS, category, BUSINESS_CATEGORY_LABELS.outros),
}));

export function isBusinessCategory(category: unknown): category is BusinessCategory {
  return typeof category === "string" && BUSINESS_CATEGORIES.includes(category as BusinessCategory);
}

export function normalizeBusinessCategoryId(category: unknown): BusinessCategory {
  if (isBusinessCategory(category)) {
    return category;
  }

  if (typeof category !== "string") {
    return "outros";
  }

  const normalized = category
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

  switch (normalized) {
    case "gastronomia":
    case "restaurantes":
    case "restaurante":
    case "lanchonete":
    case "padaria":
    case "pizzaria":
      return "restaurante";
    case "mercados":
    case "mercado":
    case "supermercado":
      return "mercado";
    case "farmacias":
    case "farmacia":
    case "drogaria":
      return "farmacia";
    case "saude":
    case "clinica":
    case "clinicas":
      return "saude";
    case "educacao":
    case "escola":
    case "escolas":
    case "curso":
    case "cursos":
      return "educacao";
    case "servicos":
    case "servico":
      return "servicos";
    case "lazer":
    case "academia":
    case "turismo":
      return "lazer";
    default:
      return "outros";
  }
}

export function getBusinessCategoryLabel(category: BusinessCategory | string): string {
  return getRequiredRecordValue(
    BUSINESS_CATEGORY_LABELS,
    normalizeBusinessCategoryId(category),
    BUSINESS_CATEGORY_LABELS.outros,
  );
}

export function getBusinessSubcategories(category: BusinessCategory | string): readonly string[] {
  return getRequiredRecordValue(
    BUSINESS_SUBCATEGORIES,
    normalizeBusinessCategoryId(category),
    BUSINESS_SUBCATEGORIES.outros,
  );
}

export function hasBusinessSubcategories(category: BusinessCategory | string): boolean {
  return getBusinessSubcategories(category).length > 0;
}

export function getBusinessSubcategoryOptions(category: BusinessCategory | string): Array<{ value: string; label: string }> {
  return getBusinessSubcategories(category).map((subcategory) => ({
    value: subcategory,
    label: subcategory,
  }));
}

export function isBusinessSubcategory(category: BusinessCategory | string, subcategory: string): boolean {
  return getBusinessSubcategories(category).includes(subcategory);
}
