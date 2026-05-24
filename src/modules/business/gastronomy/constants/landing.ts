/**
 * Constantes da Landing Page de Gastronomia
 *
 * Centraliza todas as constantes usadas na página
 * MOVIDO de pages/landing/constants.ts para cá (SSOT de localização)
 */

export const BUSINESS_SORT_OPTIONS = [
  { key: 'relevance', label: 'Relevância' },
  { key: 'nearest', label: 'Mais próximo' },
  { key: 'rating', label: 'Melhor avaliado' },
  { key: 'delivery_time', label: 'Mais rápido' },
  { key: 'delivery_fee', label: 'Menor taxa' },
] as const;

export const SECTION_ITEMS_LIMIT = 25;
export const PRODUCT_SECTION_ITEMS_LIMIT = 5;
export const DISTANCE_FALLBACK = Number.POSITIVE_INFINITY;
export const INITIAL_VISIBLE_COUNT = 12;
export const LOAD_MORE_INCREMENT = 12;

export const INSECURE_CONTEXT_DESTINATION_MESSAGE =
  'Localização automática indisponível neste ambiente. Use HTTPS/localhost ou informe seu endereço manualmente.';
