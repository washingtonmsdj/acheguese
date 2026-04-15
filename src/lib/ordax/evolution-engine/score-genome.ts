/**
 * FASE 11: Game Evolution Engine - Genome Scoring
 * 
 * Heurística para avaliar qualidade de genomes.
 */

import type { GameGenome } from '../game-genome';
import type { GenomeScore } from './types';

/**
 * Calcula score de diversão baseado em variedade e ritmo
 */
function calculateFunScore(genome: GameGenome): number {
  let score = 50; // Base
  
  // Variedade de inimigos
  if (genome.enemies) {
    const enemyTypes = genome.enemies.types?.length || 0;
    score += Math.min(20, enemyTypes * 5);
  }
  
  // Ritmo de spawn
  if (genome.enemies?.spawnRate) {
    const spawnRate = genome.enemies.spawnRate;
    if (spawnRate > 0.5 && spawnRate < 3) {
      score += 10; // Sweet spot
    }
  }
  
  // Power-ups
  if (genome.powerups && genome.powerups.length > 0) {
    score += Math.min(15, genome.powerups.length * 3);
  }
  
  // Juice/feedback
  if (genome.visual?.particleIntensity && genome.visual.particleIntensity > 0.5) {
    score += 5;
  }
  
  return Math.min(100, score);
}

/**
 * Calcula score de dificuldade (balanceamento)
 */
function calculateDifficultyScore(genome: GameGenome): number {
  let score = 50; // Base
  
  // Balanceamento player vs enemies
  if (genome.player && genome.enemies) {
    const playerPower = (genome.player.health || 100) * (genome.player.damage || 10);
    const enemyPower = (genome.enemies.baseHealth || 50) * (genome.enemies.baseDamage || 10);
    
    const ratio = playerPower / (enemyPower || 1);
    
    // Ideal: player 2-3x mais forte que um inimigo
    if (ratio >= 2 && ratio <= 3) {
      score += 30;
    } else if (ratio >= 1.5 && ratio <= 4) {
      score += 15;
    } else {
      score -= 10; // Muito desbalanceado
    }
  }
  
  // Progressão de dificuldade
  if (genome.rules?.difficulty) {
    const diff = genome.rules.difficulty;
    if (diff >= 0.3 && diff <= 0.7) {
      score += 20; // Dificuldade moderada
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calcula score de caos/complexidade
 */
function calculateChaosScore(genome: GameGenome): number {
  let score = 50; // Base
  
  // Número de sistemas ativos
  let systemCount = 0;
  if (genome.enemies) systemCount++;
  if (genome.projectiles) systemCount++;
  if (genome.powerups) systemCount++;
  if (genome.obstacles) systemCount++;
  
  // Ideal: 3-4 sistemas
  if (systemCount >= 3 && systemCount <= 4) {
    score += 20;
  } else if (systemCount > 4) {
    score -= 10; // Muito caótico
  }
  
  // Densidade de spawn
  if (genome.enemies?.maxActive) {
    const maxActive = genome.enemies.maxActive;
    if (maxActive >= 5 && maxActive <= 15) {
      score += 15;
    } else if (maxActive > 20) {
      score -= 15; // Bullet hell demais
    }
  }
  
  // Velocidade do jogo
  if (genome.player?.speed) {
    const speed = genome.player.speed;
    if (speed >= 200 && speed <= 400) {
      score += 15;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calcula score de legibilidade/clareza
 */
function calculateReadabilityScore(genome: GameGenome): number {
  let score = 50; // Base
  
  // Estrutura bem definida
  if (genome.player) score += 10;
  if (genome.enemies) score += 10;
  if (genome.world) score += 10;
  if (genome.rules) score += 10;
  
  // Valores razoáveis (não extremos)
  if (genome.player?.speed && genome.player.speed > 0 && genome.player.speed < 1000) {
    score += 5;
  }
  
  if (genome.enemies?.spawnRate && genome.enemies.spawnRate > 0 && genome.enemies.spawnRate < 10) {
    score += 5;
  }
  
  // Bounds definidos
  if (genome.world?.bounds?.width && genome.world?.bounds?.height) {
    score += 10;
  }
  
  return Math.min(100, score);
}

/**
 * Detecta penalidades
 */
function detectPenalties(genome: GameGenome): string[] {
  const penalties: string[] = [];
  
  // Player muito fraco
  if (genome.player?.health && genome.player.health < 10) {
    penalties.push('Player muito fraco');
  }
  
  // Spawn rate impossível
  if (genome.enemies?.spawnRate && genome.enemies.spawnRate > 10) {
    penalties.push('Spawn rate muito alto');
  }
  
  // Mundo muito pequeno
  if (genome.world?.bounds) {
    const { width, height } = genome.world.bounds;
    if (width < 400 || height < 300) {
      penalties.push('Mundo muito pequeno');
    }
  }
  
  // Sem inimigos
  if (!genome.enemies || !genome.enemies.types || genome.enemies.types.length === 0) {
    penalties.push('Sem inimigos definidos');
  }
  
  return penalties;
}

/**
 * Detecta bônus
 */
function detectBonuses(genome: GameGenome): string[] {
  const bonuses: string[] = [];
  
  // Variedade de inimigos
  if (genome.enemies?.types && genome.enemies.types.length >= 3) {
    bonuses.push('Boa variedade de inimigos');
  }
  
  // Power-ups presentes
  if (genome.powerups && genome.powerups.length > 0) {
    bonuses.push('Sistema de power-ups');
  }
  
  // Juice ativo
  if (genome.visual?.particleIntensity && genome.visual.particleIntensity > 0.7) {
    bonuses.push('Alto feedback visual');
  }
  
  // Balanceamento bom
  if (genome.player && genome.enemies) {
    const playerPower = (genome.player.health || 100) * (genome.player.damage || 10);
    const enemyPower = (genome.enemies.baseHealth || 50) * (genome.enemies.baseDamage || 10);
    const ratio = playerPower / (enemyPower || 1);
    
    if (ratio >= 2 && ratio <= 3) {
      bonuses.push('Balanceamento ideal');
    }
  }
  
  return bonuses;
}

/**
 * Calcula score completo de um genome
 * 
 * Heurística baseada em:
 * - Fun: Variedade, ritmo, feedback
 * - Difficulty: Balanceamento, progressão
 * - Chaos: Complexidade, densidade
 * - Readability: Clareza, estrutura
 * 
 * @param genome - Genome a ser avaliado
 * @returns Score detalhado
 */
export function scoreGenome(genome: GameGenome): GenomeScore {
  const fun = calculateFunScore(genome);
  const difficulty = calculateDifficultyScore(genome);
  const chaos = calculateChaosScore(genome);
  const readability = calculateReadabilityScore(genome);
  
  // Score total (média ponderada)
  const total = Math.round(
    fun * 0.35 +           // 35% fun
    difficulty * 0.30 +    // 30% difficulty
    chaos * 0.20 +         // 20% chaos
    readability * 0.15     // 15% readability
  );
  
  const penalties = detectPenalties(genome);
  const bonuses = detectBonuses(genome);
  
  return {
    total,
    breakdown: {
      fun,
      difficulty,
      chaos,
      readability,
    },
    penalties,
    bonuses,
  };
}

/**
 * Compara dois genomes por score
 */
export function compareGenomeScores(a: GenomeScore, b: GenomeScore): number {
  return b.total - a.total;
}
