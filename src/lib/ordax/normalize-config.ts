/**
 * Configuração centralizada para normalize.ts
 * Extrai todos os valores hardcoded para facilitar manutenção
 */

import type { OrdaxBackgroundLayer, OrdaxGameType } from "./types";

// ============================================================================
// CONSTANTES GERAIS
// ============================================================================

/** Versão da configuração */
export const CONFIG_VERSION = "2.0.0";

/** Data da build */
export const BUILD_DATE = "2026-02-16";

// ============================================================================
// CONFIGURAÇÃO DE TEMA
// ============================================================================

/** Tema padrão para todos os jogos */
export const DEFAULT_THEME = {
  background: "hsl(0, 0%, 4%)",
  primary: "hsl(200, 80%, 50%)",
  accent: "hsl(300, 70%, 50%)",
  font: "ui-sans-serif, system-ui, sans-serif",
} as const;

/** Valores HSL válidos */
export const HSL_RANGES = {
  h: { min: 0, max: 360 },
  s: { min: 0, max: 100 },
  l: { min: 0, max: 100 },
} as const;

// ============================================================================
// CONFIGURAÇÃO DE ENTIDADES
// ============================================================================

/** Tamanhos padrão de entidades */
export const ENTITY_SIZES = {
  MIN_WIDTH: 8,
  MIN_HEIGHT: 8,
  DEFAULT_WIDTH: 32,
  DEFAULT_HEIGHT: 32,
  MAX_WIDTH: 1000,
  MAX_HEIGHT: 1000,
} as const;

/** Posições padrão de entidades */
export const ENTITY_POSITIONS = {
  DEFAULT_X: 400,
  DEFAULT_Y: 300,
  PLAYER_DEFAULT_X: 400,
  PLAYER_DEFAULT_Y: 500,
  SPAWNER_DEFAULT_X: 400,
  SPAWNER_DEFAULT_Y: 40,
} as const;

/** Propriedades padrão do player */
export const PLAYER_DEFAULTS = {
  HEALTH: 100,
  SPEED: 260,
  FIRE_RATE: 7,
  BULLET_SPEED: 520,
} as const;

/** Propriedades padrão do spawner */
export const SPAWNER_DEFAULTS = {
  SPAWN_RATE: 1.2,
  SPAWN_TYPE: "enemy" as const,
  WIDTH: 300,
  HEIGHT: 40,
} as const;

// ============================================================================
// CONFIGURAÇÃO DE SISTEMAS
// ============================================================================

/** Sistemas obrigatórios para todos os jogos */
export const REQUIRED_SYSTEMS = ["CameraSystem", "UISystem"] as const;

/** Sistemas por gênero */
export const SYSTEMS_BY_GENRE: Record<OrdaxGameType, string[]> = {
  shooter: [
    "CollisionSystem",
    "SpawnerSystem",
    "ScoreSystem",
    "ParticleSystem",
    "TimerSystem",
    "AISystem",
    "AudioSystem",
  ],
  platformer: ["PhysicsSystem", "CollisionSystem"],
  racing: [],
  topdown: [],
  puzzle: [],
  sports: [],
  unknown: [],
};

// ============================================================================
// CONFIGURAÇÃO DE BACKGROUND LAYERS
// ============================================================================

/** Layers padrão por gênero */
export const DEFAULT_LAYERS_BY_GENRE: Record<string, OrdaxBackgroundLayer[]> = {
  shooter: [
    { type: "nebula", parallax: 0.15 },
    { type: "starfield", density: 220, speedY: 35, parallax: 0.35 },
  ],
  racing: [{ type: "gradient", parallax: 0 }],
  platformer: [{ type: "gradient", parallax: 0.1 }],
  topdown: [{ type: "solid", parallax: 0 }],
  puzzle: [{ type: "solid", parallax: 0 }],
  sports: [{ type: "gradient", parallax: 0 }],
  adventure: [
    { type: "gradient", parallax: 0.05 },
    { type: "nebula", parallax: 0.1 },
  ],
  rpg: [
    { type: "gradient", parallax: 0.05 },
    { type: "starfield", density: 80, speedY: 5, parallax: 0.15 },
  ],
  survival: [
    { type: "nebula", parallax: 0.1 },
    { type: "starfield", density: 120, speedY: 12, parallax: 0.25 },
  ],
  strategy: [{ type: "solid", parallax: 0 }],
  sandbox: [{ type: "gradient", parallax: 0.05 }],
  horror: [
    { type: "nebula", parallax: 0.2 },
  ],
  unknown: [{ type: "solid", parallax: 0 }],
};

