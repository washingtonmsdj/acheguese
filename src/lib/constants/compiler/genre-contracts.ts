/**
 * Sistema de Constantes para Genre Contracts
 * 
 * Remove hardcodes de tipos, mensagens e estruturas de contratos de gênero.
 * Sistema 100% configurável e type-safe.
 */

import { z } from 'zod';

// ============================================================================
// TIPOS DE JOGO (Game Loop Types)
// ============================================================================

export const GAME_LOOP_TYPES = {
  WINLOSE: 'winlose',
  SURVIVAL: 'survival',
  OBJECTIVE: 'objective',
} as const;

export type GameLoopType = typeof GAME_LOOP_TYPES[keyof typeof GAME_LOOP_TYPES];

// Schema de validação
export const GameLoopTypeSchema = z.enum([
  GAME_LOOP_TYPES.WINLOSE,
  GAME_LOOP_TYPES.SURVIVAL,
  GAME_LOOP_TYPES.OBJECTIVE,
]);

// ============================================================================
// SINAIS DE LIFECYCLE (Lifecycle Signals)
// ============================================================================

export const LIFECYCLE_SIGNALS = {
  PLAYER_HEALTH: 'player_health',
  OBJECTIVE_PROGRESS: 'objective_progress',
  TIMER: 'timer',
} as const;

export type LifecycleSignal = typeof LIFECYCLE_SIGNALS[keyof typeof LIFECYCLE_SIGNALS];

export const LifecycleSignalSchema = z.enum([
  LIFECYCLE_SIGNALS.PLAYER_HEALTH,
  LIFECYCLE_SIGNALS.OBJECTIVE_PROGRESS,
  LIFECYCLE_SIGNALS.TIMER,
]);

// ============================================================================
// ESTADOS DE LIFECYCLE (Lifecycle States)
// ============================================================================

export const LIFECYCLE_STATES = {
  START: 'start',
  PLAYING: 'playing',
  GAMEOVER: 'gameover',
} as const;

export type LifecycleState = typeof LIFECYCLE_STATES[keyof typeof LIFECYCLE_STATES];

export const LifecycleStateSchema = z.enum([
  LIFECYCLE_STATES.START,
  LIFECYCLE_STATES.PLAYING,
  LIFECYCLE_STATES.GAMEOVER,
]);

// ============================================================================
// TRANSIÇÕES DE LIFECYCLE (Lifecycle Transitions)
// ============================================================================

export const LIFECYCLE_TRANSITIONS = {
  START_TO_PLAYING: 'start->playing',
  PLAYING_TO_GAMEOVER: 'playing->gameover',
  GAMEOVER_TO_RESTART: 'gameover->restart',
} as const;

export type LifecycleTransition = typeof LIFECYCLE_TRANSITIONS[keyof typeof LIFECYCLE_TRANSITIONS];

export const LifecycleTransitionSchema = z.enum([
  LIFECYCLE_TRANSITIONS.START_TO_PLAYING,
  LIFECYCLE_TRANSITIONS.PLAYING_TO_GAMEOVER,
  LIFECYCLE_TRANSITIONS.GAMEOVER_TO_RESTART,
]);

// ============================================================================
// UI DE LIFECYCLE (Lifecycle UI)
// ============================================================================

export const LIFECYCLE_UI = {
  HUD: 'hud',
  GAMEOVER_SCREEN: 'gameover_screen',
} as const;

export type LifecycleUI = typeof LIFECYCLE_UI[keyof typeof LIFECYCLE_UI];

export const LifecycleUISchema = z.enum([
  LIFECYCLE_UI.HUD,
  LIFECYCLE_UI.GAMEOVER_SCREEN,
]);

// ============================================================================
// CONTROLES DE LIFECYCLE (Lifecycle Controls)
// ============================================================================

export const LIFECYCLE_CONTROLS = {
  START_GAME: 'start_game',
  RESTART_GAME: 'restart_game',
} as const;

export type LifecycleControl = typeof LIFECYCLE_CONTROLS[keyof typeof LIFECYCLE_CONTROLS];

export const LifecycleControlSchema = z.enum([
  LIFECYCLE_CONTROLS.START_GAME,
  LIFECYCLE_CONTROLS.RESTART_GAME,
]);

// ============================================================================
// TIPOS DE VIOLAÇÃO (Violation Types)
// ============================================================================

export const VIOLATION_TYPES = {
  SEMANTIC_CONTRACT_VIOLATION: 'SEMANTIC_CONTRACT_VIOLATION',
} as const;

export type ViolationType = typeof VIOLATION_TYPES[keyof typeof VIOLATION_TYPES];

export const ViolationTypeSchema = z.enum([
  VIOLATION_TYPES.SEMANTIC_CONTRACT_VIOLATION,
]);

// ============================================================================
// CÓDIGOS DE ERRO (Error Codes)
// ============================================================================

