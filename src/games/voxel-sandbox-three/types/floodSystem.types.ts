/**
 * Tipos para o Sistema de Dilúvio
 * 
 * SSOT (Single Source of Truth) para todos os tipos relacionados ao flood system.
 */

import type * as THREE from "three";
import type { HeightfieldTerrainQuery } from "@/lib/ordax/terrain";
import type { FloodDebugData } from "../utils/floodDebugOverlay";

/**
 * Intensidade do dilúvio
 */
export type FloodIntensity = "calm" | "moderate" | "biblical";

/**
 * Fase do dilúvio
 */
export type FloodPhase = "before" | "starting" | "flooding";

/**
 * Configuração do sistema de dilúvio
 */
export interface FloodSystemConfig {
  /** Tamanho do mundo em metros */
  worldSize: number;
  /** Nível inicial da água em metros */
  initialWaterLevel: number;
  /** Nível máximo da água em metros */
  maxWaterLevel: number;
  /** Duração do dilúvio em segundos (tempo real) */
  floodDuration: number;
  /** Intensidade do dilúvio */
  intensity: FloodIntensity;
  /** Escala de tempo (ex: 60 = 1 min real = 1 hora no jogo) */
  timeScale?: number;
  /** Query de terreno compartilhada com a engine */
  terrain?: HeightfieldTerrainQuery;
}

/**
 * Controles do sistema de dilúvio
 */
export interface FloodSystemControls {
  /** Nível atual da água em metros */
  waterLevel: number;
  /** Altura das ondas em metros */
  waveHeight: number;
  /** Velocidade das ondas */
  waveSpeed: number;
  /** Intensidade da chuva (0-1) */
  rainIntensity: number;
  /** Densidade da névoa */
  fogDensity: number;
  /** Escuridão do céu (0-1) */
  skyDarkness: number;
  /** Chuva habilitada */
  rainEnabled: boolean;
}

/**
 * Limites da água (para peixes e outros sistemas)
 */
export interface WaterBounds {
  minY: number;
  maxY: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface FloodEnvironmentState {
  windSpeed: number;
  windDirection: THREE.Vector2;
  rainIntensity: number;
}

/**
 * Sistema de dilúvio completo
 */
export interface FloodSystem {
  /** Grupo Three.js contendo todos os objetos */
  group: THREE.Group;
  /** Controles do sistema */
  controls: FloodSystemControls;
  /** Animar o sistema */
  animate: (time: number, deltaTime: number, scene: THREE.Scene, camera?: THREE.Camera) => void;
  /** Iniciar o dilúvio */
  startFlood: () => void;
  /** Atualizar o dilúvio */
  updateFlood: (deltaTime: number) => void;
  /** Definir intensidade */
  setIntensity: (intensity: FloodIntensity) => void;
  /** Limpar recursos */
  dispose: () => void;
  /** Obter progresso (0-1) */
  getProgress: () => number;
  /** Obter altura das ondas em um ponto */
  getWaveHeight: (x: number, z: number, time?: number) => number;
  /** Obter profundidade da água */
  getWaterDepth: () => number;
  /** Obter limites da água */
  getWaterBounds: () => WaterBounds;
  /** Definir posição da Arca */
  setArkPosition: (position: THREE.Vector3) => void;
  /** Aplicar forcing ambiental externo (vento/chuva) */
  setEnvironment: (environment: Partial<FloodEnvironmentState>) => void;
}

/**
 * Onda Gerstner (física real)
 */
export interface GerstnerWave {
  /** Altura da onda em metros */
  amplitude: number;
  /** Comprimento da onda em metros */
  wavelength: number;
  /** Velocidade de propagação em m/s */
  speed: number;
  /** Direção (vetor normalizado) */
  direction: THREE.Vector2;
  /** Quão "pontiaguda" é a onda (0-1) */
  steepness: number;
}

/**
 * Debug de física da Arca
 */
export interface ArkPhysicsDebug {
  /** Força de empuxo em Newtons */
  buoyancy: number;
  /** Peso da Arca em Newtons */
  weight: number;
  /** Força líquida (empuxo - peso) em Newtons */
  netForce: number;
  /** Volume submerso em m³ */
  submergedVolume: number;
  /** Porcentagem submersa (0-100) */
  submergedPercent: number;
}

/**
 * HUD do dilúvio
 */
export interface FloodHud {
  /** Progresso do dilúvio (0-1) */
  progress: number;
  /** Nível da água em metros */
  waterLevel: number;
  /** Fase atual */
  phase: FloodPhase;
  /** Tempo no jogo em horas */
  gameTime: number;
  /** Hora do dia (ex: "14:30") */
  timeOfDay?: string;
  /** Período do dia (ex: "🌄 Manhã") */
  dayPeriod?: string;
  /** Debug de física da Arca (opcional) */
  arkPhysics?: ArkPhysicsDebug;
  /** Debug completo do overlay 3D (opcional) */
  floodDebug?: FloodDebugData;
}
