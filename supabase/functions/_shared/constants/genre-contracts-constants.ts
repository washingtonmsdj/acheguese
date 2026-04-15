// ✅ CONSTANTES DE GENRE CONTRACTS (Edge Functions)

export type GameLoopType = 'winlose' | 'survival' | 'objective';
export type LifecycleSignal = 'player_health' | 'objective_progress' | 'timer';
export type LifecycleState = 'start' | 'playing' | 'gameover';
export type LifecycleTransition = 'start->playing' | 'playing->gameover' | 'gameover->restart';
export type LifecycleUI = 'hud' | 'gameover_screen';
export type LifecycleControl = 'start_game' | 'restart_game';
export type OrdaxGameType = 'platformer' | 'topdown' | 'shooter' | 'puzzle' | 'racing' | 'sports' | 'unknown';

export interface GamePlan {
  kind: 'GAME_PLAN';
  gameType: OrdaxGameType;
  title: string;
  description: string;
  coreLoop: string;
  requiredSystems: string[];
  requiredEntities: string[];
  loopType: GameLoopType;
  lifecycle: {
    requiredStates: LifecycleState[];
    requiredTransitions: LifecycleTransition[];
    requiredUI: LifecycleUI[];
    requiredSignalsAnyOf: LifecycleSignal[];
    signal: LifecycleSignal;
    requiredControls: LifecycleControl[];
    startCondition: string;
    loseCondition: string;
    winCondition?: string;
    scoreRule: string;
  };
  mustHave: {
    hasEnemies: boolean;
    hasAI: boolean;
    hasScore: boolean;
    hasHUD: boolean;
    hasSpawner: boolean;
  };
}

export interface GenreContractViolation {
  type: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

export interface GenreContractResult {
  valid: boolean;
  violations: GenreContractViolation[];
  autoComplete?: {
    systems?: string[];
    entities?: string[];
  };
  warnings?: string[];
}

export type ValidSystem = string;
export type ValidEntity = string;

// Constants
export const GAME_LOOP_TYPES: GameLoopType[] = ['winlose', 'survival', 'objective'];
export const LIFECYCLE_SIGNALS: LifecycleSignal[] = ['player_health', 'objective_progress', 'timer'];
export const LIFECYCLE_STATES: LifecycleState[] = ['start', 'playing', 'gameover'];
export const LIFECYCLE_TRANSITIONS: LifecycleTransition[] = ['start->playing', 'playing->gameover', 'gameover->restart'];
export const LIFECYCLE_UI: LifecycleUI[] = ['hud', 'gameover_screen'];
export const LIFECYCLE_CONTROLS: LifecycleControl[] = ['start_game', 'restart_game'];

export const VIOLATION_TYPES = {
  MISSING_SYSTEM: 'MISSING_SYSTEM',
  MISSING_ENTITY: 'MISSING_ENTITY',
  INVALID_SYSTEM: 'INVALID_SYSTEM',
  INVALID_ENTITY: 'INVALID_ENTITY',
  INVALID_GAME_TYPE: 'INVALID_GAME_TYPE',
  INVALID_LOOP_TYPE: 'INVALID_LOOP_TYPE',
  INVALID_LIFECYCLE: 'INVALID_LIFECYCLE',
};

export const ERROR_CODES = {
  INVALID_PLAN: 'INVALID_PLAN',
  MISSING_FIELDS: 'MISSING_FIELDS',
  UNKNOWN_GENRE: 'UNKNOWN_GENRE',
  CONTRACT_VIOLATION: 'CONTRACT_VIOLATION',
};

export const DEFAULT_VALUES = {
  TITLE: 'Novo Jogo',
  DESCRIPTION: 'Um jogo criado com Ordax',
  CORE_LOOP: 'Jogador controla personagem e completa objetivos',
  LOOP_TYPE: 'objective' as GameLoopType,
  SIGNAL: 'player_health' as LifecycleSignal,
};

export const ERROR_MESSAGES = {
  INVALID_PLAN: 'Plano de jogo inválido',
  MISSING_FIELDS: 'Campos obrigatórios faltando',
  UNKNOWN_GENRE: 'Gênero de jogo desconhecido',
  CONTRACT_VIOLATION: 'Violação de contrato de gênero',
  MISSING_SYSTEM: (system: string) => `Sistema obrigatório faltando: ${system}`,
  MISSING_ENTITY: (entity: string) => `Entidade obrigatória faltando: ${entity}`,
  INVALID_SYSTEM: (system: string) => `Sistema inválido: ${system}`,
  INVALID_ENTITY: (entity: string) => `Entidade inválida: ${entity}`,
  INVALID_GAME_TYPE: (type: string) => `Tipo de jogo inválido: ${type}`,
  OPTIONAL_SYSTEMS_RECOMMENDED: (systems: string[]) => `Sistemas recomendados: ${systems.join(', ')}`,
  OPTIONAL_ENTITIES_RECOMMENDED: (entities: string[]) => `Entidades recomendadas: ${entities.join(', ')}`,
  RECOMMENDED_ELEMENTS_FOR_GENRE: (genre: string, elements: string[]) => `Elementos recomendados para ${genre}: ${elements.join(', ')}`,
};

// Schema validation
export function validateGamePlanSchema(plan: unknown): { valid: boolean; errors?: string[] } {
  if (!plan || typeof plan !== 'object') {
    return { valid: false, errors: ['Plano não é um objeto'] };
  }
  
  const p = plan as Record<string, unknown>;
  const errors: string[] = [];
  
  if (!p.gameType || typeof p.gameType !== 'string') errors.push('gameType é obrigatório');
  if (!p.title || typeof p.title !== 'string') errors.push('title é obrigatório');
  if (!p.description || typeof p.description !== 'string') errors.push('description é obrigatório');
  if (!p.requiredSystems || !Array.isArray(p.requiredSystems)) errors.push('requiredSystems é obrigatório');
  if (!p.requiredEntities || !Array.isArray(p.requiredEntities)) errors.push('requiredEntities é obrigatório');
  
  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

// Helper functions
export function createValidResult(extra?: { warnings?: string[]; autoComplete?: { systems?: string[]; entities?: string[] } }): GenreContractResult {
  return { valid: true, violations: [], ...extra };
}

export function createInvalidResult(violations: GenreContractViolation[]): GenreContractResult {
  return { valid: false, violations };
}

export function createCustomGenreResult(
  valid: boolean = true,
  violations: GenreContractViolation[] = [],
  autoComplete?: { systems?: string[]; entities?: string[] },
  warnings?: string[]
): GenreContractResult {
  return { valid, violations, autoComplete, warnings };
}

export function createValidationErrorResult(message: string): GenreContractResult {
  return {
    valid: false,
    violations: [{ type: 'VALIDATION_ERROR', message, severity: 'error' }],
  };
}

export function createUnknownErrorResult(): GenreContractResult {
  return {
    valid: false,
    violations: [{ type: 'UNKNOWN_ERROR', message: 'Erro desconhecido ao validar contrato', severity: 'error' }],
  };
}

export function createLookupSet<T extends string>(items: readonly T[]): Set<T> {
  return new Set(items);
}

export function getMissingItems<T extends string>(actualSet: Set<T>, required: readonly string[]): string[] {
  return required.filter(item => !actualSet.has(item as T));
}

// Simple cache
export const validationCache = new Map<string, GenreContractResult>();