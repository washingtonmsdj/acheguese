/**
 * Constantes do Validator Constitucional
 * 
 * Sistema centralizado de constantes para o constitutional-validator.ts
 * Remove hardcodes de strings, níveis, pilares e mensagens.
 */

import { z } from 'zod';

// Schemas para validação
export const ViolationLevelSchema = z.enum(['CRITICAL', 'SEVERE', 'MINOR']);
export type ViolationLevel = z.infer<typeof ViolationLevelSchema>;

export const ValidationPilarSchema = z.enum([
  'TIME_MANAGEMENT',
  'FSM',
  'UI_SYSTEM',
  'INPUT_SYSTEM',
  'SAVE_SYSTEM',
  'VIEWPORT_MANAGEMENT',
  'GAME_LOOP',
  'INPUT_VALIDATION',
]);
export type ValidationPilar = z.infer<typeof ValidationPilarSchema>;

export const ConstitutionalViolationSchema = z.object({
  id: z.string(),
  level: ViolationLevelSchema,
  pilar: ValidationPilarSchema,
  rule: z.string(),
  message: z.string(),
  fix: z.string(),
});

export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  violations: z.array(ConstitutionalViolationSchema),
  summary: z.object({
    critical: z.number(),
    severe: z.number(),
    minor: z.number(),
  }),
});

export type ConstitutionalViolation = z.infer<typeof ConstitutionalViolationSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// Níveis de violação (mapeamento para strings amigáveis)
export const VIOLATION_LEVELS = {
  CRITICAL: 'CRITICAL' as const,
  SEVERE: 'SEVERE' as const,
  MINOR: 'MINOR' as const,
} as const;

// Pilares de validação (mapeamento para strings amigáveis)
export const VALIDATION_PILARS = {
  TIME_MANAGEMENT: 'Time Management' as const,
  FSM: 'FSM' as const,
  UI_SYSTEM: 'UI System' as const,
  INPUT_SYSTEM: 'Input System' as const,
  SAVE_SYSTEM: 'Save System' as const,
  VIEWPORT_MANAGEMENT: 'Viewport Management' as const,
  GAME_LOOP: 'Game Loop' as const,
  INPUT_VALIDATION: 'Input Validation' as const,
} as const;

// Mensagens de validação (templates)
export const VALIDATION_MESSAGES = {
  // Mensagens gerais
  VALIDATION_PASSED: 'CONSTITUTIONAL_VALIDATION_PASSED',
  VALIDATION_FAILED: 'CONSTITUTIONAL_VALIDATION_FAILED',
  REQUIRED_ACTION: 'REQUIRED_ACTION: Fix all CRITICAL violations and regenerate code.',
  PROHIBITED_RESPONSE: 'PROHIBITED: Responding "game ready" or suggesting "add later".',
  
  // Mensagens de erro de validação
  EMPTY_SPEC: {
    id: 'VALIDATION_001',
    level: VIOLATION_LEVELS.CRITICAL,
    pilar: VALIDATION_PILARS.INPUT_VALIDATION,
    rule: 'RuntimeSpec must contain code, systems, or flags',
    message: 'Empty or invalid RuntimeSpec provided',
    fix: 'Provide valid code, systems array, or detection flags',
  },
  
  // Mensagens por regra (serão preenchidas com as regras técnicas)
} as const;

// Configurações de validação
export const VALIDATOR_CONFIG = {
  ENABLE_VALIDATION: true,
  STOP_ON_CRITICAL: true,
  MAX_VIOLATIONS: 50,
  LOG_LEVEL: 'error' as const,
  GENERATE_REPORT: true,
  SUGGEST_FIXES: true,
  FILTER_RULES_BY_RELEVANCE: true,
} as const;

// Funções utilitárias
export function getPilarDisplayName(pilar: ValidationPilar): string {
  return VALIDATION_PILARS[pilar];
}

export function getLevelDisplayName(level: ViolationLevel): string {
  return level.charAt(0) + level.slice(1).toLowerCase();
}

