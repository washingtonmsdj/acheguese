/**
 * FASE 10: CANONICAL GAME GENOME
 * 
 * Representação canônica e determinística da identidade de cada jogo.
 * Permite comparação estrutural e recriação de jogos.
 */

export interface GameGenome {
  // Identificação de alto nível
  genre: string;

  // Temas visuais/narrativos
  themes: string[];

  // Modificadores de gameplay
  difficulty: 'easy' | 'normal' | 'hard';
  speed: 'slower' | 'normal' | 'faster';
  boss: boolean;

  // Progressão de alto nível
  progression: {
    winCondition: 'score' | 'time' | 'survival' | 'collection';
    winTarget?: number;
    loseCondition: 'health' | 'time' | 'capture';
    loseTarget?: number;
  };

  // Tipos de inimigos (vista agregada)
  enemyTypes: Array<{
    archetype: 'basic' | 'fast' | 'tank' | 'ranged' | 'boss';
    count: number;
    behavior: 'chase' | 'patrol' | 'ranged' | 'boss';
  }>;

  // Mecânicas
  mechanics: string[];

  // UI
  ui: {
    hud: string[];
    screens: string[];
  };

  // ===== Campos opcionais usados pelo Evolution Engine legado =====

  player?: {
    speed?: number;
    health?: number;
    damage?: number;
    fireRate?: number;
  };

  enemies?: {
    spawnRate?: number;
    maxActive?: number;
    baseHealth?: number;
    baseSpeed?: number;
    baseDamage?: number;
    types?: Array<{
      id: string;
      health?: number;
      speed?: number;
      damage?: number;
    }>;
  };

  world?: {
    bounds?: { width: number; height: number };
    gravity?: number;
    friction?: number;
  };

  rules?: {
    difficulty?: number;
    winCondition?: unknown;
    loseCondition?: unknown;
  };

  powerups?: unknown[];
  projectiles?: unknown[];
  obstacles?: unknown[];
  visual?: {
    particleIntensity?: number;
    [key: string]: unknown;
  };

  // Metadata
  version: string;
  timestamp: number;
}

export { extractGenome } from './extract-genome';
export { applyGenome } from './apply-genome';
export { compareGenomes } from './compare-genomes';
export { formatGenome } from './format-genome';
