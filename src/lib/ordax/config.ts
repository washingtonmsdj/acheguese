/**
 * 🔧 ORDAX ENGINE CONFIG — SINGLE SOURCE OF TRUTH
 * 
 * Configuração centralizada para toda a engine Ordax.
 * Este é o ÚNICO lugar onde constantes de configuração devem ser definidas.
 * 
 * @version 4.0.0
 * @build 2026-04-10
 * @changelog
 *   - 4.0.0: Adicionadas UI_DEFAULTS, PHYSICS_CONSTANTS, SPAWN_CONSTANTS, TIME_CONSTANTS
 *   - 3.0.0: Versão anterior com WORLD, PERFORMANCE, ENTITY_LIMITS, etc.
 */

// ============================================================================
// VERSÃO E METADADOS
// ============================================================================

export const ENGINE_VERSION = "4.0.0" as const;
export const BUILD_DATE = "2026-04-10" as const;

// ============================================================================
// WORLD
// ============================================================================

export const WORLD = {
  W: 800,
  H: 600,
  CENTER_X: 400,
  CENTER_Y: 300,
  BOUNDS: { LEFT: 0, TOP: 0, RIGHT: 800, BOTTOM: 600 },
  SAFE_MARGIN: 50,
} as const;

// ============================================================================
// PERFORMANCE
// ============================================================================

export const ENGINE_PERFORMANCE = {
  TARGET_FPS: 60,
  MAX_DELTA_TIME: 0.1,        // 100ms — 10 FPS floor
  METRICS_INTERVAL_MS: 1000,
  MS_TO_SECONDS: 1000,
  DEBOUNCE_MS: 16,            // ~60 FPS
  THROTTLE_MS: 100,
} as const;

// ============================================================================
// ENTITY LIMITS
// ============================================================================

export const ENTITY_LIMITS = {
  MAX_ENTITIES: 1000,
  MAX_SPAWNED: 100,
  MAX_BULLETS: 200,
  MAX_PARTICLES: 500,
  MAX_SYSTEMS: 20,
} as const;

// ============================================================================
// ENTITY DEFAULTS
// ============================================================================

export const ENTITY_DEFAULTS = {
  WIDTH: 32,
  HEIGHT: 32,
  RENDER_WIDTH: 50,
  RENDER_HEIGHT: 50,
  COLOR: "#888",
  PLAYER_HEALTH: 100,
  PLAYER_SPEED: 200,
  POSITION: { x: WORLD.CENTER_X, y: WORLD.CENTER_Y },
} as const;

// ============================================================================
// VALIDATION RANGES
// ============================================================================

export const VALIDATION_RANGES = {
  HEALTH: { MIN: 0, MAX: 1000, DEFAULT: 100 },
  SHIELD: { MIN: 0, MAX: 1000, DEFAULT: 0 },
  DAMAGE: { MIN: 0, MAX: 1000 },
  DIMENSION: { MIN: 1, MAX: 10000 },
  COORDINATE: { MIN: -10000, MAX: 10000 },
  VELOCITY: { MIN: -1000, MAX: 1000 },
  GRAVITY: { MIN: -1000, MAX: 1000 },
  PLAYER_SPEED: { MIN: 1, MAX: 1000 },
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
} as const;

// ============================================================================
// PHYSICS DEFAULTS
// ============================================================================

export const PHYSICS_DEFAULTS = {
  MASS: 1.0,
  FRICTION: 0.98,
  RESTITUTION: 0.2,
  MAX_VELOCITY: { X: 800, Y: 800 },
  GRAVITY: { X: 0, Y: 0 },
} as const;

// ============================================================================
// VISUAL DEFAULTS
// ============================================================================

export const VISUAL_DEFAULTS = {
  THEME: {
    background: "hsl(0, 0%, 4%)",
    primary: "hsl(200, 80%, 50%)",
    accent: "hsl(300, 70%, 50%)",
    font: "ui-sans-serif, system-ui, sans-serif",
  },
  CANVAS_BACKGROUND: "#0a0a0a",
  FALLBACK_COLORS: {
    PRIMARY: "#3b82f6",
    SECONDARY: "#10b981",
    ACCENT: "#f59e0b",
    DANGER: "#ef4444",
  },
} as const;

// ============================================================================
// AUDIO DEFAULTS
// ============================================================================

