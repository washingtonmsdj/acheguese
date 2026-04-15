/**
 * Constantes de Água e Ondas - Engine SSOT
 * 
 * Sistema universal de física de água baseado em:
 * - Ondas Gerstner (física oceânica real)
 * - Princípio de Arquimedes (flutuação)
 * - Resistência hidrodinâmica
 * 
 * Usado por: Flood Test, Ocean Games, Water Physics
 */

import { PHYSICAL_CONSTANTS } from "./physics-advanced";

/**
 * Onda Gerstner (física oceânica real)
 * 
 * Fórmula: h = Σ A * cos(k * (D·P - c*t))
 * onde:
 * - A = amplitude
 * - k = 2π/λ (número de onda)
 * - D = direção (vetor unitário)
 * - P = posição (x, z)
 * - c = √(g/k) (velocidade de fase)
 * - t = tempo
 */
export interface GerstnerWave {
  /** Altura da onda em metros */
  amplitude: number;
  /** Comprimento da onda em metros */
  wavelength: number;
  /** Velocidade de propagação em m/s (calculada automaticamente) */
  speed: number;
  /** Direção (vetor normalizado) */
  direction: { x: number; y: number };
  /** Quão "pontiaguda" é a onda (0-1) */
  steepness: number;
}

/**
 * Presets de ondas por condição do mar (Escala de Douglas)
 */
export const WAVE_PRESETS = {
  /** Mar calmo (0-0.1m) */
  CALM: {
    amplitude: 0.05,
    wavelength: 10,
    steepness: 0.1,
  },
  /** Mar ligeiramente agitado (0.1-0.5m) */
  SLIGHT: {
    amplitude: 0.3,
    wavelength: 20,
    steepness: 0.3,
  },
  /** Mar moderado (0.5-1.25m) */
  MODERATE: {
    amplitude: 0.9,
    wavelength: 40,
    steepness: 0.5,
  },
  /** Mar agitado (1.25-2.5m) */
  ROUGH: {
    amplitude: 1.8,
    wavelength: 60,
    steepness: 0.6,
  },
  /** Mar muito agitado (2.5-4m) */
  VERY_ROUGH: {
    amplitude: 3.2,
    wavelength: 80,
    steepness: 0.7,
  },
  /** Mar grosso (4-6m) */
  HIGH: {
    amplitude: 5.0,
    wavelength: 100,
    steepness: 0.8,
  },
  /** Mar muito grosso (6-9m) */
  VERY_HIGH: {
    amplitude: 7.5,
    wavelength: 120,
    steepness: 0.85,
  },
  /** Mar tempestuoso (9-14m) */
  PHENOMENAL: {
    amplitude: 11.5,
    wavelength: 150,
    steepness: 0.9,
  },
} as const;

/**
 * Configuração de sistema de água
 */
export interface WaterSystemConfig {
  /** Nível inicial da água (metros) */
  initialLevel: number;
  /** Nível máximo da água (metros) */
  maxLevel?: number;
  /** Profundidade do oceano (metros) */
  depth: number;
  /** Preset de ondas ou customizado */
  wavePreset?: keyof typeof WAVE_PRESETS;
  /** Ondas customizadas (sobrescreve preset) */
  customWaves?: GerstnerWave[];
  /** Direção do vento (normalizada) */
  windDirection?: { x: number; y: number };
  /** Força do vento (m/s) */
  windStrength?: number;
  /** Densidade da água (kg/m³) - padrão: 1000 */
  density?: number;
  /** Viscosidade da água (Pa·s) - padrão: 0.001 */
  viscosity?: number;
}

/**
 * Constantes de água
 */
export const WATER_CONSTANTS = {
  /** Densidade da água doce (kg/m³) */
  FRESH_WATER_DENSITY: 1000,
  /** Densidade da água salgada (kg/m³) */
  SALT_WATER_DENSITY: 1025,
  /** Viscosidade dinâmica da água a 20°C (Pa·s) */
  VISCOSITY: 0.001,
  /** Tensão superficial da água (N/m) */
  SURFACE_TENSION: 0.0728,
  /** Índice de refração da água */
  REFRACTIVE_INDEX: 1.333,
  /** Velocidade do som na água (m/s) */
  SOUND_SPEED: 1481,
} as const;