/** Configuração de starfield */
export const STARFIELD_DEFAULTS = {
  DENSITY: 220,
  SPEED_Y: 35,
} as const;

/** Configuração de layers */
export const LAYER_DEFAULTS = {
  GRADIENT_PARALLAX: 0.1,
  NEBULA_PARALLAX: 0.15,
  SOLID_PARALLAX: 0,
} as const;

// ============================================================================
// CONFIGURAÇÃO DE AUDIO
// ============================================================================

/** Paths padrão de audio */
export const AUDIO_PATHS = {
  MUSIC: "/audio/bgm.mp3",
  SOUNDS: {
    COLLISION: "/audio/hit.wav",
    SCORE: "/audio/coin.wav",
    GAME_OVER: "/audio/gameover.wav",
    JUMP: "/audio/jump.wav",
    SHOOT: "/audio/shoot.wav",
  },
} as const;

// ============================================================================
// CONFIGURAÇÃO DE GRAVIDADE
// ============================================================================

/** Gravidade padrão por gênero */
export const GRAVITY_BY_GENRE: Record<OrdaxGameType, { x: number; y: number }> = {
  platformer: { x: 0, y: 500 },
  shooter: { x: 0, y: 0 },
  racing: { x: 0, y: 0 },
  topdown: { x: 0, y: 0 },
  puzzle: { x: 0, y: 0 },
  sports: { x: 0, y: 0 },
  unknown: { x: 0, y: 0 },
};

// ============================================================================
// CONFIGURAÇÃO DE DETECÇÃO DE GÊNERO
// ============================================================================

/** Palavras-chave para detecção de gênero (português/inglês) */
export const GENRE_KEYWORDS: Record<OrdaxGameType, string[]> = {
  platformer: ["plataforma", "platform", "pulo", "jump", "saltar"],
  racing: ["corrida", "racing", "carro", "car", "velocidade", "speed"],
  puzzle: ["puzzle", "quebra", "cabeça", "brain", "lógica", "logic"],
  topdown: ["top-down", "topdown", "visão", "view", "aérea", "aerial"],
  shooter: ["nave", "shooter", "tiro", "shoot", "asteroid", "espaço", "space"],
  sports: ["sports", "futebol", "soccer", "basquete", "basketball", "esporte"],
  unknown: [],
};

// ============================================================================
// MAPEAMENTO DE GÊNEROS NÃO-CANÔNICOS → CANÔNICOS
// ============================================================================

/** Maps non-standard genre names to their canonical OrdaxGameType */
const GENRE_ALIAS_MAP: Record<string, OrdaxGameType> = {
  // Shooter aliases
  space_shooter: "shooter", shmup: "shooter", "shoot-em-up": "shooter",
  shootemup: "shooter", bullet_hell: "shooter", "bullet-hell": "shooter",
  spaceshooter: "shooter", "space-shooter": "shooter",
  "twin-stick": "shooter", twin_stick: "shooter", twinsstick: "shooter",
  arcade_shooter: "shooter", "arcade-shooter": "shooter",
  scrolling_shooter: "shooter", "scrolling-shooter": "shooter",
  vertical_shooter: "shooter", horizontal_shooter: "shooter",
  galaga: "shooter", asteroids: "shooter", invaders: "shooter",
  schmup: "shooter", stg: "shooter",
  // Platformer aliases
  platform: "platformer", sidescroller: "platformer", "side-scroller": "platformer",
  side_scroller: "platformer", metroidvania: "platformer",
  "run-and-jump": "platformer", run_and_jump: "platformer",
  "2d-platformer": "platformer", "2d_platformer": "platformer",
  runner: "platformer", endless_runner: "platformer", "endless-runner": "platformer",
  jump_and_run: "platformer", "jump-and-run": "platformer",
  // Racing aliases
  race: "racing", driving: "racing", racer: "racing",
  kart: "racing", "kart-racing": "racing", kart_racing: "racing",
  car_game: "racing", "car-game": "racing", drift: "racing",
  corrida: "racing", velocidade: "racing",
  // Top-down aliases
  "top-down": "topdown", top_down: "topdown", overhead: "topdown",
  "top-down-shooter": "topdown", top_down_shooter: "topdown",
  birds_eye: "topdown", "birds-eye": "topdown", birdseye: "topdown",
  isometric: "topdown", "top-view": "topdown", top_view: "topdown",
  dungeon_crawler: "topdown", "dungeon-crawler": "topdown",
  rpg_topdown: "topdown", zelda: "topdown",
  // Puzzle aliases
  logic: "puzzle", brain: "puzzle", match3: "puzzle", "match-3": "puzzle",
  match_3: "puzzle", tetris: "puzzle", sokoban: "puzzle",
  word_game: "puzzle", "word-game": "puzzle",
  brain_teaser: "puzzle", "brain-teaser": "puzzle",
  quebra_cabeca: "puzzle", logica: "puzzle",
  // Sports aliases
  sport: "sports", football: "sports", soccer: "sports",
  basketball: "sports", tennis: "sports", baseball: "sports",
  golf: "sports", volleyball: "sports", hockey: "sports",
  futebol: "sports", basquete: "sports", esporte: "sports",
};

