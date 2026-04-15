/**
 * Constantes de paginação
 * 
 * Centraliza todos os valores de paginação usados no sistema
 * para facilitar manutenção e consistência.
 * 
 * @example
 * ```typescript
 * import { PAGINATION } from '@/shared/constants';
 * 
 * const users = await getUsers({ limit: PAGINATION.DEFAULT_LIMIT });
 * ```
 */
export const PAGINATION = {
  /** Limite padrão para listagens (20 itens) */
  DEFAULT_LIMIT: 20,
  
  /** Limite pequeno para dropdowns e previews (10 itens) */
  SMALL_LIMIT: 10,
  
  /** Limite médio para listagens extensas (50 itens) */
  MEDIUM_LIMIT: 50,
  
  /** Limite grande para exports e relatórios (100 itens) */
  LARGE_LIMIT: 100,
  
  /** Tamanho padrão de página para infinite scroll (12 itens) */
  DEFAULT_PAGE_SIZE: 12,
  
  /** Tamanho de lote para operações em massa (1000 itens) */
  BATCH_SIZE: 1000,
  
  /** Limite para leaderboards e rankings (10 itens) */
  LEADERBOARD_LIMIT: 10,
  
  /** Limite para mensagens de grupo (50 itens) */
  MESSAGES_LIMIT: 50,
  
  /** Limite para histórico de localização (100 itens) */
  LOCATION_HISTORY_LIMIT: 100,
  
  /** Limite para eventos em mapa (200 itens) */
  MAP_EVENTS_LIMIT: 200,
} as const;

/**
 * Type helper para garantir que apenas valores válidos sejam usados
 */
export type PaginationLimit = typeof PAGINATION[keyof typeof PAGINATION];
