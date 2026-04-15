/**
 * Constantes de Partículas do Sistema
 * 
 * Sistema centralizado de constantes para sistema de partículas com suporte a emissores, efeitos e configurações.
 */

import { z } from 'zod';

// Schemas de validação
export const ParticleTypeSchema = z.enum(['fire', 'smoke', 'spark', 'blood', 'water', 'magic', 'dust', 'debris']);
export const ParticleConfigSchema = z.object({
  type: ParticleTypeSchema,
  count: z.number().int().min(1).max(10000).default(100),
  lifetime: z.number().min(0.1).max(60).default(2.0),
  size: z.number().min(0.1).max(100).default(1.0),
  speed: z.number().min(0).max(1000).default(1.0),
  gravity: z.number().min(-100).max(100).default(0.0),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#FFFFFF'),
  opacity: z.number().min(0).max(1).default(1.0),
  blendMode: z.enum(['normal', 'additive', 'subtractive', 'multiply']).default('normal'),
});

export type ParticleType = z.infer<typeof ParticleTypeSchema>;
export type ParticleConfig = z.infer<typeof ParticleConfigSchema>;

// Tipos de partículas
export const PARTICLE_TYPES = {
  FIRE: 'fire',
  SMOKE: 'smoke',
  SPARK: 'spark',
  BLOOD: 'blood',
  WATER: 'water',
  MAGIC: 'magic',
  DUST: 'dust',
  DEBRIS: 'debris',
} as const;

// Configurações padrão por tipo de partícula
export const PARTICLE_CONFIGS: Record<ParticleType, ParticleConfig> = {
  fire: {
    type: 'fire',
    count: 200,
    lifetime: 1.5,
    size: 2.0,
    speed: 2.0,
    gravity: -0.5, // Fogo sobe
    color: '#FF5500',
    opacity: 0.8,
    blendMode: 'additive',
  },
  smoke: {
    type: 'smoke',
    count: 100,
    lifetime: 3.0,
    size: 3.0,
    speed: 0.5,
    gravity: -0.2, // Fumaça sobe lentamente
    color: '#888888',
    opacity: 0.6,
    blendMode: 'normal',
  },
  spark: {
    type: 'spark',
    count: 50,
    lifetime: 0.5,
    size: 0.5,
    speed: 5.0,
    gravity: 0.5, // Faíscas caem
    color: '#FFFF00',
    opacity: 1.0,
    blendMode: 'additive',
  },
  blood: {
    type: 'blood',
    count: 30,
    lifetime: 1.0,
    size: 1.0,
    speed: 3.0,
    gravity: 2.0, // Sangue cai rápido
    color: '#FF0000',
    opacity: 0.9,
    blendMode: 'normal',
  },
  water: {
    type: 'water',
    count: 100,
    lifetime: 1.0,
    size: 1.5,
    speed: 2.0,
    gravity: 1.0, // Água cai
    color: '#0066FF',
    opacity: 0.7,
    blendMode: 'normal',
  },
  magic: {
    type: 'magic',
    count: 150,
    lifetime: 2.0,
    size: 1.5,
    speed: 1.0,
    gravity: 0.0, // Mágica flutua
    color: '#AA00FF',
    opacity: 0.8,
    blendMode: 'additive',
  },
  dust: {
    type: 'dust',
    count: 80,
    lifetime: 2.0,
    size: 1.0,
    speed: 0.3,
    gravity: 0.1, // Poeira cai lentamente
    color: '#CCCCCC',
    opacity: 0.5,
    blendMode: 'normal',
  },
  debris: {
    type: 'debris',
    count: 20,
    lifetime: 2.0,
    size: 2.0,
    speed: 2.0,
    gravity: 1.0, // Detritos caem
    color: '#8B4513',
    opacity: 1.0,
    blendMode: 'normal',
  },
};

