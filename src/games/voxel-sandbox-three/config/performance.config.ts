/**
 * 🔧 PERFORMANCE CONFIG - FLOOD TEST GAME
 * 
 * Configurações centralizadas de performance - SINGLE SOURCE OF TRUTH
 * 
 * @version 1.0.0
 * @build 2026-04-10
 */

// ============================================================================
// UPDATE INTERVALS
// ============================================================================

export const UPDATE_INTERVALS = {
  /** Intervalo de update de billboards (segundos) */
  BILLBOARD: 0.1, // 10 FPS
  /** Intervalo de sync de terreno (segundos) */
  TERRAIN_SYNC: 0.06, // ~16 FPS
} as const;

// ============================================================================
// CULLING CONFIG
// ============================================================================

export const CULLING_CONFIG = {
  /** Distância de culling para objetos (metros) */
  OBJECT_DISTANCE: 1000,
  /** Distância de culling para grama (metros) */
  GRASS_DISTANCE: 150,
} as const;

// ============================================================================
// POOLING CONFIG
// ============================================================================

export const POOLING_CONFIG = {
  /** Tamanho inicial de pools */
  INITIAL_SIZE: {
    particles: 1000,
    meshes: 100,
  },
  /** Tamanho máximo de pools */
  MAX_SIZE: {
    particles: 50000,
    meshes: 1000,
  },
} as const;