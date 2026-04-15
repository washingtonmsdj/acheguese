/**
 * Configurações de Gameplay - Stellar Vanguard
 * 
 * ✅ SSOT para player, combate, spawning, balanceamento
 * 
 * Centraliza todos os parâmetros de gameplay para evitar magic numbers.
 */

export const PLAYER_CONFIG = {
  /** Posição Y inicial (fator do WORLD.h) */
  INITIAL_Y_FACTOR: 0.86,
  
  /** HP inicial */
  BASE_HP: 100,
  
  /** Número inicial de bombas */
  BASE_BOMBS: 2,
  
  /** Taxa de tiro base (tiros por segundo) */
  BASE_FIRE_RATE: 9,
  
  /** Velocidade base dos projéteis (pixels/segundo) */
  BASE_BULLET_SPEED: 620,
  
  /** Velocidade de movimento base (pixels/segundo) */
  BASE_SPEED: 280,
  
  /** Cooldown do dash (segundos) */
  DASH_COOLDOWN: 0.9,
  
  /** Duração do dash (segundos) */
  DASH_DURATION: 0.18,
  
  /** Duração dos iframes após dash (segundos) */
  IFRAME_DURATION: 0.25,
  
  /** Multiplicador de velocidade durante dash */
  DASH_SPEED_MULTIPLIER: 2.4,
  
  /** Margem das bordas (pixels) */
  EDGE_MARGIN: {
    horizontal: 16,
    vertical: 20,
  },
  
  /** Raio de colisão (pixels) */
  COLLISION_RADIUS: 12,
  
  /** Raio de coleta de pickups (pixels) */
  PICKUP_RADIUS: 14,
  
  /** Offset Y para burst de dash (pixels) */
  DASH_BURST_OFFSET: 10,
  
  /** Offset Y para burst de special (pixels) */
  SPECIAL_BURST_OFFSET: 20,
  
  /** Offset Y para muzzle flash (pixels) */
  MUZZLE_FLASH_OFFSET: 16,
} as const;

export const COMBAT_CONFIG = {
  /** Bônus de fire rate por nível de upgrade */
  FIRE_RATE_BONUS_PER_LEVEL: 2.2,
  
  /** Cooldown base do special (segundos) */
  SPECIAL_BASE_COOLDOWN: 4.2,
  
  /** Redução de cooldown do special por nível */
  SPECIAL_COOLDOWN_REDUCTION: 0.6,
  
  /** Cooldown mínimo do special (segundos) */
  SPECIAL_MIN_COOLDOWN: 2.4,
  
  /** Dano da bomba em inimigos normais */
  BOMB_DAMAGE: 3,
  
  /** Dano da bomba em boss */
  BOMB_BOSS_DAMAGE: 10,
  
  /** Duração do flash de UI após bomba (segundos) */
  BOMB_FLASH_DURATION: 0.12,
  
  /** Duração dos iframes após dano (segundos) */
  DAMAGE_IFRAME_DURATION: 0.35,
  
  /** Dano de colisão por tipo de inimigo */
  COLLISION_DAMAGE: {
    light: 10,
    medium: 14,
    heavy: 18,
  },

  /** Intervalo mínimo entre tiros (segundos) */
  MIN_FIRE_INTERVAL: 0.12,
  
  /** Projéteis */
  BULLET: {
    /** Raio base (pixels) */
    baseRadius: 3,
    /** Raio do special (pixels) */
    specialRadius: 4,
    /** Dano base */
    baseDamage: 1,
    /** Dano do special */
    specialDamage: 3,
    /** Velocidade extra do special */
    specialSpeedBonus: 120,
    /** Força de guidance (0-1) */
    guidanceStrength: 0.08,
    /** Velocidade de guidance */
    guidanceSpeed: 120,
  },
  
  /** Spread shot */
  SPREAD: {
    /** Ângulo de spread (nível 1) */
    angle1: 0.34,
    /** Ângulo de spread (nível 2) */
    angle2: 0.46,
    /** Fator de redução de velocidade */
    speedReduction: {
      level1: 0.34,
      level2: 0.46,
    },
    /** Offset horizontal para double shot */
    doubleOffset: 7,
    /** Offset horizontal para spread */
    spreadOffset: 8,
    /** Offset Y para spawn de projéteis */
    bulletSpawnOffsetY: 16,
    /** Velocidade lateral para spread */
    sideVelocity: 120,
  },
} as const;

export const SPAWN_CONFIG = {
  /** Taxa base de spawn (inimigos por segundo) */
  BASE_SPAWN_RATE: 1.35,
  
  /** Aumento de taxa por wave */
  WAVE_RATE_INCREASE: 0.22,
  
  /** Score necessário para boss aparecer */
  BOSS_GATE_SCORE: 1200,
  
  /** Intervalo de score para aumentar wave */
  WAVE_SCORE_INTERVAL: 240,
  
  /** Probabilidades de spawn por tipo */
  SPAWN_PROBABILITY: {
    light: 0.62,
    medium: 0.88,
    // heavy: resto (1.0)
  },
  
  /** Margem das bordas para spawn (pixels) */
  SPAWN_MARGIN: 40,
  
  /** Posição Y de spawn (fora da tela) */
  SPAWN_Y: -30,
} as const;

