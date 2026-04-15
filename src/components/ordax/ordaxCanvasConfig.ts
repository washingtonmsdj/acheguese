/**
 * 🔧 ORDAX CANVAS CONFIG - CONFIGURAÇÃO DO CANVAS
 * 
 * Importa valores compartilhados de config.ts central.
 * Contém apenas configurações específicas do canvas rendering.
 */

import {
  ENGINE_PERFORMANCE,
  ENTITY_LIMITS,
  PHYSICS_DEFAULTS,
  VALIDATION_RANGES,
  WORLD,
  VISUAL_DEFAULTS,
} from "@/lib/ordax/config";

// ============================================================================
// CONFIGURAÇÃO DE PERFORMANCE (delegada ao config central)
// ============================================================================

export const PERFORMANCE_CONFIG = {
  MAX_DELTA_TIME: ENGINE_PERFORMANCE.MAX_DELTA_TIME,
  MIN_FPS: 10,
  TARGET_FPS: ENGINE_PERFORMANCE.TARGET_FPS,
  
  MAX_ENTITIES: ENTITY_LIMITS.MAX_ENTITIES,
  MAX_SPAWNED: ENTITY_LIMITS.MAX_SPAWNED,
  MAX_BULLETS: ENTITY_LIMITS.MAX_BULLETS,
  MAX_PARTICLES: ENTITY_LIMITS.MAX_PARTICLES,
  
  CACHE_SIZE: 100,
  DEBOUNCE_MS: ENGINE_PERFORMANCE.DEBOUNCE_MS,
  THROTTLE_MS: ENGINE_PERFORMANCE.THROTTLE_MS,
} as const;

// ============================================================================
// CONFIGURAÇÃO DE FÍSICA (delegada ao config central)
// ============================================================================

export const PHYSICS_CONFIG = {
  MASS: {
    DEFAULT: PHYSICS_DEFAULTS.MASS,
    RACING: 0.5,
    PLATFORMER: 1.2,
    SHOOTER: 0.8,
  },
  FRICTION: {
    DEFAULT: PHYSICS_DEFAULTS.FRICTION,
    RACING: 0.95,
    PLATFORMER: 0.99,
    SHOOTER: 0.97,
  },
  RESTITUTION: {
    DEFAULT: PHYSICS_DEFAULTS.RESTITUTION,
    RACING: 0.1,
    PLATFORMER: 0.3,
    SHOOTER: 0.15,
  },
  MAX_VELOCITY: PHYSICS_DEFAULTS.MAX_VELOCITY,
  GRAVITY: PHYSICS_DEFAULTS.GRAVITY,
} as const;

// ============================================================================
// CONFIGURAÇÃO DE COLISÃO
// ============================================================================

export const COLLISION_CONFIG = {
  // Grid size para SpatialGrid (broad-phase de colisão)
  GRID_SIZE: 100,
} as const;

// ============================================================================
// CONFIGURAÇÃO DE DANO
// ============================================================================

/**
 * Configuração de dano
 */
export const DAMAGE_CONFIG = {
  // Dano por colisão
  ENEMY_COLLISION: 20,
  ASTEROID_COLLISION: 30,
  BULLET_HIT: 10,
  
  // Dano por tipo de inimigo
  ENEMY: {
    SCOUT: 15,
    TANK: 25,
    SNIPER: 20,
  },
  
  // Vida de inimigos
  ENEMY_HP: {
    SCOUT: 1,
    TANK: 3,
    SNIPER: 2,
  },
  
  // Limites de dano
  MIN_DAMAGE: 0,
  MAX_DAMAGE: 1000,
  
  // Damage flash (tempo de flash visual ao tomar dano)
  FLASH: {
    GAME_OVER: 0.25, // segundos
    COLLISION: 0.15, // segundos
    // Alpha do flash visual
    ALPHA: {
      DIVISOR: 0.15, // Divisor para cálculo de alpha
      MULTIPLIER: 0.35, // Multiplicador para alpha final
    },
  },
} as const;

// ============================================================================
// CONFIGURAÇÃO DE PONTUAÇÃO
// ============================================================================

/**
 * Configuração de pontuação
 */
