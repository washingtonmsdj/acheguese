/**
 * 🔧 PROCEDURAL CONFIG - FLOOD TEST GAME
 * 
 * Configurações centralizadas de geração procedural - SINGLE SOURCE OF TRUTH
 * 
 * @version 1.0.0
 * @build 2026-04-10
 */

// ============================================================================
// NOISE CONFIG
// ============================================================================

export const NOISE_CONFIG = {
  /** Brightness base para texturas */
  BRIGHTNESS: {
    base: 0.70,
    variation: 0.25,
  },
  /** Jitter para distribuição de objetos */
  JITTER: {
    /** Fator de jitter em células (0-1) */
    factor: 0.55,
    /** Fator de jitter para grama */
    grass: 0.8,
  },
  /** Margem de segurança nas bordas do mundo */
  EDGE_MARGIN: {
    /** Margem em metros */
    meters: 2,
    /** Fator de escala para distribuição (0-1) */
    distributionFactor: 0.92,
  },
} as const;

// ============================================================================
// SLOPE CONFIG
// ============================================================================

export const SLOPE_CONFIG = {
  /** Threshold de slope para grama */
  GRASS_MAX_SLOPE: 1.2,
  /** Offset para cálculo de slope */
  SAMPLE_OFFSET: 0.5,
} as const;

// ============================================================================
// PATCH CONFIG
// ============================================================================

export const PATCH_CONFIG = {
  /** Escala de patches de densidade */
  SCALE: 0.3,
  /** Threshold para patches densos */
  DENSE_THRESHOLD: 0.05,
  /** Densidade de patches densos */
  DENSE_DENSITY: 1.0,
  /** Densidade de patches esparsos */
  SPARSE_DENSITY: 0.3,
} as const;

// ============================================================================
// PROP DISTRIBUTION
// ============================================================================

export const PROP_DISTRIBUTION = {
  /** Offset para centralizar distribuição em células */
  CENTER_OFFSET: 0.5,
  /** Densidade de rochas por célula */
  ROCK_DENSITY: 0.006,
} as const;

// ============================================================================
// NOISE SEEDS
// ============================================================================

export const NOISE_SEEDS = {
  /** Seed para jitter X */
  JITTER_X: 40,
  /** Seed para jitter Z */
  JITTER_Z: 41,
  /** Seed para distribuição de props */
  PROP_DISTRIBUTION: 700,
} as const;