export function createViolation(
  id: string,
  level: ViolationLevel,
  pilar: ValidationPilar,
  rule: string,
  message: string,
  fix: string
): ConstitutionalViolation {
  return {
    id,
    level,
    pilar,
    rule,
    message,
    fix,
  };
}

export function createEmptySpecViolation(): ConstitutionalViolation {
  return createViolation(
    VALIDATION_MESSAGES.EMPTY_SPEC.id,
    VALIDATION_MESSAGES.EMPTY_SPEC.level,
    VALIDATION_PILARS.INPUT_VALIDATION as ValidationPilar,
    VALIDATION_MESSAGES.EMPTY_SPEC.rule,
    VALIDATION_MESSAGES.EMPTY_SPEC.message,
    VALIDATION_MESSAGES.EMPTY_SPEC.fix
  );
}

export function formatViolationsForOutput(violations: ConstitutionalViolation[]): string {
  if (violations.length === 0) {
    return VALIDATION_MESSAGES.VALIDATION_PASSED;
  }

  let output = `${VALIDATION_MESSAGES.VALIDATION_FAILED}\n\n`;
  output += `violations: [\n`;
  
  violations.forEach(v => {
    output += `  {\n`;
    output += `    id: "${v.id}",\n`;
    output += `    level: "${v.level}",\n`;
    output += `    pilar: "${getPilarDisplayName(v.pilar)}",\n`;
    output += `    rule: "${v.rule}",\n`;
    output += `    message: "${v.message}",\n`;
    output += `    fix: "${v.fix}"\n`;
    output += `  },\n`;
  });
  
  output += `]\n\n`;
  output += `${VALIDATION_MESSAGES.REQUIRED_ACTION}\n`;
  output += `${VALIDATION_MESSAGES.PROHIBITED_RESPONSE}\n`;

  return output;
}

export function calculateViolationSummary(violations: ConstitutionalViolation[]): {
  critical: number;
  severe: number;
  minor: number;
} {
  return {
    critical: violations.filter(v => v.level === VIOLATION_LEVELS.CRITICAL).length,
    severe: violations.filter(v => v.level === VIOLATION_LEVELS.SEVERE).length,
    minor: violations.filter(v => v.level === VIOLATION_LEVELS.MINOR).length,
  };
}

export function isValidResult(result: ValidationResult): boolean {
  return result.isValid && result.violations.length === 0;
}

export function hasCriticalViolations(result: ValidationResult): boolean {
  return result.summary.critical > 0;
}

export function filterViolationsByLevel(
  violations: ConstitutionalViolation[],
  level: ViolationLevel
): ConstitutionalViolation[] {
  return violations.filter(v => v.level === level);
}

export function groupViolationsByPilar(
  violations: ConstitutionalViolation[]
): Record<ValidationPilar, ConstitutionalViolation[]> {
  const groups = {} as Record<ValidationPilar, ConstitutionalViolation[]>;
  
  // Inicializar grupos vazios
  Object.keys(VALIDATION_PILARS).forEach(pilar => {
    groups[pilar as ValidationPilar] = [];
  });
  
  // Agrupar violações
  violations.forEach(violation => {
    if (groups[violation.pilar]) {
      groups[violation.pilar].push(violation);
    }
  });
  
  return groups;
}

// Validação
export function validateViolation(violation: unknown): ConstitutionalViolation {
  return ConstitutionalViolationSchema.parse(violation);
}

export function validateViolationSafe(violation: unknown): ConstitutionalViolation | null {
  try {
    return ConstitutionalViolationSchema.parse(violation);
  } catch {
    return null;
  }
}

export function validateValidationResult(result: unknown): ValidationResult {
  return ValidationResultSchema.parse(result);
}

export function validateValidationResultSafe(result: unknown): ValidationResult | null {
  try {
    return ValidationResultSchema.parse(result);
  } catch {
    return null;
  }
}