/**
 * 📋 SSOT: CATEGORIAS DE CLASSIFICADOS
 * 
 * Single Source of Truth para categorias de classificados.
 * Todas as referências a categorias devem importar deste arquivo.
 * 
 * ✅ Usado em:
 * - CategorySelector (formulário de criação/edição)
 * - ClassificadosLandingPage (filtros e exibição)
 * - ClassificadosPage (filtros)
 * - Validações de schema
 */

export interface ClassifiedCategory {
  id: string;
  label: string;
  emoji: string;
}

/**
 * Lista completa de categorias disponíveis.
 * A categoria "todos" é usada apenas para filtros de UI.
 */
export const CLASSIFIED_CATEGORIES: readonly ClassifiedCategory[] = [
  { id: "todos", label: "Todos", emoji: "🔥" },
  { id: "imóveis", label: "Imóveis", emoji: "🏠" },
  { id: "veículos", label: "Veículos", emoji: "🚗" },
  { id: "eletrônicos", label: "Eletrônicos", emoji: "📱" },
  { id: "móveis", label: "Móveis", emoji: "🪑" },
  { id: "roupas", label: "Roupas", emoji: "👕" },
  { id: "games", label: "Games", emoji: "🎮" },
  { id: "serviços", label: "Serviços", emoji: "🔧" },
  { id: "vagas", label: "Vagas", emoji: "💼" },
  { id: "outros", label: "Outros", emoji: "📦" },
] as const;

/**
 * Categorias válidas para criação de anúncios (sem "todos").
 */
export const CLASSIFIED_FORM_CATEGORIES = CLASSIFIED_CATEGORIES.filter(
  (cat) => cat.id !== "todos"
);

/**
 * Helper para obter emoji de uma categoria.
 */
export function getCategoryEmoji(categoryId: string): string {
  return CLASSIFIED_CATEGORIES.find((c) => c.id === categoryId)?.emoji || "📦";
}

/**
 * Helper para obter label de uma categoria.
 */
export function getCategoryLabel(categoryId: string): string {
  return CLASSIFIED_CATEGORIES.find((c) => c.id === categoryId)?.label || categoryId;
}

/**
 * Valida se uma categoria é válida.
 */
export function isValidCategory(categoryId: string): boolean {
  return CLASSIFIED_FORM_CATEGORIES.some((c) => c.id === categoryId);
}