export const ERROR_CODES = {
  VALIDATION_ERROR: 'validation_error',
  UNKNOWN_ERROR: 'unknown_error',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export const ErrorCodeSchema = z.enum([
  ERROR_CODES.VALIDATION_ERROR,
  ERROR_CODES.UNKNOWN_ERROR,
]);

// ============================================================================
// VALORES PADRÃO (Default Values)
// ============================================================================

export const DEFAULT_VALUES = {
  UNKNOWN_GENRE: 'unknown',
  UNDEFINED_GAME_TYPE: 'undefined',
  GAME_PLAN_KIND: 'GAME_PLAN',
} as const;

// ============================================================================
// MENSAGES DE ERRO (Error Messages)
// ============================================================================

export const ERROR_MESSAGES = {
  // Mensagens de validação
  INVALID_GAME_TYPE: (gameType: string) => `Tipo de jogo inválido: ${gameType}`,
  INVALID_SYSTEM: (system: string) => `Sistema inválido: ${system}`,
  INVALID_ENTITY: (entity: string) => `Entidade inválida: ${entity}`,
  
  // Mensagens de warning
  OPTIONAL_SYSTEMS_RECOMMENDED: (systems: string[]) => 
    `Sistemas opcionais recomendados: ${systems.join(", ")}`,
  OPTIONAL_ENTITIES_RECOMMENDED: (entities: string[]) => 
    `Entidades opcionais recomendadas: ${entities.join(", ")}`,
  RECOMMENDED_ELEMENTS_FOR_GENRE: (genre: string, elements: string[]) => 
    `Elementos recomendados para ${genre}: ${elements.join(", ")}`,
  
  // Mensagens de contrato
  CUSTOM_GENRE_NO_CONTRACT: (genre: string) => 
    `Gênero personalizado: ${genre} (sem contrato específico)`,
  
  // Mensagens de erro genéricas
  VALIDATION_ERROR: (errorMessage: string) => 
    `Erro de validação: ${errorMessage}`,
  UNKNOWN_VALIDATION_ERROR: 
    'Erro desconhecido durante validação de contrato',
} as const;

// ============================================================================
// SCHEMAS PARA GAME PLAN
// ============================================================================

// Schema para lifecycle
export const LifecycleSchema = z.object({
  requiredStates: z.array(LifecycleStateSchema),
  requiredTransitions: z.array(LifecycleTransitionSchema),
  requiredUI: z.array(LifecycleUISchema),
  requiredSignalsAnyOf: z.array(LifecycleSignalSchema),
  signal: LifecycleSignalSchema,
  requiredControls: z.array(LifecycleControlSchema),
  startCondition: z.string(),
  loseCondition: z.string(),
  winCondition: z.string().optional(),
  scoreRule: z.string(),
});

// Schema para mustHave
export const MustHaveSchema = z.object({
  hasEnemies: z.boolean(),
  hasAI: z.boolean(),
  hasScore: z.boolean(),
  hasHUD: z.boolean(),
  hasSpawner: z.boolean(),
});

// Schema principal para GamePlan
export const GamePlanSchema = z.object({
  kind: z.literal(DEFAULT_VALUES.GAME_PLAN_KIND),
  gameType: z.string().min(1), // Qualquer string é válida no sistema 100% genérico
  title: z.string(),
  description: z.string(),
  coreLoop: z.string(),
  requiredSystems: z.array(z.string()),
  requiredEntities: z.array(z.string()),
  loopType: GameLoopTypeSchema,
  lifecycle: LifecycleSchema,
  mustHave: MustHaveSchema,
});

export type GamePlan = z.infer<typeof GamePlanSchema>;

// ============================================================================
// SCHEMAS PARA RESULTADOS DE VALIDAÇ��O
// ============================================================================

// Schema para detalhes de violação
export const ViolationDetailsSchema = z.object({
  missingSystems: z.array(z.string()).optional(),
  missingEntities: z.array(z.string()).optional(),
  invalidSystems: z.array(z.string()).optional(),
  invalidEntities: z.array(z.string()).optional(),
});

// Schema para violação de contrato
export const GenreContractViolationSchema = z.object({
  kind: ViolationTypeSchema,
  genre: z.string(),
  missing: z.array(ErrorCodeSchema),
  message: z.string(),
  details: ViolationDetailsSchema.optional(),
});

export type GenreContractViolation = z.infer<typeof GenreContractViolationSchema>;

// Schema para auto-complete
export const AutoCompleteSchema = z.object({
  systems: z.array(z.string()),
  entities: z.array(z.string()),
});

// Schema para resultado de validação
export const GenreContractResultSchema = z.object({
  valid: z.boolean(),
  violation: GenreContractViolationSchema.optional(),
  warnings: z.array(z.string()).optional(),
  autoComplete: AutoCompleteSchema.optional(),
});

export type GenreContractResult = z.infer<typeof GenreContractResultSchema>;

// ============================================================================
// FUNÇÕES HELPER PARA CRIAÇÃO DE RESULTADOS
// ============================================================================

/**
 * Cria um resultado de validação válido
 */
export function createValidResult(options?: {
  warnings?: string[];
  autoComplete?: { systems: string[]; entities: string[] };
}): GenreContractResult {
  return {
    valid: true,
    warnings: options?.warnings,
    autoComplete: options?.autoComplete,
  };
}

/**
 * Cria um resultado de validação inválido
 */
export function createInvalidResult(options: {
  genre: string;
  missing: ErrorCode[];
  message: string;
  details?: {
    missingSystems?: string[];
    missingEntities?: string[];
    invalidSystems?: string[];
    invalidEntities?: string[];
  };
}): GenreContractResult {
  return {
    valid: false,
    violation: {
      kind: VIOLATION_TYPES.SEMANTIC_CONTRACT_VIOLATION,
      genre: options.genre,
      missing: options.missing,
      message: options.message,
      details: options.details,
    },
  };
}

/**
 * Cria um resultado para gênero personalizado (sem contrato)
 */
export function createCustomGenreResult(genre: string): GenreContractResult {
  return createValidResult({
    warnings: [ERROR_MESSAGES.CUSTOM_GENRE_NO_CONTRACT(genre)],
  });
}

/**
 * Cria um resultado de erro de validação
 */
export function createValidationErrorResult(
  error: Error,
  validationDetails?: Record<string, unknown>
): GenreContractResult {
  return createInvalidResult({
    genre: DEFAULT_VALUES.UNKNOWN_GENRE,
    missing: [ERROR_CODES.VALIDATION_ERROR],
    message: ERROR_MESSAGES.VALIDATION_ERROR(error.message),
    details: validationDetails as Record<string, unknown>,
  });
}

/**
 * Cria um resultado de erro desconhecido
 */
export function createUnknownErrorResult(): GenreContractResult {
  return createInvalidResult({
    genre: DEFAULT_VALUES.UNKNOWN_GENRE,
    missing: [ERROR_CODES.UNKNOWN_ERROR],
    message: ERROR_MESSAGES.UNKNOWN_VALIDATION_ERROR,
  });
}

// ============================================================================
// FUNÇÕES HELPER PARA VALIDAÇÃO
// ============================================================================

/**
 * Valida um GamePlan usando o schema
 */
export function validateGamePlanSchema(plan: unknown): GamePlan {
  return GamePlanSchema.parse(plan);
}

/**
 * Cria um conjunto de lookup para O(1) access
 */
export function createLookupSet<T extends string>(items: T[]): Set<T> {
  return new Set(items);
}

/**
 * Obtém itens faltantes comparando dois conjuntos
 */
export function getMissingItems<T extends string>(
  availableSet: Set<T>,
  requiredItems: T[]
): T[] {
  return requiredItems.filter(item => !availableSet.has(item));
}

// ============================================================================
// CACHE PARA PERFORMANCE
// ============================================================================

class ValidationCache {
  private systemCache = new Map<string, boolean>();
  private entityCache = new Map<string, boolean>();
  private gamePlanCache = new Map<string, GamePlan>();

  /**
   * Verifica se sistema é válido (com cache)
   */
  isValidSystem(system: string, validator: (s: string) => boolean): boolean {
    if (this.systemCache.has(system)) {
      return this.systemCache.get(system)!;
    }

    const isValid = validator(system);
    this.systemCache.set(system, isValid);
    return isValid;
  }

  /**
   * Verifica se entidade é válida (com cache)
   */
  isValidEntity(entity: string, validator: (e: string) => boolean): boolean {
    if (this.entityCache.has(entity)) {
      return this.entityCache.get(entity)!;
    }

    const isValid = validator(entity);
    this.entityCache.set(entity, isValid);
    return isValid;
  }

  /**
   * Obtém GamePlan validado (com cache)
   */
  getValidatedGamePlan(key: string, validator: (p: unknown) => GamePlan): GamePlan {
    if (this.gamePlanCache.has(key)) {
      return this.gamePlanCache.get(key)!;
    }

    // Nota: Para cache de GamePlan, precisamos de uma chave única
    // Por simplicidade, não implementamos cache completo aqui
    throw new Error('GamePlan cache requires unique key implementation');
  }

  /**
   * Limpa cache
   */
  clear(): void {
    this.systemCache.clear();
    this.entityCache.clear();
    this.gamePlanCache.clear();
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): {
    systemCacheSize: number;
    entityCacheSize: number;
    gamePlanCacheSize: number;
    totalCacheSize: number;
  } {
    return {
      systemCacheSize: this.systemCache.size,
      entityCacheSize: this.entityCache.size,
      gamePlanCacheSize: this.gamePlanCache.size,
      totalCacheSize: this.systemCache.size + this.entityCache.size + this.gamePlanCache.size,
    };
  }
}

// Instância global do cache
export const validationCache = new ValidationCache();

// Backward compatibility exports removed - all items are already exported above