// Configurações de partículas por gênero de jogo
export const PARTICLE_CONFIG_BY_GENRE = {
  platformer: {
    jump: PARTICLE_CONFIGS.dust,
    land: PARTICLE_CONFIGS.dust,
    collect: PARTICLE_CONFIGS.spark,
    damage: PARTICLE_CONFIGS.spark,
  },
  racing: {
    boost: PARTICLE_CONFIGS.fire,
    skid: PARTICLE_CONFIGS.smoke,
    crash: PARTICLE_CONFIGS.debris,
    finish: PARTICLE_CONFIGS.spark,
  },
  shooter: {
    shoot: PARTICLE_CONFIGS.smoke,
    hit: PARTICLE_CONFIGS.blood,
    explosion: PARTICLE_CONFIGS.fire,
    reload: PARTICLE_CONFIGS.spark,
  },
  puzzle: {
    match: PARTICLE_CONFIGS.spark,
    clear: PARTICLE_CONFIGS.magic,
    error: PARTICLE_CONFIGS.dust,
    success: PARTICLE_CONFIGS.spark,
  },
  rpg: {
    attack: PARTICLE_CONFIGS.blood,
    magic: PARTICLE_CONFIGS.magic,
    heal: PARTICLE_CONFIGS.magic,
    levelUp: PARTICLE_CONFIGS.spark,
  },
  default: {
    generic: PARTICLE_CONFIGS.spark,
    impact: PARTICLE_CONFIGS.dust,
    collect: PARTICLE_CONFIGS.spark,
    ui: PARTICLE_CONFIGS.spark,
  },
} as const;

// Configurações de emissores
export const EMITTER_CONFIGS = {
  POINT: {
    type: 'point',
    radius: 0,
    spread: 360,
    rate: 100, // partículas por segundo
    burstCount: 0,
  },
  CIRCLE: {
    type: 'circle',
    radius: 10,
    spread: 360,
    rate: 50,
    burstCount: 0,
  },
  CONE: {
    type: 'cone',
    radius: 0,
    spread: 45,
    rate: 200,
    burstCount: 0,
  },
  BOX: {
    type: 'box',
    width: 20,
    height: 20,
    depth: 20,
    rate: 30,
    burstCount: 0,
  },
  BURST: {
    type: 'burst',
    radius: 5,
    spread: 360,
    rate: 0,
    burstCount: 100,
  },
} as const;

// Configurações de performance
export const PERFORMANCE_CONFIG = {
  MAX_PARTICLES: 10000,
  MAX_EMITTERS: 100,
  AUTO_CULL_DISTANCE: 1000,
  LOD_DISTANCES: [100, 500, 1000], // Distâncias para Level of Detail
  LOD_PARTICLE_COUNTS: [100, 50, 25], // Contagem de partículas por LOD
} as const;

// Funções utilitárias
export function getParticleConfigForGenre(genre: string, effect: string): ParticleConfig | null {
  const genreConfig = PARTICLE_CONFIG_BY_GENRE[genre as keyof typeof PARTICLE_CONFIG_BY_GENRE];
  if (!genreConfig) return null;
  
  return genreConfig[effect as keyof typeof genreConfig] || null;
}

export function getDefaultParticleConfig(type: ParticleType): ParticleConfig {
  return PARTICLE_CONFIGS[type] || PARTICLE_CONFIGS.spark;
}

export function calculateParticleCountByDistance(
  baseCount: number,
  distance: number,
  maxDistance: number = PERFORMANCE_CONFIG.AUTO_CULL_DISTANCE
): number {
  if (distance >= maxDistance) return 0;
  
  // Reduz contagem linearmente com a distância
  const factor = 1.0 - (distance / maxDistance);
  return Math.floor(baseCount * factor);
}

export function getLODLevel(distance: number): number {
  const { LOD_DISTANCES } = PERFORMANCE_CONFIG;
  
  for (let i = 0; i < LOD_DISTANCES.length; i++) {
    if (distance <= LOD_DISTANCES[i]) {
      return i;
    }
  }
  
  return LOD_DISTANCES.length - 1;
}

export function getParticleCountForLOD(baseCount: number, lodLevel: number): number {
  const { LOD_PARTICLE_COUNTS } = PERFORMANCE_CONFIG;
  
  if (lodLevel >= LOD_PARTICLE_COUNTS.length) {
    return Math.floor(baseCount * 0.1); // 10% para LOD mais baixo
  }
  
  const lodFactor = LOD_PARTICLE_COUNTS[lodLevel] / 100;
  return Math.floor(baseCount * lodFactor);
}

// Validação
export function validateParticleConfig(config: unknown): ParticleConfig {
  return ParticleConfigSchema.parse(config);
}

export function validateParticleConfigSafe(config: unknown): ParticleConfig | null {
  try {
    return ParticleConfigSchema.parse(config);
  } catch {
    return null;
  }
}