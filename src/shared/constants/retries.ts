/**
 * Constantes de retry
 * 
 * Centraliza configurações de retry para operações que podem falhar
 * temporariamente (rede, GPS, APIs externas).
 * 
 * @example
 * ```typescript
 * import { RETRIES } from '@/shared/constants';
 * 
 * const data = await fetchWithRetry(url, { 
 *   maxRetries: RETRIES.API_MAX 
 * });
 * ```
 */
export const RETRIES = {
  /** Número máximo padrão de tentativas (3) */
  DEFAULT_MAX: 3,
  
  /** Número máximo de tentativas para GPS (3) */
  GPS_MAX: 3,
  
  /** Número máximo de tentativas para APIs externas (5) */
  API_MAX: 5,
  
  /** Número máximo de tentativas para operações críticas (1 - sem retry) */
  CRITICAL_MAX: 1,
  
  /** Delay inicial entre tentativas em ms (1 segundo) */
  INITIAL_DELAY: 1000,
  
  /** Multiplicador de delay para backoff exponencial (2x) */
  BACKOFF_MULTIPLIER: 2,
  
  /** Delay máximo entre tentativas em ms (10 segundos) */
  MAX_DELAY: 10000,
} as const;

/**
 * Type helper para garantir que apenas valores válidos sejam usados
 */
export type RetryConfig = typeof RETRIES[keyof typeof RETRIES];

/**
 * Calcula o delay para uma tentativa específica usando backoff exponencial
 * 
 * @param attempt - Número da tentativa (1-based)
 * @returns Delay em milissegundos
 * 
 * @example
 * ```typescript
 * const delay = calculateRetryDelay(3); // 4000ms (1000 * 2^2)
 * await sleep(delay);
 * ```
 */
export function calculateRetryDelay(attempt: number): number {
  const delay = RETRIES.INITIAL_DELAY * Math.pow(RETRIES.BACKOFF_MULTIPLIER, attempt - 1);
  return Math.min(delay, RETRIES.MAX_DELAY);
}