/**
 * Resolve a genre string to a canonical OrdaxGameType.
 * Returns the canonical type if found, otherwise returns the input unchanged.
 */
export function resolveCanonicalGenre(genre: string | undefined): OrdaxGameType | string {
  if (!genre) return "unknown";
  const lower = genre.toLowerCase().trim();
  // Direct match
  if (GENRE_KEYWORDS[lower as OrdaxGameType]) return lower as OrdaxGameType;
  // Alias match
  if (GENRE_ALIAS_MAP[lower]) return GENRE_ALIAS_MAP[lower];
  // Partial match: check if any canonical type is a substring
  for (const [canonical] of Object.entries(GENRE_KEYWORDS)) {
    if (lower.includes(canonical)) return canonical as OrdaxGameType;
  }
  return genre;
}

// ============================================================================
// CONFIGURAÇÃO DE VALIDAÇÃO
// ============================================================================

/** Limites de validação */
export const VALIDATION_LIMITS = {
  MAX_ENTITIES: 100,
  MAX_SYSTEMS: 20,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_POSITION: 10000,
  MIN_POSITION: -10000,
  GRAVITY_MIN: -1000,
  GRAVITY_MAX: 1000,
  PLAYER_HEALTH_MIN: 1,
  PLAYER_HEALTH_MAX: 1000,
  PLAYER_SPEED_MIN: 1,
  PLAYER_SPEED_MAX: 1000,
  FIRE_RATE_MIN: 0.1,
  FIRE_RATE_MAX: 100,
  BULLET_SPEED_MIN: 1,
  BULLET_SPEED_MAX: 2000,
} as const;

// ============================================================================
// CONFIGURAÇÃO DE PERFORMANCE
// ============================================================================

/** Configuração de cache */
export const CACHE_CONFIG = {
  MAX_CACHE_SIZE: 100,
  DEFAULT_TTL: 300000, // 5 minutos em ms
} as const;

// ============================================================================
// TIPOS DE CONFIGURAÇÃO
// ============================================================================

export interface NormalizeConfig {
  version: string;
  buildDate: string;
  theme: typeof DEFAULT_THEME;
  entitySizes: typeof ENTITY_SIZES;
  playerDefaults: typeof PLAYER_DEFAULTS;
  spawnerDefaults: typeof SPAWNER_DEFAULTS;
  audioPaths: typeof AUDIO_PATHS;
  validationLimits: typeof VALIDATION_LIMITS;
  cacheConfig: typeof CACHE_CONFIG;
}

/** Configuração completa exportada */
export const FULL_CONFIG: NormalizeConfig = {
  version: CONFIG_VERSION,
  buildDate: BUILD_DATE,
  theme: DEFAULT_THEME,
  entitySizes: ENTITY_SIZES,
  playerDefaults: PLAYER_DEFAULTS,
  spawnerDefaults: SPAWNER_DEFAULTS,
  audioPaths: AUDIO_PATHS,
  validationLimits: VALIDATION_LIMITS,
  cacheConfig: CACHE_CONFIG,
} as const;