export const AUDIO_DEFAULTS = {
  MUSIC: "/audio/bgm.mp3",
  SOUNDS: {
    collision: "/audio/hit.wav",
    score: "/audio/coin.wav",
    gameOver: "/audio/gameover.wav",
  },
} as const;

// ============================================================================
// GENRE PROFILES (shared between normalizer and canvas)
// ============================================================================

export const GENRE_PROFILES: Record<string, {
  name: string;
  description: string;
  suggestedSystems: string[];
  suggestedEntities: string[];
  defaultPhysics: { gravity: { x: number; y: number } };
}> = {
  shooter: {
    name: "Shooter",
    description: "Jogo de tiro com inimigos e powerups",
    suggestedSystems: ["CollisionSystem", "SpawnerSystem", "ScoreSystem", "AudioSystem"],
    suggestedEntities: ["player", "enemy", "bullet", "powerup"],
    defaultPhysics: { gravity: { x: 0, y: 0 } },
  },
  platformer: {
    name: "Platformer",
    description: "Jogo de plataforma com pulos e gravidade",
    suggestedSystems: ["PhysicsSystem", "CollisionSystem"],
    suggestedEntities: ["player", "platform", "enemy", "collectible"],
    defaultPhysics: { gravity: { x: 0, y: 500 } },
  },
  racing: {
    name: "Racing",
    description: "Jogo de corrida com veículos",
    suggestedSystems: ["PhysicsSystem", "VehicleSystem", "CollisionSystem"],
    suggestedEntities: ["player_vehicle", "track", "obstacle", "finish_line"],
    defaultPhysics: { gravity: { x: 0, y: 0 } },
  },
  topdown: {
    name: "Top-Down",
    description: "Jogo com visão de cima",
    suggestedSystems: ["PhysicsSystem", "CollisionSystem"],
    suggestedEntities: ["player", "enemy", "obstacle"],
    defaultPhysics: { gravity: { x: 0, y: 0 } },
  },
  puzzle: {
    name: "Puzzle",
    description: "Jogo de quebra-cabeça",
    suggestedSystems: [],
    suggestedEntities: ["player", "puzzle_piece", "goal"],
    defaultPhysics: { gravity: { x: 0, y: 0 } },
  },
  sports: {
    name: "Sports",
    description: "Jogo esportivo",
    suggestedSystems: ["PhysicsSystem", "CollisionSystem"],
    suggestedEntities: ["player", "ball", "goal"],
    defaultPhysics: { gravity: { x: 0, y: 0 } },
  },
  unknown: {
    name: "Unknown",
    description: "Gênero desconhecido",
    suggestedSystems: [],
    suggestedEntities: ["player"],
    defaultPhysics: { gravity: { x: 0, y: 0 } },
  },
};

// ============================================================================
// UI DEFAULTS
// ============================================================================

export const UI_DEFAULTS = {
  // Tamanhos de elementos
  BUTTON_WIDTH: 200,
  BUTTON_HEIGHT: 50,
  BAR_WIDTH: 200,
  BAR_HEIGHT: 20,
  TEXT_WIDTH: 400,
  TEXT_HEIGHT: 30,
  PANEL_WIDTH: 300,
  PANEL_HEIGHT: 200,
  
  // Limites de texto
  MAX_ID_LENGTH: 100,
  MAX_TEXT_LENGTH: 1000,
  
  // Performance e cache
  CACHE_DURATION_MS: 1000,
  MAX_ELEMENTS: 1000,
  CLICK_THRESHOLD_MS: 200,
  DOUBLE_CLICK_THRESHOLD_MS: 500,
  BATCH_RENDER_SIZE: 50,
  POOL_SIZE: 100,
  MAX_ELEMENTS_PER_FRAME: 100,
  
  // Cores padrão (RGBA strings)
  OVERLAY_DARK: "rgba(0, 0, 0, 0.5)",
  OVERLAY_DARKER: "rgba(0, 0, 0, 0.8)",
  OVERLAY_DARKEST: "rgba(0, 0, 0, 0.9)",
  OVERLAY_SUCCESS: "rgba(0, 100, 0, 0.8)",
  
  // Offsets e posicionamento
  TEXT_OFFSET_Y: 100,
  HUD_PANEL_HEIGHT: 100,
} as const;

// ============================================================================
// PHYSICS CONSTANTS
// ============================================================================

