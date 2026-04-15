/**
 * 🔧 PARTICLES CONFIG - FLOOD TEST GAME
 * 
 * Configurações centralizadas de partículas - SINGLE SOURCE OF TRUTH
 * 
 * @version 1.0.0
 * @build 2026-04-10
 */

// ============================================================================
// PARTICLE SIZES
// ============================================================================

export const FLOOD_PARTICLE_SIZES = {
  /** Tamanhos de partículas de splash */
  SPLASH: {
    min: 0.1,
    max: 0.5,
  },
  /** Tamanhos de partículas de chuva */
  RAIN: {
    min: 0.05,
    max: 0.15,
  },
  /** Tamanhos de partículas de espuma */
  FOAM: {
    min: 0.08,
    max: 0.2,
  },
} as const;

// ============================================================================
// PARTICLE COUNTS
// ============================================================================

export const FLOOD_PARTICLE_COUNTS = {
  /** Contagem máxima de partículas de splash */
  MAX_SPLASH: 1000,
  /** Contagem máxima de partículas de chuva */
  MAX_RAIN: 5000,
  /** Contagem máxima de partículas de espuma */
  MAX_FOAM: 2000,
  /** Contagem de partículas de chuva por intensidade */
  RAIN: {
    calm: 1000,
    moderate: 3000,
    biblical: 5000,
  },
} as const;