export const ENEMY_CONFIG = {
  /** Configurações por tipo de inimigo */
  light: {
    baseSpeed: 120,
    speedPerWave: 8,
    size: 26,
    hp: 1,
    velocityRange: { min: -50, max: 50 },
    shootProbability: 0.45,
    spreadCount: 1,
    bounceMargin: 20, // Margem para bounce nas bordas
    shootOffsetY: 0.45, // Offset Y para tiro (fator da altura)
  },
  medium: {
    baseSpeed: 95,
    speedPerWave: 8,
    size: 34,
    hp: 3,
    velocityRange: { min: -35, max: 35 },
    shootProbability: 1.0,
    spreadCount: 2,
    bounceMargin: 20,
    shootOffsetY: 0.45,
  },
  heavy: {
    baseSpeed: 70,
    speedPerWave: 8,
    size: 44,
    hp: 6,
    velocityRange: { min: -22, max: 22 },
    shootProbability: 1.0,
    spreadCount: 3,
    bounceMargin: 20,
    shootOffsetY: 0.45,
  },
  boss: {
    size: { width: 140, height: 84 },
    baseHp: 90,
    entrySpeed: 45,
    entryY: 120,
    initialY: -60, // Posição Y inicial (fora da tela)
    patrolAmplitude: { x: 240, y: 10 },
    patrolFrequency: { x: 0.8, y: 0.9 },
    phaseThresholds: [0.66, 0.33], // HP % para mudar de fase
    bounceMargin: 20,
    shootOffsetY: 0.45,
  },
} as const;

export const ENEMY_SHOOTING = {
  /** Intervalo base de tiro (segundos) */
  BASE_INTERVAL: 1.35,
  
  /** Redução de intervalo por wave */
  INTERVAL_REDUCTION_PER_WAVE: 0.05,
  
  /** Intervalo mínimo (segundos) */
  MIN_INTERVAL: 0.5,
  
  /** Velocidade base dos projéteis */
  BASE_BULLET_SPEED: 220,
  
  /** Aumento de velocidade por wave */
  SPEED_INCREASE_PER_WAVE: 10,
  
  /** Raio dos projéteis inimigos */
  BULLET_RADIUS: 3.2,
  
  /** Dano por tipo */
  DAMAGE: {
    light: 8,
    medium: 8,
    heavy: 12,
  },
  
  /** Spread angle para medium/heavy */
  SPREAD_ANGLE: 0.18,
  
  /** Boss shooting */
  BOSS: {
    /** Intervalo multiplicador (mais rápido que inimigos normais) */
    intervalMultiplier: 0.8,
    /** Velocidade dos projéteis */
    bulletSpeed: 260,
    /** Raio dos projéteis */
    bulletRadius: 4,
    /** Dano base */
    baseDamage: 10,
    /** Dano aumentado (fase 3) */
    increasedDamage: 12,
    /** Padrões de tiro */
    patterns: {
      cone: {
        count: 5,
        angleSpread: 0.16,
      },
      ring: {
        count: 14,
        speedMultiplier: 0.72,
      },
      aimed: {
        speedMultiplier: 0.95,
        sideSpeed: { x: 120, y: 240 },
      },
    },
  },
} as const;

export const SCORE_CONFIG = {
  /** Score por tipo de inimigo */
  ENEMY_KILL: {
    light: 14,
    medium: 22,
    heavy: 40,
    boss: 200,
  },
  
  /** Score por pickup coletado */
  PICKUP_COLLECTED: 2,
  
  /** Score bônus por boss derrotado */
  BOSS_DEFEATED_BONUS: 500,
} as const;

export const PICKUP_CONFIG = {
  /** Quantidade de energia por tipo de inimigo */
  ENERGY_DROP: {
    light: 1,
    medium: 2,
    heavy: 4,
  },
  
  /** Raio do pickup */
  RADIUS: 6,
  
  /** Velocidade inicial */
  INITIAL_VELOCITY: {
    x: { min: -40, max: 40 },
    y: { min: 30, max: 70 },
  },
  
  /** Gravidade (pixels/segundo²) */
  GRAVITY: 18,
} as const;

export const UPGRADE_CONFIG = {
  /** Shield */
  SHIELD: {
    baseAmount: 20,
    perLevel: 20,
  },
  
  /** Regeneração de shield */
  REGEN: {
    baseAmount: 2,
    perLevel: 2,
  },
  
  /** Bombas extras */
  BOMB_PLUS: {
    maxBombs: 5,
  },
} as const;

export const PARTICLE_CONFIG = {
  /** Hit particles */
  HIT: {
    count: 1,
    velocity: { min: -40, max: 40 },
    lifetime: 0.22,
    size: 2.5,
  },
  
  /** Burst particles */
  BURST: {
    velocity: { min: -220, max: 220 },
    lifetime: { min: 0.25, max: 0.75 },
    size: { min: 1.5, max: 3.6 },
  },
  
  /** Muzzle flash particles */
  MUZZLE: {
    velocity: { x: { min: -20, max: 20 }, y: { min: -160, max: -60 } },
    lifetime: 0.18,
    size: 2,
  },
  
  /** Burst counts por tipo */
  BURST_COUNT: {
    dash: 28,
    special: 34,
    bomb: 120,
    enemyLight: 30,
    enemyHeavy: 46,
    bossDefeat: 160,
    enemyCollision: 24,
  },
  
  /** Configurações gerais de partículas */
  GENERAL: {
    /** Damping (fator de redução de velocidade) */
    damping: 0.98,
  },
} as const;

export const BOUNDS_CONFIG = {
  /** Margem para despawn de entidades (pixels) */
  DESPAWN_MARGIN: 120,
  
  /** Margem para despawn de inimigos (pixels) */
  ENEMY_DESPAWN_MARGIN: 80,
} as const;