export const SCORE_CONFIG = {
  // Pontos por ação
  ENEMY: 100,
  ASTEROID: 50,
  POWERUP: 200,
  COMBO_MULTIPLIER: 1.5,
  
  // Multiplicadores
  MULTIPLIER: {
    BASE: 1.0,
    MAX: 5.0,
    INCREMENT: 0.1,
    DECAY_RATE: 0.95,
  },
  
  // Combo
  COMBO: {
    TIME_WINDOW: 2000, // 2 segundos
    MAX_CHAIN: 10,
  },
  
  // High score
  HIGH_SCORE_KEY: 'ordax_high_score',
  DEFAULT_HIGH_SCORE: 0,
} as const;

// ============================================================================
// CONFIGURAÇÃO DE INIMIGOS
// ============================================================================

/**
 * Configuração de inimigos
 */
export const ENEMY_CONFIG = {
  // Vida
  HP: {
    SCOUT: 1,
    TANK: 3,
    SNIPER: 2,
  },
  
  // Velocidade
  VELOCITY: {
    SCOUT: { x: 0, y: 100 },
    TANK: { x: 0, y: 50 },
    SNIPER: { x: 0, y: 75 },
  },
  
  // Tamanho
  SIZE: {
    SCOUT: { w: 30, h: 30 },
    TANK: { w: 50, h: 50 },
    SNIPER: { w: 25, h: 40 },
  },
  
  // Spawn rate
  SPAWN_RATE: {
    MIN: 1.0, // segundos
    MAX: 3.0,
    DECREASE_PER_LEVEL: 0.1,
  },
  
  // AI chase speed
  AI_CHASE_SPEED: 80,
} as const;

// ============================================================================
// CONFIGURAÇÃO DE PARTÍCULAS
// ============================================================================

/**
 * Configuração de partículas
 */
export const PARTICLE_CONFIG = {
  // Contagem
  COUNT: {
    ENEMY_HIT: 10,
    ASTEROID_HIT: 15,
    BULLET_ENEMY: 18,
    BULLET_ASTEROID: 12,
    POWERUP: 20,
    EXPLOSION: 28,
  },
  
  // Vida
  LIFE: {
    ENEMY_HIT: 0.5,
    ASTEROID_HIT: 0.8,
    BULLET_ENEMY: 0.6,
    BULLET_ASTEROID: 0.4,
    POWERUP: 1.0,
    EXPLOSION: 0.8,
  },
  
  // Velocidade
  SPEED: {
    ENEMY_HIT: 100,
    ASTEROID_HIT: 150,
    BULLET_ENEMY: 140,
    BULLET_ASTEROID: 120,
    POWERUP: 200,
    EXPLOSION: 220,
  },
  
  // Tamanho
  SIZE: {
    ENEMY_HIT: 3,
    ASTEROID_HIT: 5,
    BULLET_ENEMY: 4,
    BULLET_ASTEROID: 4,
    POWERUP: 4,
    EXPLOSION: 6,
  },
  
  // Spread (dispersão)
  SPREAD: {
    ENEMY_HIT: Math.PI,
    ASTEROID_HIT: Math.PI,
    BULLET_ENEMY: Math.PI * 2,
    BULLET_ASTEROID: Math.PI / 2,
    POWERUP: Math.PI * 2,
    EXPLOSION: Math.PI * 2,
  },
  
  // Explosão multi-layer (enemy death)
  EXPLOSION: {
    LAYER_1: {
      count: 35,
      life: 0.7,
      speed: 280,
      size: 7,
      endSize: 1,
      gravity: 50,
      spread: Math.PI * 2,
      direction: 0,
      color: "hsl(40, 100%, 65%)",
      endColor: "hsl(25, 100%, 50%)",
    },
    LAYER_2: {
      count: 25,
      life: 0.5,
      speed: 200,
      size: 5,
      endSize: 2,
      gravity: 30,
      spread: Math.PI * 2,
      direction: 0,
      color: "hsl(15, 100%, 55%)",
      endColor: "hsl(0, 100%, 40%)",
    },
    LAYER_3: {
      count: 12,
      life: 0.25,
      speed: 120,
      size: 10,
      endSize: 0,
      spread: Math.PI * 2,
      direction: 0,
      color: "hsl(45, 100%, 95%)",
    },
    LAYER_4: {
      count: 18,
      life: 0.6,
      speed: 80,
      size: 4,
      endSize: 2,
      gravity: 20,
      spread: Math.PI * 2,
      direction: 0,
      color: "hsl(0, 0%, 70%)",
      endColor: "hsl(0, 0%, 30%)",
    },
    LAYER_5: {
      count: 15,
      life: 0.8,
      speed: 320,
      size: 3,
      endSize: 0,
      gravity: 0,
      spread: Math.PI * 2,
      direction: 0,
      color: "hsl(340, 90%, 60%)", // Default spark color
    },
  },
} as const;