/**
 * Configurações de renderização de água AAA
 * 
 * ✨ VISUAL UPGRADE: Cores vibrantes + realismo
 * Baseado em: Sea of Thieves, Subnautica, AC Odyssey
 */
export const WATER_RENDERING = {
  /** Opacidade da superfície */
  SURFACE_OPACITY: {
    min: 0.7,
    max: 0.85, // ✨ Reduzido de 0.98 para mais transparência
  },
  /** Opacidade do volume */
  VOLUME_OPACITY: {
    min: 0.3,
    max: 0.6, // ✨ Reduzido de 0.8 para mais transparência
  },
  /** Distorção (normal mapping) */
  DISTORTION_SCALE: {
    calm: 1.5,
    moderate: 3.5,
    rough: 6.0,
    storm: 10.0,
  },
  /** Cor da água por profundidade (✨ CORES VIBRANTES AAA) */
  WATER_COLOR: {
    shallow: 0x00CED1,  // ✨ Turquesa tropical (era 0x4A90E2)
    medium: 0x1E90FF,   // ✨ Azul dodger vibrante (era 0x2E5C8A)
    deep: 0x0047AB,     // ✨ Azul cobalto profundo (era 0x0A2540)
  },
  /** Threshold de fade (metros) */
  FADE_THRESHOLD: 2.0,
  /** Duração de fade in (segundos) */
  FADE_IN_DURATION: 2.0,
  /** Duração de fade out (segundos) */
  FADE_OUT_DURATION: 1.0,
  /** Reflexões (✨ NOVO - AAA) */
  REFLECTIVITY: {
    calm: 0.95,      // Reflexões muito fortes
    moderate: 0.90,
    rough: 0.85,
    storm: 0.80,
  },
  /** Fresnel (borda brilhante - ✨ NOVO - AAA) */
  FRESNEL: {
    bias: 0.1,       // Reflexão mínima
    scale: 2.0,      // Intensidade do efeito
    power: 2.0,      // Quão rápido aumenta com ângulo
  },
  /** Subsurface Scattering (luz atravessando água - ✨ NOVO - AAA) */
  SUBSURFACE: {
    enabled: true,
    color: 0x00FFFF,  // Ciano (luz atravessando água)
    intensity: 0.3,   // Intensidade do efeito
  },
} as const;

/**
 * Calcular velocidade de fase de onda Gerstner
 * 
 * Fórmula: c = √(g/k) onde k = 2π/λ
 * 
 * @param wavelength - Comprimento da onda em metros
 * @param gravity - Gravidade (padrão: 9.8 m/s²)
 * @returns Velocidade de fase em m/s
 */
export function calculateWaveSpeed(
  wavelength: number,
  gravity: number = PHYSICAL_CONSTANTS.GRAVITY_EARTH
): number {
  const k = (2 * Math.PI) / wavelength;
  return Math.sqrt(gravity / k);
}

/**
 * Criar ondas Gerstner a partir de preset
 * 
 * @param preset - Preset de ondas
 * @param windDirection - Direção do vento (normalizada)
 * @param count - Número de ondas (padrão: 5)
 * @returns Array de ondas Gerstner
 */
export function createGerstnerWaves(
  preset: keyof typeof WAVE_PRESETS,
  windDirection: { x: number; y: number } = { x: 1, y: 0.3 },
  count: number = 5
): GerstnerWave[] {
  const config = WAVE_PRESETS[preset];
  const waves: GerstnerWave[] = [];
  
  // Normalizar direção do vento
  const length = Math.sqrt(windDirection.x ** 2 + windDirection.y ** 2);
  const normalizedWind = {
    x: windDirection.x / length,
    y: windDirection.y / length,
  };
  
  // Criar múltiplas ondas com variações
  for (let i = 0; i < count; i++) {
    const scale = 1 - (i / count) * 0.7; // Ondas menores progressivamente
    const wavelength = config.wavelength * scale;
    const amplitude = config.amplitude * scale;
    
    // Rotacionar direção ligeiramente para cada onda
    const angle = (i - count / 2) * 0.3; // -0.6 a +0.6 radianos
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const direction = {
      x: normalizedWind.x * cos - normalizedWind.y * sin,
      y: normalizedWind.x * sin + normalizedWind.y * cos,
    };
    
    waves.push({
      amplitude,
      wavelength,
      speed: calculateWaveSpeed(wavelength),
      direction,
      steepness: config.steepness * scale,
    });
  }
  
  return waves;
}

