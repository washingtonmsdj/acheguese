/**
 * Sistema de LOD para Água - Engine SSOT
 * 
 * Level of Detail automático para otimizar performance de água:
 * - Geometria adaptativa (mais polígonos perto, menos longe)
 * - Partículas adaptativas (mais perto, menos longe)
 * - Shaders simplificados para distância
 * 
 * Baseado em:
 * - Sea of Thieves (LOD de ondas)
 * - Unreal Engine (LOD automático)
 * - Unity HDRP (water system)
 */

import * as THREE from "three";

/**
 * Configuração de LOD
 */
export interface WaterLODConfig {
  /** Distâncias para cada nível de LOD (metros) */
  distances: number[];
  /** Segmentos de geometria por nível */
  segments: number[];
  /** Contagem de partículas por nível (fator multiplicador) */
  particleFactors: number[];
  /** Habilitar transições suaves */
  smoothTransitions?: boolean;
}

/**
 * Presets de LOD
 */
export const WATER_LOD_PRESETS = {
  /** Performance máxima (3 níveis) */
  PERFORMANCE: {
    distances: [50, 150, 500],
    segments: [256, 128, 64],
    particleFactors: [1.0, 0.5, 0.2],
    smoothTransitions: true,
  },
  /** Balanceado (4 níveis) */
  BALANCED: {
    distances: [75, 200, 400, 800],
    segments: [256, 192, 128, 64],
    particleFactors: [1.0, 0.7, 0.4, 0.1],
    smoothTransitions: true,
  },
  /** Qualidade máxima (5 níveis) */
  QUALITY: {
    distances: [100, 250, 500, 1000, 2000],
    segments: [512, 256, 192, 128, 64],
    particleFactors: [1.0, 0.8, 0.6, 0.3, 0.1],
    smoothTransitions: true,
  },
} as const;

/**
 * Nível de LOD
 */
export interface LODLevel {
  /** Distância mínima (metros) */
  minDistance: number;
  /** Distância máxima (metros) */
  maxDistance: number;
  /** Segmentos de geometria */
  segments: number;
  /** Fator de partículas (0-1) */
  particleFactor: number;
}

/**
 * Gerenciador de LOD de água
 */
export class WaterLODManager {
  private config: WaterLODConfig;
  private levels: LODLevel[];
  private currentLevel: number = 0;
  
  constructor(config: WaterLODConfig) {
    this.config = config;
    this.levels = this.createLevels();
  }
  
  /**
   * Criar níveis de LOD a partir da configuração
   */
  private createLevels(): LODLevel[] {
    const levels: LODLevel[] = [];
    
    for (let i = 0; i < this.config.distances.length; i++) {
      levels.push({
        minDistance: i === 0 ? 0 : this.config.distances[i - 1],
        maxDistance: this.config.distances[i],
        segments: this.config.segments[i],
        particleFactor: this.config.particleFactors[i],
      });
    }
    
    // Último nível (mais distante)
    levels.push({
      minDistance: this.config.distances[this.config.distances.length - 1],
      maxDistance: Infinity,
      segments: this.config.segments[this.config.segments.length - 1],
      particleFactor: this.config.particleFactors[this.config.particleFactors.length - 1],
    });
    
    return levels;
  }
  
  /**
   * Obter nível de LOD baseado na distância
   * 
   * @param distance - Distância da câmera (metros)
   * @returns Índice do nível de LOD
   */
  getLODLevel(distance: number): number {
    for (let i = 0; i < this.levels.length; i++) {
      const level = this.levels[i];
      if (distance >= level.minDistance && distance < level.maxDistance) {
        return i;
      }
    }
    return this.levels.length - 1;
  }
  
  /**
   * Obter configuração do nível de LOD
   * 
   * @param level - Índice do nível
   * @returns Configuração do nível
   */
  getLevelConfig(level: number): LODLevel {
    return this.levels[Math.min(level, this.levels.length - 1)];
  }
  
  /**
   * Atualizar LOD baseado na posição da câmera
   * 
   * @param cameraPosition - Posição da câmera
   * @param waterPosition - Posição da água
   * @returns true se o nível mudou
   */
  update(cameraPosition: THREE.Vector3, waterPosition: THREE.Vector3): boolean {
    const distance = cameraPosition.distanceTo(waterPosition);
    const newLevel = this.getLODLevel(distance);
    
    if (newLevel !== this.currentLevel) {
      this.currentLevel = newLevel;
      return true;
    }
    
    return false;
  }
  
