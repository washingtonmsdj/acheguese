/**
 * 🔍 Entity Query Utilities - SSOT
 * 
 * Funções de busca de entidades otimizadas para performance.
 * Usam for-loops em vez de array methods para evitar alocações.
 * 
 * @version 1.0.0
 */

/**
 * Busca entidade por tipo (for-loop com early exit)
 * Complexidade: O(n) - para no primeiro match
 */
export function findByType<T extends { type: string }>(
  entities: readonly T[],
  type: string
): T | undefined {
  for (let i = 0; i < entities.length; i++) {
    if (entities[i].type === type) {
      return entities[i];
    }
  }
  return undefined;
}

/**
 * Busca entidade por ID (for-loop com early exit)
 * Complexidade: O(n) - para no primeiro match
 */
export function findById<T extends { id: string }>(
  entities: readonly T[],
  id: string
): T | undefined {
  for (let i = 0; i < entities.length; i++) {
    if (entities[i].id === id) {
      return entities[i];
    }
  }
  return undefined;
}

/**
 * Busca todas as entidades de um tipo específico
 * Complexidade: O(n)
 */
export function findAllByType<T extends { type: string }>(
  entities: readonly T[],
  type: string
): T[] {
  const result: T[] = [];
  for (let i = 0; i < entities.length; i++) {
    if (entities[i].type === type) {
      result.push(entities[i]);
    }
  }
  return result;
}

/**
 * Busca entidade que satisfaz uma condição
 * Complexidade: O(n) - para no primeiro match
 */
export function findWhere<T>(
  entities: readonly T[],
  predicate: (entity: T) => boolean
): T | undefined {
  for (let i = 0; i < entities.length; i++) {
    if (predicate(entities[i])) {
      return entities[i];
    }
  }
  return undefined;
}

/**
 * Conta entidades de um tipo específico
 * Complexidade: O(n)
 */
export function countByType<T extends { type: string }>(
  entities: readonly T[],
  type: string
): number {
  let count = 0;
  for (let i = 0; i < entities.length; i++) {
    if (entities[i].type === type) {
      count++;
    }
  }
  return count;
}

/**
 * Verifica se existe pelo menos uma entidade do tipo
 * Complexidade: O(n) - para no primeiro match
 */
export function hasType<T extends { type: string }>(
  entities: readonly T[],
  type: string
): boolean {
  for (let i = 0; i < entities.length; i++) {
    if (entities[i].type === type) {
      return true;
    }
  }
  return false;
}