/**
 * Calcular altura das ondas usando Gerstner Waves
 * 
 * @param x - Posição X no mundo (metros)
 * @param z - Posição Z no mundo (metros)
 * @param time - Tempo em segundos
 * @param waves - Array de ondas Gerstner
 * @returns Altura da onda em metros
 */
export function calculateGerstnerWaveHeight(
  x: number,
  z: number,
  time: number,
  waves: GerstnerWave[]
): number {
  let height = 0;
  
  for (const wave of waves) {
    const k = (2 * Math.PI) / wave.wavelength;
    const d = wave.direction;
    const f = k * (d.x * x + d.y * z - wave.speed * time);
    const a = wave.steepness * wave.amplitude;
    
    height += a * Math.cos(f);
  }
  
  return height;
}

/**
 * Calcular deslocamento horizontal das ondas (para movimento realista)
 * 
 * @param x - Posição X no mundo (metros)
 * @param z - Posição Z no mundo (metros)
 * @param time - Tempo em segundos
 * @param waves - Array de ondas Gerstner
 * @returns Deslocamento { x, z } em metros
 */
export function calculateGerstnerWaveDisplacement(
  x: number,
  z: number,
  time: number,
  waves: GerstnerWave[]
): { x: number; z: number } {
  let dx = 0;
  let dz = 0;
  
  for (const wave of waves) {
    const k = (2 * Math.PI) / wave.wavelength;
    const d = wave.direction;
    const f = k * (d.x * x + d.y * z - wave.speed * time);
    const a = wave.steepness * wave.amplitude;
    
    const sinF = Math.sin(f);
    dx += d.x * a * sinF;
    dz += d.y * a * sinF;
  }
  
  return { x: dx, z: dz };
}

/**
 * Calcular normal da superfície da água (para iluminação)
 * 
 * @param x - Posição X no mundo (metros)
 * @param z - Posição Z no mundo (metros)
 * @param time - Tempo em segundos
 * @param waves - Array de ondas Gerstner
 * @returns Normal { x, y, z } (normalizada)
 */
export function calculateGerstnerWaveNormal(
  x: number,
  z: number,
  time: number,
  waves: GerstnerWave[]
): { x: number; y: number; z: number } {
  let nx = 0;
  let ny = 1;
  let nz = 0;
  
  for (const wave of waves) {
    const k = (2 * Math.PI) / wave.wavelength;
    const d = wave.direction;
    const f = k * (d.x * x + d.y * z - wave.speed * time);
    const wa = wave.wavelength * wave.amplitude;
    
    const cosF = Math.cos(f);
    nx -= d.x * wa * cosF;
    ny -= wave.steepness * wa * cosF;
    nz -= d.y * wa * cosF;
  }
  
  // Normalizar
  const length = Math.sqrt(nx ** 2 + ny ** 2 + nz ** 2);
  return {
    x: nx / length,
    y: ny / length,
    z: nz / length,
  };
}

/**
 * Validar configuração de água
 */
export function validateWaterConfig(config: WaterSystemConfig): Required<WaterSystemConfig> {
  return {
    initialLevel: config.initialLevel,
    maxLevel: config.maxLevel ?? config.initialLevel + 100,
    depth: config.depth,
    wavePreset: config.wavePreset ?? 'MODERATE',
    customWaves: config.customWaves ?? createGerstnerWaves(config.wavePreset ?? 'MODERATE'),
    windDirection: config.windDirection ?? { x: 1, y: 0.3 },
    windStrength: config.windStrength ?? 5.0,
    density: config.density ?? WATER_CONSTANTS.FRESH_WATER_DENSITY,
    viscosity: config.viscosity ?? WATER_CONSTANTS.VISCOSITY,
  };
}
