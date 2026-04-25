/**
 * SSOT: Business Categories and Subcategories
 * 
 * Definições centralizadas de categorias e subcategorias de empresas.
 * 
 * REGRA SSOT:
 * - Todas as categorias e subcategorias devem ser definidas aqui
 * - Nunca duplicar em componentes ou páginas
 * - Sempre importar deste módulo
 */

// ============================================================================
// CATEGORIAS PRINCIPAIS
// ============================================================================

export const BUSINESS_CATEGORIES = [
  "restaurante",
  "padaria",
  "farmacia",
  "salao",
  "academia",
  "petshop",
  "mercado",
  "loja",
  "clinica",
  "automovel",
  "servicos",
  "outros",
] as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[number];

// ============================================================================
// SUBCATEGORIAS POR CATEGORIA
// ============================================================================

export const BUSINESS_SUBCATEGORIES: Record<BusinessCategory, readonly string[]> = {
  restaurante: [
    "Comida Baiana",
    "Comida Italiana",
    "Comida Japonesa",
    "Comida Chinesa",
    "Comida Mexicana",
    "Churrascaria",
    "Pizzaria",
    "Lanchonete",
    "Hamburgueria",
    "Sorveteria",
    "Cafeteria",
    "Pastelaria",
  ] as const,

  padaria: [
    "Padaria Artesanal",
    "Confeitaria",
    "Panificadora",
    "Padaria e Confeitaria",
  ] as const,

  farmacia: [
    "Farmácia de Manipulação",
    "Drogaria",
    "Farmácia Homeopática",
    "Farmácia Veterinária",
  ] as const,

  salao: [
    "Salão de Beleza",
    "Barbearia",
    "Estética",
    "Spa",
    "Clínica de Estética",
    "Manicure e Pedicure",
  ] as const,

  academia: [
    "Academia de Musculação",
    "Estúdio de Pilates",
    "Crossfit",
    "Yoga",
    "Artes Marciais",
    "Dança",
    "Funcional",
  ] as const,

  petshop: [
    "Pet Shop",
    "Clínica Veterinária",
    "Banho e Tosa",
    "Hotel para Pets",
    "Adestramento",
  ] as const,

  mercado: [
    "Supermercado",
    "Minimercado",
    "Mercearia",
    "Hortifruti",
    "Açougue",
    "Peixaria",
  ] as const,

  loja: [
    "Loja de Roupas",
    "Loja de Calçados",
    "Loja de Acessórios",
    "Loja de Eletrônicos",
    "Loja de Móveis",
    "Loja de Decoração",
    "Loja de Presentes",
    "Papelaria",
    "Livraria",
  ] as const,

  clinica: [
    "Clínica Médica",
    "Clínica Odontológica",
    "Clínica de Fisioterapia",
    "Clínica de Psicologia",
    "Laboratório de Análises",
    "Clínica de Nutrição",
  ] as const,

  automovel: [
    "Oficina Mecânica",
    "Lava Jato",
    "Funilaria e Pintura",
    "Auto Elétrica",
    "Borracharia",
    "Auto Peças",
    "Estética Automotiva",
  ] as const,

  servicos: [
    "Assistência Técnica",
    "Chaveiro",
    "Dedetização",
    "Limpeza",
    "Jardinagem",
    "Marcenaria",
    "Serralheria",
    "Vidraçaria",
    "Eletricista",
    "Encanador",
    "Pintor",
  ] as const,

  outros: [
    "Outros Serviços",
  ] as const,
} as const;

// ============================================================================
// LABELS AMIGÁVEIS PARA CATEGORIAS
// ============================================================================

export const BUSINESS_CATEGORY_LABELS: Record<BusinessCategory, string> = {
  restaurante: "Restaurante",
  padaria: "Padaria",
  farmacia: "Farmácia",
  salao: "Salão de Beleza",
  academia: "Academia",
  petshop: "Pet Shop",
  mercado: "Mercado",
  loja: "Loja",
  clinica: "Clínica",
  automovel: "Automóvel",
  servicos: "Serviços",
  outros: "Outros",
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtém o label amigável de uma categoria
 */
export function getCategoryLabel(category: BusinessCategory): string {
  switch (category) {
    case "restaurante":
      return BUSINESS_CATEGORY_LABELS.restaurante;
    case "padaria":
      return BUSINESS_CATEGORY_LABELS.padaria;
    case "farmacia":
      return BUSINESS_CATEGORY_LABELS.farmacia;
    case "salao":
      return BUSINESS_CATEGORY_LABELS.salao;
    case "academia":
      return BUSINESS_CATEGORY_LABELS.academia;
    case "petshop":
      return BUSINESS_CATEGORY_LABELS.petshop;
    case "mercado":
      return BUSINESS_CATEGORY_LABELS.mercado;
    case "loja":
      return BUSINESS_CATEGORY_LABELS.loja;
    case "clinica":
      return BUSINESS_CATEGORY_LABELS.clinica;
    case "automovel":
      return BUSINESS_CATEGORY_LABELS.automovel;
    case "servicos":
      return BUSINESS_CATEGORY_LABELS.servicos;
    case "outros":
      return BUSINESS_CATEGORY_LABELS.outros;
    default:
      return BUSINESS_CATEGORY_LABELS.outros;
  }
}

/**
 * Obtém as subcategorias de uma categoria
 */
export function getSubcategories(category: BusinessCategory): readonly string[] {
  switch (category) {
    case "restaurante":
      return BUSINESS_SUBCATEGORIES.restaurante;
    case "padaria":
      return BUSINESS_SUBCATEGORIES.padaria;
    case "farmacia":
      return BUSINESS_SUBCATEGORIES.farmacia;
    case "salao":
      return BUSINESS_SUBCATEGORIES.salao;
    case "academia":
      return BUSINESS_SUBCATEGORIES.academia;
    case "petshop":
      return BUSINESS_SUBCATEGORIES.petshop;
    case "mercado":
      return BUSINESS_SUBCATEGORIES.mercado;
    case "loja":
      return BUSINESS_SUBCATEGORIES.loja;
    case "clinica":
      return BUSINESS_SUBCATEGORIES.clinica;
    case "automovel":
      return BUSINESS_SUBCATEGORIES.automovel;
    case "servicos":
      return BUSINESS_SUBCATEGORIES.servicos;
    case "outros":
      return BUSINESS_SUBCATEGORIES.outros;
    default:
      return [];
  }
}

/**
 * Verifica se uma categoria tem subcategorias
 */
export function hasSubcategories(category: BusinessCategory): boolean {
  return getSubcategories(category).length > 0;
}

/**
 * Obtém todas as categorias como array de objetos {value, label}
 */
export function getCategoriesAsOptions(): Array<{ value: BusinessCategory; label: string }> {
  return BUSINESS_CATEGORIES.map((cat) => ({
    value: cat,
    label: getCategoryLabel(cat),
  }));
}

/**
 * Obtém as subcategorias como array de objetos {value, label}
 */
export function getSubcategoriesAsOptions(category: BusinessCategory): Array<{ value: string; label: string }> {
  return getSubcategories(category).map((sub) => ({
    value: sub,
    label: sub,
  }));
}

/**
 * Valida se uma categoria é válida
 */
export function isValidCategory(category: string): category is BusinessCategory {
  return BUSINESS_CATEGORIES.includes(category as BusinessCategory);
}

/**
 * Valida se uma subcategoria é válida para uma categoria
 */
export function isValidSubcategory(category: BusinessCategory, subcategory: string): boolean {
  return getSubcategories(category).includes(subcategory);
}