export const PHYSICS_CONSTANTS = {
  FIXED_DT: 1 / 60,              // 16.667ms sub-step
  MAX_SUB_STEPS: 8,              // Cap para evitar spiral of death
  SLEEP_THRESHOLD: 0.05,         // px/frame abaixo do qual body pode dormir
  SLEEP_FRAMES: 60,              // Frames abaixo do threshold → sleep
  MIN_MASS: 0.001,
  MAX_SPEED_GLOBAL: 2000,
  FORCE_EPS: 0.001,
  AIR_DRAG_RATIO: 0.1,           // Fricção no ar = fricção no chão × isto
} as const;

// ============================================================================
// SPAWN CONSTANTS
// ============================================================================

export const SPAWN_CONSTANTS = {
  OFFSET_RANGE: 50,              // Range de offset aleatório para spawn (±25)
  DEFAULT_SPAWN_RATE: 2,         // Taxa padrão de spawn (por segundo)
  MAX_SPAWNED_DEFAULT: 5,        // Máximo de entidades spawnadas por padrão
} as const;

// ============================================================================
// TIME CONSTANTS
// ============================================================================

export const TIME_CONSTANTS = {
  MS_TO_SECONDS: 1000,           // Conversão de milissegundos para segundos
  SECONDS_TO_MS: 1000,           // Conversão de segundos para milissegundos
  PERFORMANCE_LOG_INTERVAL_MS: 1000,  // Intervalo de log de performance
} as const;

// ============================================================================
// LOGGING
// ============================================================================

export const LOG_DEFAULTS = {
  ENABLE_DEBUG: import.meta.env.DEV,
  RUNTIME_PREFIX: "[GameRuntime]",
  NORMALIZER_PREFIX: "[Normalizer]",
  CANVAS_PREFIX: "[OrdaxCanvas]",
} as const;

// ============================================================================
// TIMEOUTS E DELAYS - SSOT for async operations
// ============================================================================

export const TIMEOUTS = {
  // Request timeouts
  OPENAI_REQUEST_MS: 30000,
  EDGE_FUNCTION_INVOKE_MS: 60000,
  STREAMING_MS: 120000,
  CONNECTION_MS: 10000,
  DEFAULT_MS: 60000,
  
  // Retry configuration
  RETRY_MAX_ATTEMPTS: 3,
  RETRY_INITIAL_DELAY_MS: 1000,
  RETRY_MAX_DELAY_MS: 10000,
  RETRY_BACKOFF_MULTIPLIER: 2,
  
  // UI delays
  INPUT_DEBOUNCE_MS: 300,
  PHASE_ADVANCE_MS: 2000,
  RETRY_BASE_MS: 800,
} as const;

// ============================================================================
// COLLISION ALGORITHM CONSTANTS - SSOT for collision detection
// ============================================================================

export const COLLISION_ALGORITHM = {
  EPSILON: 0.001,
  MIN_OVERLAP: 0.1,
  DEFAULT_RADIUS: 25,
  AXIS_COUNT: 8,
  MIN_PENETRATION: 0.1,
} as const;

// ============================================================================
// AUDIO DEFAULTS - SSOT for audio configuration
// ============================================================================

export const AUDIO_CONSTANTS = {
  SFX_POOL_SIZE: 4,
  BEEP_FREQUENCIES: {
    SHOOT: 800,
    HIT: 300,
    DEATH: 200,
    GAME_OVER: 150,
  },
  BEEP_DURATIONS: {
    SHOOT: 0.05,
    HIT: 0.1,
    DEATH: 0.3,
    GAME_OVER: 0.5,
  },
  BEEP_VOLUME_MULTIPLIER: 0.1,
  DEFAULT_MASTER_VOLUME: 0.7,
  DEFAULT_SFX_VOLUME: 0.8,
  DEFAULT_MUSIC_VOLUME: 0.5,
} as const;

// ============================================================================
// VOXEL WORLD CONSTANTS - SSOT for voxel games
// ============================================================================

export const VOXEL_WORLD = {
  SIZE: 64,
  MAX_HEIGHT: 18,
  VOXEL_SIZE: 1,
  SUN_RADIUS: 80,
  SUN_SEGMENTS: 32,
} as const;

// ============================================================================
// TERRAIN NOISE CONSTANTS - SSOT for terrain generation
// ============================================================================