  /**
   * Obter nível atual
   */
  getCurrentLevel(): number {
    return this.currentLevel;
  }
  
  /**
   * Obter configuração do nível atual
   */
  getCurrentConfig(): LODLevel {
    return this.getLevelConfig(this.currentLevel);
  }
  
  /**
   * Calcular contagem de partículas ajustada por LOD
   * 
   * @param baseCount - Contagem base de partículas
   * @returns Contagem ajustada
   */
  getAdjustedParticleCount(baseCount: number): number {
    const config = this.getCurrentConfig();
    return Math.floor(baseCount * config.particleFactor);
  }
  
  /**
   * Obter segmentos de geometria para o nível atual
   */
  getCurrentSegments(): number {
    return this.getCurrentConfig().segments;
  }
}

/**
 * Criar gerenciador de LOD a partir de preset
 * 
 * @param preset - Nome do preset
 * @returns Gerenciador de LOD configurado
 */
export function createWaterLODManager(
  preset: keyof typeof WATER_LOD_PRESETS = 'BALANCED'
): WaterLODManager {
  const p = WATER_LOD_PRESETS[preset];
  return new WaterLODManager({
    distances: [...p.distances],
    segments: [...p.segments],
    particleFactors: [...p.particleFactors],
    smoothTransitions: p.smoothTransitions,
  });
}

/**
 * Calcular segmentos ideais baseado na distância
 * 
 * @param distance - Distância da câmera (metros)
 * @param maxSegments - Máximo de segmentos (perto)
 * @param minSegments - Mínimo de segmentos (longe)
 * @param maxDistance - Distância máxima (metros)
 * @returns Número de segmentos
 */
export function calculateSegmentsForDistance(
  distance: number,
  maxSegments: number = 256,
  minSegments: number = 32,
  maxDistance: number = 1000
): number {
  const t = Math.min(distance / maxDistance, 1.0);
  const segments = Math.floor(THREE.MathUtils.lerp(maxSegments, minSegments, t));
  
  // Garantir que é potência de 2 (melhor para GPU)
  return Math.pow(2, Math.floor(Math.log2(segments)));
}

/**
 * Calcular fator de partículas baseado na distância
 * 
 * @param distance - Distância da câmera (metros)
 * @param maxDistance - Distância máxima (metros)
 * @returns Fator de partículas (0-1)
 */
export function calculateParticleFactorForDistance(
  distance: number,
  maxDistance: number = 1000
): number {
  const t = Math.min(distance / maxDistance, 1.0);
  return Math.max(0.1, 1.0 - t);
}

/**
 * Criar geometria de água com LOD
 * 
 * @param worldSize - Tamanho do mundo (metros)
 * @param segments - Número de segmentos
 * @returns Geometria de plano
 */
export function createWaterGeometry(
  worldSize: number,
  segments: number
): THREE.PlaneGeometry {
  return new THREE.PlaneGeometry(
    worldSize * 3,
    worldSize * 3,
    segments,
    segments
  );
}

/**
 * Transição suave entre níveis de LOD
 * 
 * @param currentValue - Valor atual
 * @param targetValue - Valor alvo
 * @param deltaTime - Tempo desde último frame (segundos)
 * @param speed - Velocidade de transição (padrão: 2.0)
 * @returns Valor interpolado
 */
export function smoothLODTransition(
  currentValue: number,
  targetValue: number,
  deltaTime: number,
  speed: number = 2.0
): number {
  const diff = targetValue - currentValue;
  const step = diff * speed * deltaTime;
  return currentValue + step;
}

/**
 * Estatísticas de LOD (para debug)
 */
export interface LODStats {
  currentLevel: number;
  totalLevels: number;
  segments: number;
  particleFactor: number;
  distance: number;
  triangles: number;
}

/**
 * Obter estatísticas de LOD
 * 
 * @param manager - Gerenciador de LOD
 * @param distance - Distância atual
 * @returns Estatísticas
 */
export function getLODStats(
  manager: WaterLODManager,
  distance: number
): LODStats {
  const config = manager.getCurrentConfig();
  const segments = config.segments;
  const triangles = segments * segments * 2; // 2 triângulos por quad
  
  return {
    currentLevel: manager.getCurrentLevel(),
    totalLevels: WATER_LOD_PRESETS.BALANCED.distances.length + 1,
    segments,
    particleFactor: config.particleFactor,
    distance,
    triangles,
  };
}
