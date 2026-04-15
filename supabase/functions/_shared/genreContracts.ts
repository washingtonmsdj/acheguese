// Genre Contracts - Validates genre contracts for game plans

import {
  type GamePlan,
  type GenreContractViolation,
  type GenreContractResult,
  type OrdaxGameType,
  GAME_LOOP_TYPES,
  LIFECYCLE_SIGNALS,
  LIFECYCLE_STATES,
  LIFECYCLE_TRANSITIONS,
  LIFECYCLE_UI,
  LIFECYCLE_CONTROLS,
  validateGamePlanSchema,
  createValidResult,
  createInvalidResult,
  createValidationErrorResult,
  createUnknownErrorResult,
  createLookupSet,
  getMissingItems,
} from "./constants/genre-contracts-constants.ts";

import {
  type GenreContractDefinition,
  GENRE_CONTRACTS,
  getGenreContract,
  getAllGenres,
} from "./genre-contracts-config.ts";

import {
  createContractViolation,
  createValidationError,
  isValidSystemCached,
  isValidEntityCached,
} from "./genre-contracts-utils.ts";

// Re-exports
export type { OrdaxGameType, GamePlan, GenreContractViolation, GenreContractResult };
export { GAME_LOOP_TYPES, LIFECYCLE_SIGNALS, LIFECYCLE_STATES, LIFECYCLE_TRANSITIONS, LIFECYCLE_UI, LIFECYCLE_CONTROLS };

// Cached validation
function validateSystemWithCache(system: string): boolean {
  return isValidSystemCached(system);
}

function validateEntityWithCache(entity: string): boolean {
  return isValidEntityCached(entity);
}

function validateSystemsWithCache(systems: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const s of systems) (validateSystemWithCache(s) ? valid : invalid).push(s);
  return { valid, invalid };
}

function validateEntitiesWithCache(entities: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const e of entities) (validateEntityWithCache(e) ? valid : invalid).push(e);
  return { valid, invalid };
}

/**
 * Main validation function
 */
export function validateGenreContract(plan: unknown): GenreContractResult {
  try {
    // Step 1: Validate plan schema
    const schemaResult = validateGamePlanSchema(plan);
    if (!schemaResult.valid) {
      return createInvalidResult([{
        type: 'VALIDATION_ERROR',
        message: `Schema inválido: ${schemaResult.errors?.join(', ') || 'erro desconhecido'}`,
        severity: 'error',
      }]);
    }

    const validatedPlan = plan as GamePlan;
    
    // Step 2: Validate systems/entities
    const { invalid: invalidSystems } = validateSystemsWithCache(validatedPlan.requiredSystems);
    if (invalidSystems.length > 0) {
      return createInvalidResult([{
        type: 'INVALID_SYSTEM',
        message: `Sistemas inválidos: ${invalidSystems.join(', ')}`,
        severity: 'error',
      }]);
    }

    const { invalid: invalidEntities } = validateEntitiesWithCache(validatedPlan.requiredEntities);
    if (invalidEntities.length > 0) {
      return createInvalidResult([{
        type: 'INVALID_ENTITY',
        message: `Entidades inválidas: ${invalidEntities.join(', ')}`,
        severity: 'error',
      }]);
    }

    // Step 3: Check genre contract
    const genre = validatedPlan.gameType;
    const contract = getGenreContract(genre);
    
    if (!contract) {
      // Custom genre - accept without contract
      return createValidResult();
    }

    // Step 4: Validate against contract
    const systemSet = createLookupSet(validatedPlan.requiredSystems);
    const entitySet = createLookupSet(validatedPlan.requiredEntities);
    
    const missingSystems = getMissingItems(systemSet, contract.requiredSystems as string[]);
    const missingEntities = getMissingItems(entitySet, contract.requiredEntities as string[]);

    if (missingSystems.length > 0 || missingEntities.length > 0) {
      const warnings = [
        ...missingSystems.map(s => `Sistema recomendado: ${s}`),
        ...missingEntities.map(e => `Entidade recomendada: ${e}`),
      ];
      
      return {
        valid: true,
        violations: [],
        autoComplete: {
          systems: missingSystems.length > 0 ? missingSystems : undefined,
          entities: missingEntities.length > 0 ? missingEntities : undefined,
        },
        warnings,
      };
    }

    return createValidResult();
  } catch (error) {
    if (error instanceof Error) {
      return createValidationErrorResult(error.message);
    }
    return createUnknownErrorResult();
  }
}

/**
 * Legacy function
 * @deprecated Use validateGenreContract instead
 */
export function validateGenreContractOrThrow(plan: unknown): void {
  const result = validateGenreContract(plan);
  if (!result.valid && result.violations.length > 0) {
    throw new Error(result.violations[0].message);
  }
}

export function getContractDetails(genre: string): GenreContractDefinition | null {
  return getGenreContract(genre);
}

export function isSystemValid(system: string): boolean {
  return validateSystemWithCache(system);
}

export function isEntityValid(entity: string): boolean {
  return validateEntityWithCache(entity);
}

export function getAllValidGenres(): string[] {
  return Object.keys(GENRE_CONTRACTS);
}

export { GENRE_CONTRACTS };