// ============================================================================
// CONFIGURAÇÃO DE CÂMERA
// ============================================================================

/**
 * Configuração de câmera
 */
export const CAMERA_CONFIG = {
  // Suavidade de follow
  FOLLOW_SMOOTHNESS: 0.1,
  
  // Shake (trepidação)
  SHAKE: {
    ENEMY_COLLISION: {
      INTENSITY: 5,
      DURATION: 0.3,
    },
    ASTEROID_COLLISION: {
      INTENSITY: 8,
      DURATION: 0.5,
    },
    BULLET_HIT: {
      INTENSITY: 3,
      DURATION: 0.2,
    },
    ENEMY_DEATH: {
      INTENSITY: 6,
      DURATION: 0.35,
    },
  },
  
  // Limites
  BOUNDS: {
    X: 0,
    Y: 0,
    W: 800, // WORLD.w
    H: 600, // WORLD.h
  },
} as const;

// ============================================================================
// CONFIGURAÇÃO DE BUFFS
// ============================================================================

/**
 * Configuração de buffs
 */
export const BUFFS_CONFIG = {
  // Duração em segundos
  SHIELD_DURATION: 10,
  SPREAD_DURATION: 15,
  
  // Efeitos
  SHIELD: {
    ABSORBS_HITS: 1,
    COLOR: '#00ffff',
    OPACITY: 0.3,
  },
  
  SPREAD: {
    BULLET_COUNT: 3,
    ANGLE_SPREAD: 30, // graus
    COLOR: '#ff00ff',
  },
} as const;

// ============================================================================
// CONFIGURAÇÃO DE CANVAS
// ============================================================================

/**
 * Configuração de canvas
 */
export const CANVAS_CONFIG = {
  // Dimensões mínimas
  MIN_WIDTH: 100,
  MIN_HEIGHT: 100,
  
  // DPR (device pixel ratio)
  MIN_DPR: 1,
  MAX_DPR: 3,
  
  // Frame (borda)
  FRAME: {
    WIDTH: 2,
    ALPHA: 0.5,
  },
  
  // Background
  BACKGROUND: '#0a0a0a',
} as const;

// ============================================================================
// CONFIGURAÇÃO DE ESTRELAS (BACKGROUND)
// ============================================================================

/**
 * Configuração de estrelas
 */
export const STARS_CONFIG = {
  // Contagem
  MAX_COUNT: 500,
  DENSITY: 200,
  
  // Tamanho
  SIZE_MIN: 1,
  SIZE_MAX: 3,
  SIZE_RANGE: 2, // SIZE_MAX - SIZE_MIN
  SIZE_MULTIPLIER: 1.5, // Multiplicador para variação de tamanho
  
  // Velocidade
  SPEED: {
    MIN: 10,
    MAX: 50,
  },
  
  // Brightness (brilho)
  BRIGHTNESS_RANGE: {
    MIN: 0.3,
    MAX: 1.0, // 0.3 + 0.7
  },
  
  // Pulse speed (velocidade de pulso)
  PULSE_SPEED_RANGE: {
    MIN: 0.5,
    MAX: 2.5, // 0.5 + 2.0
  },
  
  // Cores
  COLORS: [
    '#ffffff', // branco
    '#ffffcc', // amarelo claro
    '#ccffff', // azul claro
    '#ffccff', // rosa claro
  ],
} as const;

// ============================================================================
// CONFIGURAÇÃO DE ÁUDIO
// ============================================================================

/**
 * Configuração de áudio
 */
export const AUDIO_CONFIG = {
  // Frequências
  FREQUENCIES: {
    SHOOT: 800,
    HIT: 300,
    POWER: 1200,
    SCORE: 1000,
    GAMEOVER: 200,
  },
  
  // Ganho (volume)
  GAIN: {
    INITIAL: 0.001,
    PEAK: 0.1,
  },
  
  // Timing
  TIMING: {
    ATTACK: 0.01,
    RELEASE_SHORT: 0.1,
    RELEASE_LONG: 0.5,
    STOP_SHORT: 0.2,
    STOP_LONG: 1.0,
  },
  
  // Tipos de onda
  OSCILLATOR_TYPES: {
    SHOOT: 'triangle' as OscillatorType,
    HIT: 'sawtooth' as OscillatorType,
    POWER: 'triangle' as OscillatorType,
    SCORE: 'sine' as OscillatorType,
    GAMEOVER: 'sawtooth' as OscillatorType,
  },
} as const;

