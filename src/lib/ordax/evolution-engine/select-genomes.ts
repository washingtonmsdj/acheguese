/**
 * FASE 11: Game Evolution Engine - Genome Selection
 * 
 * Estratégias de seleção de genomes para evolução.
 */

import type { GameGenome } from '../game-genome';
import type { GenomeScore, SelectionOptions } from './types';

/**
 * Resultado de seleção
 */
export interface SelectedGenome {
  genome: GameGenome;
  score: GenomeScore;
  index: number;
}

/**
 * Gerador de números pseudo-aleatórios (mesmo do mutate-genome)
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
}

/**
 * Seleção Top-K: Seleciona os K melhores genomes
 */
function selectTopK(
  genomes: Array<{ genome: GameGenome; score: GenomeScore }>,
  count: number
): SelectedGenome[] {
  return genomes
    .map((item, index) => ({ ...item, index }))
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, count);
}

/**
 * Seleção por Roleta: Seleção probabilística baseada em scores
 */
function selectRoulette(
  genomes: Array<{ genome: GameGenome; score: GenomeScore }>,
  count: number,
  seed: number,
  weights?: { fun?: number; difficulty?: number; chaos?: number; readability?: number }
): SelectedGenome[] {
  const rng = new SeededRandom(seed);
  
  // Calcula fitness ponderado
  const defaultWeights = {
    fun: 0.35,
    difficulty: 0.30,
    chaos: 0.20,
    readability: 0.15,
  };
  
  const w = { ...defaultWeights, ...weights };
  
  const fitness = genomes.map(item => {
    const { breakdown } = item.score;
    return (
      breakdown.fun * w.fun +
      breakdown.difficulty * w.difficulty +
      breakdown.chaos * w.chaos +
      breakdown.readability * w.readability
    );
  });
  
  const totalFitness = fitness.reduce((a, b) => a + b, 0);
  
  if (totalFitness === 0) {
    // Fallback para top-k se todos têm fitness 0
    return selectTopK(genomes, count);
  }
  
  // Seleção por roleta
  const selected: SelectedGenome[] = [];
  const selectedIndices = new Set<number>();
  
  let attempts = 0;
  const maxAttempts = count * 10; // Evita loop infinito
  
  while (selected.length < count && selectedIndices.size < genomes.length && attempts < maxAttempts) {
    attempts++;
    const spin = rng.next() * totalFitness;
    let cumulative = 0;
    
    for (let i = 0; i < genomes.length; i++) {
      if (selectedIndices.has(i)) continue;
      
      cumulative += fitness[i];
      
      if (spin <= cumulative) {
        selected.push({
          ...genomes[i],
          index: i,
        });
        selectedIndices.add(i);
        break;
      }
    }
  }
  
  return selected;
}

/**
 * Verifica se um genome domina outro (Pareto)
 */
function dominates(a: GenomeScore, b: GenomeScore): boolean {
  const { breakdown: aBreak } = a;
  const { breakdown: bBreak } = b;
  
  const betterOrEqual = 
    aBreak.fun >= bBreak.fun &&
    aBreak.difficulty >= bBreak.difficulty &&
    aBreak.chaos >= bBreak.chaos &&
    aBreak.readability >= bBreak.readability;
  
  const strictlyBetter =
    aBreak.fun > bBreak.fun ||
    aBreak.difficulty > bBreak.difficulty ||
    aBreak.chaos > bBreak.chaos ||
    aBreak.readability > bBreak.readability;
  
  return betterOrEqual && strictlyBetter;
}

/**
 * Seleção por Pareto: Fronteira de Pareto (multi-objetivo)
 */
function selectPareto(
  genomes: Array<{ genome: GameGenome; score: GenomeScore }>,
  count: number
): SelectedGenome[] {
  const paretoFront: SelectedGenome[] = [];
  
  // Encontra fronteira de Pareto
  for (let i = 0; i < genomes.length; i++) {
    let isDominated = false;
    
    for (let j = 0; j < genomes.length; j++) {
      if (i === j) continue;
      
      if (dominates(genomes[j].score, genomes[i].score)) {
        isDominated = true;
        break;
      }
    }
    
    if (!isDominated) {
      paretoFront.push({
        ...genomes[i],
        index: i,
      });
    }
  }
  
  // Se fronteira é maior que count, pega os melhores por score total
  if (paretoFront.length > count) {
    return paretoFront
      .sort((a, b) => b.score.total - a.score.total)
      .slice(0, count);
  }
  
  // Se fronteira é menor, completa com próximos melhores
  if (paretoFront.length < count) {
    const remaining = genomes
      .map((item, index) => ({ ...item, index }))
      .filter(item => !paretoFront.some(p => p.index === item.index))
      .sort((a, b) => b.score.total - a.score.total)
      .slice(0, count - paretoFront.length);
    
    return [...paretoFront, ...remaining];
  }
  
  return paretoFront;
}

/**
 * Seleciona genomes usando estratégia especificada
 * 
 * Estratégias:
 * - top-k: Seleciona os K melhores por score total
 * - roulette: Seleção probabilística (fitness-based)
 * - pareto: Fronteira de Pareto (multi-objetivo)
 * 
 * @param genomes - Array de genomes com scores
 * @param options - Opções de seleção
 * @returns Genomes selecionados
 */
export function selectGenomes(
  genomes: Array<{ genome: GameGenome; score: GenomeScore }>,
  options: SelectionOptions
): SelectedGenome[] {
  const { strategy, count, seed = Date.now(), weights } = options;
  
  if (genomes.length === 0) {
    return [];
  }
  
  const actualCount = Math.min(count, genomes.length);
  
  switch (strategy) {
    case 'top-k':
      return selectTopK(genomes, actualCount);
    
    case 'roulette':
      return selectRoulette(genomes, actualCount, seed, weights);
    
    case 'pareto':
      return selectPareto(genomes, actualCount);
    
    default:
      return selectTopK(genomes, actualCount);
  }
}

/**
 * Utilitário: Ordena genomes por score total
 */
export function sortByScore(
  genomes: Array<{ genome: GameGenome; score: GenomeScore }>
): Array<{ genome: GameGenome; score: GenomeScore }> {
  return [...genomes].sort((a, b) => b.score.total - a.score.total);
}

/**
 * Utilitário: Filtra genomes por score mínimo
 */
export function filterByMinScore(
  genomes: Array<{ genome: GameGenome; score: GenomeScore }>,
  minScore: number
): Array<{ genome: GameGenome; score: GenomeScore }> {
  return genomes.filter(item => item.score.total >= minScore);
}
