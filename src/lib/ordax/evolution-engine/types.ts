/**
 * FASE 11: Game Evolution Engine - Types
 * 
 * Sistema de evolução automática de jogos através de mutações genômicas.
 */

import type { GameGenome } from '../game-genome';

/**
 * Operações de mutação disponíveis
 */
export type MutationOperation = 
  | 'add'       // Adiciona novo elemento
  | 'remove'    // Remove elemento existente
  | 'increase'  // Aumenta valor numérico
  | 'decrease'  // Diminui valor numérico
  | 'toggle';   // Inverte valor booleano

/**
 * Definição de uma mutação genômica
 */
export interface GenomeMutation {
  /** Campo do genome a ser mutado (dot notation) */
  field: string;
  
  /** Operação a ser aplicada */
  operation: MutationOperation;
  
  /** Magnitude da mutação (0-1) */
  magnitude: number;
  
  /** Valor específico (opcional, para 'add') */
  value?: unknown;
}

/**
 * Opções para evolução de genomes
 */
export interface EvolveOptions {
  /** Número de variações a gerar */
  generations: number;
  
  /** Agressividade das mutações (0-1) */
  aggressiveness: number;
  
  /** Seed para reprodutibilidade */
  seed?: number;
  
  /** Campos permitidos para mutação */
  allowedFields?: string[];
  
  /** Campos proibidos */
  forbiddenFields?: string[];
  
  /** Manter apenas válidos */
  onlyValid?: boolean;
}

/**
 * Score de qualidade de um genome
 */
export interface GenomeScore {
  /** Score total (0-100) */
  total: number;
  
  /** Breakdown por categoria */
  breakdown: {
    fun: number;          // Diversão estimada
    difficulty: number;   // Balanceamento de dificuldade
    chaos: number;        // Nível de caos/complexidade
    readability: number;  // Clareza do design
  };
  
  /** Penalidades aplicadas */
  penalties: string[];
  
  /** Bônus aplicados */
  bonuses: string[];
}

/**
 * Resultado de uma evolução
 */
export interface EvolutionResult {
  /** Genome original */
  original: GameGenome;
  
  /** Variações geradas */
  variants: Array<{
    genome: GameGenome;
    mutations: GenomeMutation[];
    score: GenomeScore;
    generation: number;
  }>;
  
  /** Estatísticas da evolução */
  stats: {
    totalGenerated: number;
    validGenerated: number;
    invalidGenerated: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
  };
}

/**
 * Estratégias de seleção de genomes
 */
export type SelectionStrategy = 
  | 'top-k'      // Seleciona os K melhores
  | 'roulette'   // Seleção por roleta (probabilística)
  | 'pareto';    // Fronteira de Pareto (multi-objetivo)

/**
 * Opções para seleção de genomes
 */
export interface SelectionOptions {
  /** Estratégia de seleção */
  strategy: SelectionStrategy;
  
  /** Número de genomes a selecionar */
  count: number;
  
  /** Seed para reprodutibilidade */
  seed?: number;
  
  /** Pesos para cada categoria (apenas para roulette) */
  weights?: {
    fun?: number;
    difficulty?: number;
    chaos?: number;
    readability?: number;
  };
}

/**
 * Contexto de mutação (para validação)
 */
export interface MutationContext {
  /** Genome sendo mutado */
  genome: GameGenome;
  
  /** Mutações já aplicadas */
  appliedMutations: GenomeMutation[];
  
  /** Seed atual */
  seed: number;
  
  /** Nível de agressividade */
  aggressiveness: number;
}