// ============================================================================
// CONFIGURAÇÃO DE CORES
// ============================================================================

/**
 * Configuração de cores (delegada ao config central + específicas do canvas)
 */
export const COLORS_CONFIG = {
  FALLBACK: VISUAL_DEFAULTS.FALLBACK_COLORS,
  
  PARTICLE: {
    ENEMY: '#ef4444',
    ASTEROID: '#f59e0b',
    ASTEROID_BULLET: '#f59e0b',
    PRIMARY: '#3b82f6',
  },
  
  UI: {
    HEALTH: '#10b981',
    SHIELD: '#3b82f6',
    SCORE: '#f59e0b',
    BACKGROUND: 'rgba(0, 0, 0, 0.7)',
    TEXT: '#ffffff',
  },
  
  CANVAS_BACKGROUND: VISUAL_DEFAULTS.CANVAS_BACKGROUND,
} as const;

// ============================================================================
// CONFIGURAÇÃO DE MENSAGENS
// ============================================================================

export const MESSAGES_CONFIG = {
  SPRITE_LOAD_FAILED: 'Falha ao carregar sprite:',
  MUSIC_LOAD_FAILED: 'Falha ao carregar música:',
  SOUND_LOAD_FAILED: 'Falha ao carregar som:',
  
  GAME_OVER: 'Game Over! Pressione R para reiniciar',
  PAUSED: 'Jogo pausado',
  SCORE: 'Pontuação:',
  HEALTH: 'Vida:',
  SHIELD: 'Escudo:',
  MULTIPLIER: 'Multiplicador:',
  COMBO: 'Combo:',
  
  CONTROLS: 'Controles: WASD/Setas para mover, Espaço para atirar',
  RESTART: 'R para reiniciar',
  
  ARIA: {
    CANVAS_LABEL: 'Canvas do jogo Ordax',
    CANVAS_ROLE: 'application',
  },
} as const;

// ============================================================================
// CONFIGURAÇÃO DE ESTILOS
// ============================================================================

export const STYLES_CONFIG = {
  CANVAS_CONTAINER: 'w-full h-full bg-black rounded-lg overflow-hidden',
  UI_CONTAINER: 'absolute top-4 left-4 right-4 flex flex-col gap-2',
  UI_PANEL: 'bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white',
  UI_TEXT: 'text-sm font-medium',
  UI_VALUE: 'text-lg font-bold',
  HEALTH_BAR: {
    CONTAINER: 'w-48 h-4 bg-gray-800 rounded-full overflow-hidden',
    FILL: 'h-full rounded-full transition-all duration-300',
  },
} as const;

// ============================================================================
// CONFIGURAÇÃO DE VALIDAÇÃO (delegada ao config central)
// ============================================================================

export const VALIDATION_CONFIG = {
  MIN_HEALTH: VALIDATION_RANGES.HEALTH.MIN,
  MAX_HEALTH: VALIDATION_RANGES.HEALTH.MAX,
  DEFAULT_HEALTH: VALIDATION_RANGES.HEALTH.DEFAULT,
  MIN_SHIELD: VALIDATION_RANGES.SHIELD.MIN,
  MAX_SHIELD: VALIDATION_RANGES.SHIELD.MAX,
  DEFAULT_SHIELD: VALIDATION_RANGES.SHIELD.DEFAULT,
  MIN_DAMAGE: VALIDATION_RANGES.DAMAGE.MIN,
  MAX_DAMAGE: VALIDATION_RANGES.DAMAGE.MAX,
  MIN_DIMENSION: VALIDATION_RANGES.DIMENSION.MIN,
  MAX_DIMENSION: VALIDATION_RANGES.DIMENSION.MAX,
  MIN_COORDINATE: VALIDATION_RANGES.COORDINATE.MIN,
  MAX_COORDINATE: VALIDATION_RANGES.COORDINATE.MAX,
  MIN_VELOCITY: VALIDATION_RANGES.VELOCITY.MIN,
  MAX_VELOCITY: VALIDATION_RANGES.VELOCITY.MAX,
} as const;

// ============================================================================
// CONFIGURAÇÃO DE MUNDO (delegada ao config central)
// ============================================================================

export const WORLD_CONFIG = {
  w: WORLD.W,
  h: WORLD.H,
  BOUNDS: WORLD.BOUNDS,
  CENTER: { x: WORLD.CENTER_X, y: WORLD.CENTER_Y },
} as const;