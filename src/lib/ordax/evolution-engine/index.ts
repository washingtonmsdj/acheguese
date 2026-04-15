/**
 * FASE 11: Game Evolution Engine
 * 
 * Motor de evolução automática de jogos através de mutações genômicas.
 * 
 * Funcionalidades:
 * - Mutação determinística de genomes
 * - Evolução com múltiplas gerações
 * - Scoring heurístico (fun, difficulty, chaos, readability)
 * - Estratégias de seleção (top-k, roulette, pareto)
 * - Validação + Autofill automático
 * 
 * Garante:
 * - Nenhum contrato muda
 * - Nenhum system muda
 * - validate + autofill sempre rodam
 * - extract(apply(G)) ≈ G
 */

export * from './types';
export * from './mutate-genome';
export * from './score-genome';
export * from './evolve-genome';
export * from './select-genomes';

// Re-exports convenientes
export { mutateGenome, generateMutations, applyMutations } from './mutate-genome';
export { scoreGenome, compareGenomeScores } from './score-genome';
export { evolveGenome, evolveGenomeSync } from './evolve-genome';
export { selectGenomes, sortByScore, filterByMinScore } from './select-genomes';
