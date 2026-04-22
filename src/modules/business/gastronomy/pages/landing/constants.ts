/**
 * Constantes da Landing Page de Gastronomia
 * 
 * Centraliza todas as constantes usadas na página
 */

export const BUSINESS_SORT_OPTIONS = [
  { key: 'relevance', label: 'Relevancia' },
  { key: 'nearest', label: 'Mais proximo' },
  { key: 'rating', label: 'Melhor avaliado' },
  { key: 'delivery_time', label: 'Mais rapido' },
  { key: 'delivery_fee', label: 'Menor taxa' },
] as const;

export const SECTION_ITEMS_LIMIT = 25;
export const PRODUCT_SECTION_ITEMS_LIMIT = 5;
export const DISTANCE_FALLBACK = Number.POSITIVE_INFINITY;
export const INITIAL_VISIBLE_COUNT = 12;
export const LOAD_MORE_INCREMENT = 12;

export const INSECURE_CONTEXT_DESTINATION_MESSAGE =
  'Localizacao automatica indisponivel neste ambiente. Use HTTPS/localhost ou informe seu endereco manualmente.';
