/**
 * Configurações de Física - Flood Test Game
 * 
 * ✅ SSOT: Importa constantes da engine e adiciona apenas configurações específicas do jogo.
 * 
 * Baseado em física real e narrativa bíblica (Gênesis 7-8).
 */

import {
  PHYSICAL_CONSTANTS,
  PHYSICS_CONFIG_DEFAULTS,
  ARK_CONSTANTS,
  TUNING_DEFAULTS,
  TUNING_LIMITS,
} from "@/lib/constants/systems/physics-advanced";

/**
 * ✅ Re-exportar constantes da engine (não duplicar!)
 */
export { PHYSICAL_CONSTANTS, PHYSICS_CONFIG_DEFAULTS, ARK_CONSTANTS };

/**
 * Física da chuva (específico do flood test)
 */
export const RAIN_PHYSICS = {
  /** Velocidade terminal da chuva (m/s) - física real */
  TERMINAL_VELOCITY: {
    min: 8,
    max: 10,
  },
  /** Comprimento visual da gota (metros) */
  DROP_LENGTH: 0.5,
} as const;

/**
 * Física do dilúvio bíblico (específico do flood test)
 * 
 * Baseado em Gênesis 7:11-12:
 * "...romperam-se todas as fontes do grande abismo,
 * e as comportas dos céus se abriram..."
 */
export const BIBLICAL_FLOOD_PHYSICS = {
  /** Taxa de subida da água (metros por hora) - mundo real */
  WATER_RISE_RATE: 9.0,
  /** Escala de tempo padrão (1 min real = X horas no jogo) */
  DEFAULT_TIME_SCALE: 60,
  /** Duração do ramp-up da chuva (segundos) */
  RAIN_RAMP_UP_DURATION: 30,
} as const;

/**
 * Física das ondas Gerstner (específico do flood test)
 * 
 * Ondas seguem física oceânica real:
 * c = √(g/k) onde k = 2π/λ
 */
export const WAVE_PHYSICS = {
  /** Direção do vento (nordeste) */
  WIND_DIRECTION: { x: 1, y: 0.3 },
  /** Força do vento por intensidade (m/s) */
  WIND_STRENGTH: {
    calm: 2.0,
    moderate: 8.0,
    biblical: 15.0,
  },
} as const;

/**
 * Física da água (específico do flood test)
 */
export const WATER_PHYSICS = {
  /** Profundidade do oceano (metros) */
  OCEAN_DEPTH: 50,
  /** Threshold para mostrar água (metros acima do nível inicial) */
  VISIBILITY_THRESHOLD: 0.5, // ✅ CORREÇÃO: Água visível desde o início (pré-dilúvio)
  /** Duração do fade in (segundos) */
  FADE_IN_DURATION: 2.0,
  /** Duração do fade out (segundos) */
  FADE_OUT_DURATION: 1.0,
  /** Opacidade máxima da superfície */
  SURFACE_MAX_OPACITY: 0.98,
  /** Opacidade máxima do volume */
  VOLUME_MAX_OPACITY: 0.6,
} as const;

/**
 * Física do terreno (específico do flood test)
 */
export const TERRAIN_PHYSICS = {
  /** Altura mínima do terreno (metros) */
  MIN_HEIGHT: 0,
  /** Altura máxima do terreno (metros) */
  MAX_HEIGHT: 18,
  /** Nível inicial da água (começa no nível do terreno baixo, não abaixo) */
  SEA_LEVEL: 2, // ✅ CORREÇÃO: Água começa visível nas partes baixas do terreno
  /** Fundo do volume sólido do terreno */
  BOTTOM_Y: -28,
  /** Tamanho do mundo (metros) */
  WORLD_SIZE: 300,
  /** Seed para geração procedural */
  SEED: 1337,
} as const;

/**
 * Deformacao dinamica do terreno (areia/solo)
 */
export const TERRAIN_DEFORMATION = {
  ENABLED: true,
  RESOLUTION: 192,
  MAX_DEPTH: 0.45,
  RECOVERY_RATE: 0.03,
} as const;

/**
 * Física da câmera (específico do flood test)
 */
export const CAMERA_PHYSICS = {
  /** Altura dos olhos (metros) */
  EYE_HEIGHT: 2.0,
  /** Clearance mínima acima do terreno (metros) */
  MIN_CLEARANCE: 1.0,
  /** Velocidade de movimento (m/s) */
  MOVE_SPEED: {
    normal: 18,
    sprint: 30,
  },
  /** Impulso de pulo (metros) */
  JUMP_IMPULSE: 2.2,
} as const;

/**
 * ✅ Re-exportar tuning da engine
 */
export { TUNING_DEFAULTS, TUNING_LIMITS };

/**
 * Calcular taxa de subida da água ajustada para escala de tempo
 * 
 * @param timeScale - Escala de tempo (ex: 60 = 1 min real = 1 hora no jogo)
 * @returns Taxa de subida em metros por segundo (no jogo)
 */
export function calculateWaterRiseRate(timeScale: number = BIBLICAL_FLOOD_PHYSICS.DEFAULT_TIME_SCALE): number {
  return (BIBLICAL_FLOOD_PHYSICS.WATER_RISE_RATE / 3600) * timeScale;
}

/**
 * Calcular velocidade de fase de onda Gerstner
 * 
 * Fórmula: c = √(g/k) onde k = 2π/λ
 * 
 * @param wavelength - Comprimento da onda em metros
 * @returns Velocidade de fase em m/s
 */
export function calculateWaveSpeed(wavelength: number): number {
  const k = (2 * Math.PI) / wavelength;
  return Math.sqrt(PHYSICAL_CONSTANTS.GRAVITY_EARTH / k);
}
