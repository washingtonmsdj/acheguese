/**
 * FASE 11: Game Evolution Engine - Genome Mutation
 * 
 * Gera mutações válidas e determinísticas em genomes.
 */

import type { GameGenome } from '../game-genome';
import type { GenomeMutation, MutationContext } from './types';

/**
 * Gerador de números pseudo-aleatórios determinístico (LCG)
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

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

/**
 * Campos mutáveis do genome (safe list)
 */
const MUTABLE_FIELDS = [
  // Player
  'player.speed',
  'player.health',
  'player.damage',
  'player.fireRate',
  
  // Enemies
  'enemies.spawnRate',
  'enemies.maxActive',
  'enemies.baseHealth',
  'enemies.baseSpeed',
  'enemies.baseDamage',
  
  // Projectiles
  'projectiles.speed',
  'projectiles.damage',
  'projectiles.lifetime',
  
  // World
  'world.gravity',
  'world.friction',
  'world.bounds.width',
  'world.bounds.height',
  
  // Game rules
  'rules.winCondition.score',
  'rules.loseCondition.lives',
  'rules.difficulty',
  
  // Visual
  'visual.particleIntensity',
  'visual.screenShake',
  'visual.cameraZoom',
];

/**
 * Obtém valor de campo usando dot notation
 */
function getFieldValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => (current as Record<string, unknown>)?.[key], obj);
}

/**
 * Define valor de campo usando dot notation
 */
function setFieldValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {} as unknown;
    return current[key] as Record<string, unknown>;
  }, obj);
  target[lastKey] = value;
}

/**
 * Gera uma mutação válida para um campo
 */
function generateMutation(
  field: string,
  genome: GameGenome,
  rng: SeededRandom,
  aggressiveness: number
): GenomeMutation | null {
  const currentValue = getFieldValue(genome, field);
  
  if (currentValue === undefined) {
    return null;
  }

  const valueType = typeof currentValue;
  
  // Mutações para números
  if (valueType === 'number') {
    const operation = rng.choice(['increase', 'decrease']);
    const magnitude = rng.next() * aggressiveness;
    
    return {
      field,
      operation: operation as 'increase' | 'decrease',
      magnitude,
    };
  }
  
  // Mutações para booleanos
  if (valueType === 'boolean') {
    return {
      field,
      operation: 'toggle',
      magnitude: 1,
    };
  }
  
  // Mutações para arrays
  if (Array.isArray(currentValue)) {
    const operation = currentValue.length > 0 && rng.next() > 0.5 
      ? 'remove' 
      : 'add';
    
    return {
      field,
      operation: operation as 'add' | 'remove',
      magnitude: rng.next() * aggressiveness,
    };
  }
  
  return null;
}

/**
 * Aplica uma mutação a um genome
 */
function applyMutation(
  genome: GameGenome,
  mutation: GenomeMutation
): GameGenome {
  const mutated = JSON.parse(JSON.stringify(genome)) as GameGenome;
  const currentValue = getFieldValue(mutated, mutation.field);
  
  switch (mutation.operation) {
    case 'increase': {
      if (typeof currentValue === 'number') {
        const delta = currentValue * mutation.magnitude * 0.5; // Max 50% increase
        setFieldValue(mutated, mutation.field, currentValue + delta);
      }
      break;
    }
    
    case 'decrease': {
      if (typeof currentValue === 'number') {
        const delta = currentValue * mutation.magnitude * 0.5; // Max 50% decrease
        const newValue = Math.max(0, currentValue - delta); // Never negative
        setFieldValue(mutated, mutation.field, newValue);
      }
      break;
    }
    
    case 'toggle': {
      if (typeof currentValue === 'boolean') {
        setFieldValue(mutated, mutation.field, !currentValue);
      }
      break;
    }
    
    case 'add': {
      if (Array.isArray(currentValue) && mutation.value) {
        setFieldValue(mutated, mutation.field, [...currentValue, mutation.value]);
      }
      break;
    }
    
    case 'remove': {
      if (Array.isArray(currentValue) && currentValue.length > 0) {
        const filtered = currentValue.slice(0, -1); // Remove last
        setFieldValue(mutated, mutation.field, filtered);
      }
      break;
    }
  }
  
  return mutated;
}

/**
 * Gera mutações válidas para um genome
 * 
 * @param genome - Genome a ser mutado
 * @param seed - Seed para reprodutibilidade
 * @param aggressiveness - Agressividade das mutações (0-1)
 * @param mutationCount - Número de mutações a gerar
 * @returns Array de mutações válidas
 */
export function generateMutations(
  genome: GameGenome,
  seed: number = Date.now(),
  aggressiveness: number = 0.5,
  mutationCount: number = 3
): GenomeMutation[] {
  const rng = new SeededRandom(seed);
  const mutations: GenomeMutation[] = [];
  
  // Filtra campos que existem no genome
  const availableFields = MUTABLE_FIELDS.filter(
    field => getFieldValue(genome, field) !== undefined
  );
  
  if (availableFields.length === 0) {
    return [];
  }
  
  // Gera mutações
  for (let i = 0; i < mutationCount; i++) {
    const field = rng.choice(availableFields);
    const mutation = generateMutation(field, genome, rng, aggressiveness);
    
    if (mutation) {
      mutations.push(mutation);
    }
  }
  
  return mutations;
}

/**
 * Aplica múltiplas mutações a um genome
 * 
 * @param genome - Genome original
 * @param mutations - Mutações a aplicar
 * @returns Genome mutado
 */
export function applyMutations(
  genome: GameGenome,
  mutations: GenomeMutation[]
): GameGenome {
  let mutated = genome;
  
  for (const mutation of mutations) {
    mutated = applyMutation(mutated, mutation);
  }
  
  return mutated;
}

/**
 * Gera e aplica mutações em um único passo
 * 
 * Garante:
 * - Mutações válidas
 * - Determinismo com seed
 * - Nunca quebra contratos (campos safe)
 * 
 * @param genome - Genome a ser mutado
 * @param seed - Seed para reprodutibilidade (opcional)
 * @param aggressiveness - Agressividade (0-1, padrão 0.5)
 * @returns Genome mutado e mutações aplicadas
 */
export function mutateGenome(
  genome: GameGenome,
  seed?: number,
  aggressiveness: number = 0.5
): { genome: GameGenome; mutations: GenomeMutation[] } {
  const actualSeed = seed ?? Date.now();
  const rng = new SeededRandom(actualSeed);
  
  // Número de mutações baseado na agressividade
  const mutationCount = Math.max(1, Math.floor(aggressiveness * 5) + 1);
  
  const mutations = generateMutations(
    genome,
    actualSeed,
    aggressiveness,
    mutationCount
  );
  
  const mutated = applyMutations(genome, mutations);
  
  return {
    genome: mutated,
    mutations,
  };
}
