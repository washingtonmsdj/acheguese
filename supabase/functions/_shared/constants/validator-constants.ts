// ✅ CONSTANTES DO VALIDATOR (Edge Functions)
// Sistema local para evitar imports de src/

export type ViolationLevel = 'CRITICAL' | 'SEVERE' | 'MINOR';

export type ValidationPilar = 
  | 'TIME_MANAGEMENT' 
  | 'FSM' 
  | 'UI_SYSTEM' 
  | 'INPUT_SYSTEM' 
  | 'SAVE_SYSTEM' 
  | 'VIEWPORT_MANAGEMENT' 
  | 'GAME_LOOP' 
  | 'INPUT_VALIDATION';

export interface ConstitutionalViolation {
  id: string;
  level: ViolationLevel;
  pilar: string;
  message: string;
  fix?: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  violations: ConstitutionalViolation[];
  summary?: {
    total: number;
    critical: number;
    severe: number;
    minor: number;
  };
}

// RuntimeSpec for edge functions
export interface RuntimeSpec {
  code?: string;
  systems?: string[];
  hasTimeManager?: boolean;
  hasStateManager?: boolean;
  hasInputManager?: boolean;
  hasSaveManager?: boolean;
  hasViewportManager?: boolean;
  hasStartScreen?: boolean;
  hasHUD?: boolean;
  hasGameOverScreen?: boolean;
}

// Níveis de violação
export const VIOLATION_LEVELS = {
  CRITICAL: 'CRITICAL' as const,
  SEVERE: 'SEVERE' as const,
  MINOR: 'MINOR' as const,
};

// Pilares de validação
export const VALIDATION_PILARS: Record<string, ValidationPilar> = {
  TIME_MANAGEMENT: 'TIME_MANAGEMENT',
  FSM: 'FSM',
  UI_SYSTEM: 'UI_SYSTEM',
  INPUT_SYSTEM: 'INPUT_SYSTEM',
  SAVE_SYSTEM: 'SAVE_SYSTEM',
  VIEWPORT_MANAGEMENT: 'VIEWPORT_MANAGEMENT',
  GAME_LOOP: 'GAME_LOOP',
  INPUT_VALIDATION: 'INPUT_VALIDATION',
};

// Mensagens de validação
export const VALIDATION_MESSAGES = {
  MISSING_TIME_MANAGEMENT: 'Falta TimeSystem para deltaTime',
  MISSING_FSM: 'Falta GameState enum (START, PLAYING, GAME_OVER)',
  MISSING_UI_SYSTEM: 'Falta UI obrigatória: StartScreen, HUD, GameOverScreen',
  MISSING_INPUT_SYSTEM: 'Falta InputSystem para gerenciamento de entrada',
  MISSING_SAVE_SYSTEM: 'Falta SaveSystem para persistência de dados',
  MISSING_VIEWPORT_MANAGEMENT: 'Falta ViewportSystem para responsividade',
  MISSING_GAME_LOOP: 'Falta separação update()/render() no game loop',
  MISSING_INPUT_VALIDATION: 'Falta validação de input',
};

// Configuração do validador
export const VALIDATOR_CONFIG = {
  MAX_VIOLATIONS: 50,
  MIN_CODE_LENGTH: 10,
  REQUIRED_SYSTEMS: ['TimeSystem', 'FSMSystem', 'UISystem', 'InputSystem', 'SaveSystem', 'ViewportSystem'],
  REQUIRED_UI: ['StartScreen', 'HUD', 'GameOverScreen'],
  FILTER_RULES_BY_RELEVANCE: false,
  STOP_ON_CRITICAL: false,
};

// Funções helper
export function createViolation(
  id: string,
  level: ViolationLevel,
  pilar: string,
  message: string,
  fix?: string,
  suggestion?: string
): ConstitutionalViolation {
  return {
    id,
    level,
    pilar,
    message,
    fix,
    suggestion,
  };
}

export function createEmptySpecViolation(): ConstitutionalViolation {
  return createViolation(
    'EMPTY_SPEC',
    'CRITICAL',
    'GAME_LOOP',
    'Spec vazia ou inválida',
    'A spec deve conter pelo menos um sistema e uma entidade'
  );
}

export function formatViolationsForOutput(violations: ConstitutionalViolation[]): string {
  if (violations.length === 0) return '✅ Nenhuma violação encontrada';
  
  return violations
    .map(v => `[${v.level}] ${v.pilar}: ${v.message}${v.suggestion ? ` → ${v.suggestion}` : ''}`)
    .join('\n');
}

export function calculateViolationSummary(violations: ConstitutionalViolation[]): {
  total: number;
  critical: number;
  severe: number;
  minor: number;
} {
  return {
    total: violations.length,
    critical: violations.filter(v => v.level === 'CRITICAL').length,
    severe: violations.filter(v => v.level === 'SEVERE').length,
    minor: violations.filter(v => v.level === 'MINOR').length,
  };
}

export function isValidResult(result: ValidationResult): boolean {
  return result.isValid && result.violations.length === 0;
}

export function hasCriticalViolations(result: ValidationResult): boolean {
  return result.violations.some(v => v.level === 'CRITICAL');
}

export function filterViolationsByLevel(
  violations: ConstitutionalViolation[],
  level: ViolationLevel
): ConstitutionalViolation[] {
  return violations.filter(v => v.level === level);
}

export function groupViolationsByPilar(
  violations: ConstitutionalViolation[]
): Record<string, ConstitutionalViolation[]> {
  const groups: Record<string, ConstitutionalViolation[]> = {};
  
  for (const violation of violations) {
    if (!groups[violation.pilar]) {
      groups[violation.pilar] = [];
    }
    groups[violation.pilar].push(violation);
  }
  
  return groups;
}