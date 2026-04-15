/**
 * 🔧 RENDERING CONFIG - FLOOD TEST GAME
 * 
 * Configurações centralizadas de rendering - SINGLE SOURCE OF TRUTH
 * 
 * @version 1.0.0
 * @build 2026-04-10
 */

// ============================================================================
// CAMERA CONFIG
// ============================================================================

export const CAMERA_CONFIG = {
  /** Field of View (graus) */
  FOV: 60,
  /** Near clipping plane (metros) */
  NEAR: 0.1,
  /** Far clipping plane (metros) */
  FAR: 2000,
  /** Damping do OrbitControls */
  DAMPING: {
    enabled: true,
    factor: 0.05,
  },
  /** Ângulo polar máximo (radianos) */
  MAX_POLAR_ANGLE: Math.PI / 2.1,
} as const;

// ============================================================================
// TERRAIN RENDERING
// ============================================================================

export const TERRAIN_RENDERING = {
  /** Segmentos da malha (resolução) */
  SEGMENTS: 150,
  /** Escala de textura */
  TEXTURE_SCALE: 0.08,
  /** Altura para transição rocha */
  ROCK_HEIGHT: 10.0,
  /** Nível do mar para transição dirt */
  SEA_LEVEL_VISUAL: 3.2,
  /** Cor do fundo (subsolo) */
  BOTTOM_COLOR: "hsl(35, 18%, 18%)",
} as const;

// ============================================================================
// GRASS CONFIG
// ============================================================================

export const GRASS_CONFIG = {
  /** Contagem de lâminas */
  COUNT: 200000,
  /** Bioma padrão */
  DEFAULT_BIOME: "mesopotamia" as const,
} as const;

// ============================================================================
// SKY CONFIG
// ============================================================================

export const SKY_CONFIG = {
  /** Raio do SkyDome (metros) */
  DOME_RADIUS: 1800,
  /** Render order (renderizar primeiro) */
  DOME_RENDER_ORDER: -1000,
  /** Lua */
  MOON: {
    radius: 60,
    segments: 32,
    color: 0xffffcc,
  },
} as const;

// ============================================================================
// BIOME CONFIGS
// ============================================================================

export const BIOME_CONFIGS = {
  mesopotamia: {
    baseColor: { h: 118, s: 50, l: 22 },
    tipColor: { h: 75, s: 60, l: 45 },
    density: 0.7,
    heightMin: 0.3,
    heightMax: 1.2,
    widthMin: 0.03,
    widthMax: 0.06,
    curveMin: 0.3,
    curveMax: 0.5,
    windStrength: 0.3,
  },
  desert: {
    baseColor: { h: 45, s: 40, l: 35 },
    tipColor: { h: 50, s: 50, l: 50 },
    density: 0.3,
    heightMin: 0.2,
    heightMax: 0.8,
    widthMin: 0.02,
    widthMax: 0.04,
    curveMin: 0.2,
    curveMax: 0.4,
    windStrength: 0.5,
  },
} as const;

// ============================================================================
// LOD CONFIG
// ============================================================================

export const LOD_CONFIG = {
  /** Distância máxima de renderização (metros) */
  MAX_DISTANCE: 1000,
  /** Densidade por distância */
  DENSITY_BY_DISTANCE: [
    { minDistance: 0, maxDistance: 50, density: 1.0 },
    { minDistance: 50, maxDistance: 150, density: 0.5 },
    { minDistance: 150, maxDistance: 1000, density: 0.2 },
  ],
} as const;