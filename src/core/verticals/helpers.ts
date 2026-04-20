/**
 * VERTICAL HELPERS — Funções auxiliares para verticais
 *
 * Helpers que facilitam a integração entre business_data e verticais.
 */

import type { BusinessCategory } from '@/core/business/types/Business';
import type { CuisineType } from '@/core/gastronomy';

/**
 * Mapeamento de category (business_data) para cuisine_type sugerido (gastronomy_profile)
 *
 * IMPORTANTE: Este é apenas uma sugestão inicial.
 * O usuário pode escolher qualquer cuisine_type no formulário.
 */
const CATEGORY_TO_CUISINE_SUGGESTION: Partial<Record<BusinessCategory, CuisineType>> = {
  restaurante: 'brasileira', // Sugestão genérica, usuário escolhe
  lazer: 'bar', // Lazer pode ser bar, cafeteria, sorveteria, etc.
};

/**
 * Sugere um cuisine_type baseado na category da empresa.
 * Retorna null se não houver sugestão específica.
 *
 * @example
 * getCuisineSuggestionFromCategory('restaurante') // 'brasileira'
 * getCuisineSuggestionFromCategory('lazer') // 'bar'
 * getCuisineSuggestionFromCategory('mercado') // null
 */
export function getCuisineSuggestionFromCategory(
  category: BusinessCategory,
): CuisineType | null {
  return CATEGORY_TO_CUISINE_SUGGESTION[category] ?? null;
}

/**
 * Verifica se uma category é tipicamente associada a gastronomia.
 * Útil para mostrar hints na UI.
 */
export function isGastronomyRelatedCategory(category: BusinessCategory): boolean {
  return category === 'restaurante' || category === 'lazer';
}