export const TERRAIN_NOISE = {
  HEIGHT_MIN: 2,
  HEIGHT_MULTIPLIER: 0.9,
  HEIGHT_OFFSET: 4,
  NOISE_SCALE: 0.2,
  MICRO_NOISE_SCALE: 0.3,
  PATCH_SCALE: 0.2,
  SLOPE_THRESHOLD: 1.2,
  NORMALIZATION_DIVISOR: 4294967295,
} as const;

// ============================================================================
// RAIN SYSTEM CONSTANTS - SSOT for weather effects
// ============================================================================

export const RAIN_SYSTEM = {
  LIGHT: { intensity: 0.3, particles: 10000, speed: 15, windSpeed: 5 },
  MEDIUM: { intensity: 0.6, particles: 25000, speed: 25, windSpeed: 10 },
  HEAVY: { intensity: 0.9, particles: 40000, speed: 35, windSpeed: 15 },
  DEFAULT: { intensity: 0.6, particles: 40000, speed: 25, windSpeed: 10 },
} as const;

// ============================================================================
// SPAWNER DEFAULTS - SSOT for spawner configuration
// ============================================================================

export const SPAWNER_DEFAULTS = {
  MAX_ENEMIES: 20,
  DEFAULT_SPAWN_RATE: 2,
  MAX_SPAWNED: 5,
  FISH_COUNT: 50,
  WATER_DENSITY: 1000,
} as const;

// ============================================================================
// SCORE SYSTEM CONSTANTS - SSOT for scoring
// ============================================================================

export const SCORE_CONSTANTS = {
  BASE_COMBO_WINDOW: 2.0,
  COMBO_WINDOW_BONUS: 0.02,
  COMBO_WINDOW_MAX_BONUS: 1.0,
  MULTIPLIER_TIERS: [
    [0, 1.0],
    [5, 1.5],
    [10, 2.0],
    [20, 2.5],
    [50, 3.0],
    [100, 4.0],
  ] as [number, number][],
} as const;

// ============================================================================
// COLLISION SYSTEM CONSTANTS - SSOT for collision detection
// ============================================================================

export const COLLISION_CONSTANTS = {
  CELL_SIZE: 100,
  MAX_ENTITIES_PER_CELL: 10,
  MAX_GRID_WIDTH: 20,
  MAX_GRID_HEIGHT: 20,
  BATCH_SIZE: 50,
  FRAME_TIME_BUDGET_MS: 4,
  MAX_CALLBACKS_PER_COLLISION: 5,
  EXECUTION_TIMEOUT_MS: 50,
  QUEUE_BATCH_SIZE: 10,
} as const;

// ============================================================================
// ENTITY TYPES - SSOT for entity type strings
// ============================================================================

export const ENTITY_TYPES = {
  PLAYER: "player",
  ENEMY: "enemy",
  BULLET: "bullet",
  SPAWNER: "spawner",
  POWERUP: "powerup",
  WALL: "wall",
  ASTEROID: "asteroid",
  PLATFORM: "platform",
  COLLECTIBLE: "collectible",
  UI: "ui",
} as const;

// ============================================================================
// VOXEL TERRAIN CONSTANTS - SSOT for terrain generation
// ============================================================================

export const VOXEL_TERRAIN = {
  SEGMENTS: 220,
  BOTTOM_Y: -28,
  TEX_SCALE: 0.08,
  SEA_LEVEL: 3.2,
  ROCK_HEIGHT: 10.0,
  SEA_LEVEL_UPPER: 3.4,
  SEA_LEVEL_LOWER: 3.0,
  SLOPE_LOWER: 0.35,
  SLOPE_UPPER: 0.75,
  ROCK_HEIGHT_UPPER: 14.0,
} as const;

// ============================================================================
// VALIDATION CONSTANTS - SSOT for input validation
// ============================================================================

export const VALIDATION_CONSTANTS = {
  MAX_INPUT_LENGTH: 10000,
  MAX_MESSAGE_LENGTH: 50000,
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 200,
  MIN_DESCRIPTION_LENGTH: 0,
  MAX_DESCRIPTION_LENGTH: 5000,
} as const;

// ============================================================================
// RETRY CONSTANTS - SSOT for retry logic
// ============================================================================

export const RETRY_CONSTANTS = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 30000,
} as const;