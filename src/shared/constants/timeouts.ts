/**
 * Constantes de timeout
 * 
 * Centraliza todos os valores de timeout usados no sistema
 * para facilitar ajustes de performance e consistência.
 * 
 * Todos os valores estão em milissegundos.
 * 
 * @example
 * ```typescript
 * import { TIMEOUTS } from '@/shared/constants';
 * 
 * const location = await getGPSLocation({ 
 *   timeout: TIMEOUTS.GPS_LOCATION 
 * });
 * ```
 */
export const TIMEOUTS = {
  /** Timeout para obtenção de localização GPS (15 segundos) */
  GPS_LOCATION: 15000,
  
  /** Timeout para resolução de localização do usuário (10 segundos) */
  USER_LOCATION: 10000,
  
  /** Timeout para geolocalização por IP (5 segundos) */
  IP_GEOLOCATION: 5000,
  
  /** Timeout padrão para requisições HTTP (30 segundos) */
  DEFAULT_REQUEST: 30000,
  
  /** Timeout para operações de banco de dados (60 segundos) */
  DATABASE_OPERATION: 60000,
  
  /** Timeout para upload de arquivos (120 segundos) */
  FILE_UPLOAD: 120000,
  
  /** Timeout para debounce de busca (300ms) */
  SEARCH_DEBOUNCE: 300,
  
  /** Timeout para debounce de input (500ms) */
  INPUT_DEBOUNCE: 500,
  
  /** Timeout para auto-save (2 segundos) */
  AUTO_SAVE: 2000,
} as const;

/**
 * Type helper para garantir que apenas valores válidos sejam usados
 */
export type TimeoutValue = typeof TIMEOUTS[keyof typeof TIMEOUTS];
