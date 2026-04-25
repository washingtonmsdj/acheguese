/**
 * 📋 SSOT: SUBCATEGORIAS DE CLASSIFICADOS
 *
 * Define subcategorias dinâmicas para cada categoria principal.
 * Usado no formulário de criação para refinar a classificação do anúncio.
 */

export interface ClassifiedSubcategory {
  id: string;
  label: string;
  emoji?: string;
}

/**
 * Mapa de subcategorias por categoria principal.
 */
export const CLASSIFIED_SUBCATEGORIES: Record<string, readonly ClassifiedSubcategory[]> = {
  veículos: [
    { id: "carros", label: "Carros", emoji: "🚗" },
    { id: "motos", label: "Motos", emoji: "🏍️" },
    { id: "caminhoes", label: "Caminhões", emoji: "🚚" },
    { id: "onibus", label: "Ônibus", emoji: "🚌" },
    { id: "barcos", label: "Barcos", emoji: "⛵" },
    { id: "pecas", label: "Peças e Acessórios", emoji: "🔧" },
  ],
  imóveis: [
    { id: "apartamento", label: "Apartamento", emoji: "🏢" },
    { id: "casa", label: "Casa", emoji: "🏠" },
    { id: "kitnet", label: "Kitnet/Studio", emoji: "🏘️" },
    { id: "terreno", label: "Terreno", emoji: "🌳" },
    { id: "comercial", label: "Comercial", emoji: "🏪" },
    { id: "cobertura", label: "Cobertura", emoji: "🏙️" },
    { id: "sitio", label: "Sítio/Chácara", emoji: "🌾" },
  ],
  eletrônicos: [
    { id: "celulares", label: "Celulares", emoji: "📱" },
    { id: "computadores", label: "Computadores", emoji: "💻" },
    { id: "tablets", label: "Tablets", emoji: "📲" },
    { id: "tvs", label: "TVs", emoji: "📺" },
    { id: "audio", label: "Áudio", emoji: "🎧" },
    { id: "cameras", label: "Câmeras", emoji: "📷" },
    { id: "acessorios", label: "Acessórios", emoji: "🔌" },
  ],
  móveis: [
    { id: "sala", label: "Sala", emoji: "🛋️" },
    { id: "quarto", label: "Quarto", emoji: "🛏️" },
    { id: "cozinha", label: "Cozinha", emoji: "🍽️" },
    { id: "escritorio", label: "Escritório", emoji: "🪑" },
    { id: "decoracao", label: "Decoração", emoji: "🖼️" },
    { id: "jardim", label: "Jardim", emoji: "🌿" },
  ],
  roupas: [
    { id: "masculino", label: "Masculino", emoji: "👔" },
    { id: "feminino", label: "Feminino", emoji: "👗" },
    { id: "infantil", label: "Infantil", emoji: "👶" },
    { id: "calcados", label: "Calçados", emoji: "👟" },
    { id: "acessorios", label: "Acessórios", emoji: "👜" },
    { id: "esportivo", label: "Esportivo", emoji: "🏃" },
  ],
  games: [
    { id: "consoles", label: "Consoles", emoji: "🎮" },
    { id: "jogos", label: "Jogos", emoji: "🕹️" },
    { id: "acessorios", label: "Acessórios", emoji: "🎧" },
    { id: "pc-gaming", label: "PC Gaming", emoji: "💻" },
    { id: "retro", label: "Retro/Colecionáveis", emoji: "👾" },
  ],
  serviços: [
    { id: "reformas", label: "Reformas", emoji: "🔨" },
    { id: "limpeza", label: "Limpeza", emoji: "🧹" },
    { id: "beleza", label: "Beleza", emoji: "💇" },
    { id: "eventos", label: "Eventos", emoji: "🎉" },
    { id: "tecnologia", label: "Tecnologia", emoji: "💻" },
    { id: "educacao", label: "Educação", emoji: "📚" },
    { id: "saude", label: "Saúde", emoji: "⚕️" },
    { id: "transporte", label: "Transporte", emoji: "🚚" },
  ],
  vagas: [
    { id: "tecnologia", label: "Tecnologia", emoji: "💻" },
    { id: "vendas", label: "Vendas", emoji: "💼" },
    { id: "administracao", label: "Administração", emoji: "📊" },
    { id: "saude", label: "Saúde", emoji: "⚕️" },
    { id: "educacao", label: "Educação", emoji: "📚" },
    { id: "servicos-gerais", label: "Serviços Gerais", emoji: "🔧" },
    { id: "gastronomia", label: "Gastronomia", emoji: "🍽️" },
  ],
  outros: [
    { id: "livros", label: "Livros", emoji: "📚" },
    { id: "esportes", label: "Esportes", emoji: "⚽" },
    { id: "animais", label: "Animais", emoji: "🐾" },
    { id: "instrumentos", label: "Instrumentos", emoji: "🎸" },
    { id: "brinquedos", label: "Brinquedos", emoji: "🧸" },
    { id: "ferramentas", label: "Ferramentas", emoji: "🔧" },
  ],
} as const;

/**
 * Retorna subcategorias para uma categoria específica.
 */
export function getSubcategories(categoryId: string): readonly ClassifiedSubcategory[] {
  return (
    Object.entries(CLASSIFIED_SUBCATEGORIES).find(
      ([currentCategoryId]) => currentCategoryId === categoryId,
    )?.[1] ?? []
  );
}

/**
 * Verifica se uma categoria possui subcategorias.
 */
export function hasSubcategories(categoryId: string): boolean {
  return getSubcategories(categoryId).length > 0;
}

/**
 * Retorna o label de uma subcategoria.
 */
export function getSubcategoryLabel(categoryId: string, subcategoryId: string): string {
  const subcategories = getSubcategories(categoryId);
  return subcategories.find((s) => s.id === subcategoryId)?.label || subcategoryId;
}

/**
 * Retorna o emoji de uma subcategoria.
 */
export function getSubcategoryEmoji(categoryId: string, subcategoryId: string): string {
  const subcategories = getSubcategories(categoryId);
  return subcategories.find((s) => s.id === subcategoryId)?.emoji || "";
}

/**
 * Valida se uma subcategoria é válida para uma categoria.
 */
export function isValidSubcategory(categoryId: string, subcategoryId: string): boolean {
  const subcategories = getSubcategories(categoryId);
  return subcategories.some((s) => s.id === subcategoryId);
}
