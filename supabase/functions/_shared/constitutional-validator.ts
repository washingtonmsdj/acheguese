// Constitutional Validator - Edge Function version
// ✅ All types from centralized constants, no circular deps

import type {
  ViolationLevel,
  ConstitutionalViolation,
  ValidationResult,
  RuntimeSpec
} from "./constants/validator-constants.ts";

import {
  validateRuntimeSpec,
  safeRemoveComments,
  validateSpecHasContent,
  getSpecSystems,
  getSpecCode
} from "./constitutional-validator-utils.ts";

import {
  VIOLATION_LEVELS,
  VALIDATION_PILARS,
  VALIDATOR_CONFIG,
  createViolation,
  createEmptySpecViolation,
  formatViolationsForOutput,
  calculateViolationSummary,
} from "./constants/validator-constants.ts";

import { RULE_CHECKS } from "./constitutional-rules.ts";

// Rule messages
const RULE_MESSAGES: Record<string, { rule: string; message: string; fix: string; level: ViolationLevel; pilar: string }> = {
  TIME_001: { level: 'CRITICAL', pilar: 'TIME_MANAGEMENT', rule: 'deltaTime must be used', message: 'Game must use deltaTime for frame-independent movement', fix: 'Add deltaTime to update()' },
  FSM_001:  { level: 'CRITICAL', pilar: 'FSM', rule: 'GameState enum required', message: 'GameState enum must exist', fix: 'Add GameState enum' },
  FSM_002:  { level: 'CRITICAL', pilar: 'FSM', rule: 'StateManager required', message: 'StateManager is required', fix: 'Add StateManager' },
  UI_001:   { level: 'CRITICAL', pilar: 'UI_SYSTEM', rule: 'StartScreen required', message: 'StartScreen is required', fix: 'Add StartScreen' },
  UI_002:   { level: 'CRITICAL', pilar: 'UI_SYSTEM', rule: 'GameOverScreen required', message: 'GameOverScreen is required', fix: 'Add GameOverScreen' },
  UI_003:   { level: 'SEVERE',   pilar: 'UI_SYSTEM', rule: 'HUD required', message: 'HUD is required', fix: 'Add HUD component' },
  INPUT_001:{ level: 'CRITICAL', pilar: 'INPUT_SYSTEM', rule: 'InputManager required', message: 'InputManager is required', fix: 'Add InputManager' },
  INPUT_002:{ level: 'SEVERE',   pilar: 'INPUT_SYSTEM', rule: 'Multi-input support', message: 'Must support keyboard+mouse/touch', fix: 'Add event listeners' },
  SAVE_001: { level: 'CRITICAL', pilar: 'SAVE_SYSTEM', rule: 'SaveManager required', message: 'SaveManager is required', fix: 'Add SaveManager' },
  SAVE_002: { level: 'CRITICAL', pilar: 'SAVE_SYSTEM', rule: 'HighScore persistence', message: 'HighScore must use localStorage', fix: 'Add saveHighScore()' },
  VIEWPORT_001: { level: 'CRITICAL', pilar: 'VIEWPORT_MANAGEMENT', rule: 'Resize handler', message: 'Resize handler is required', fix: 'Add resize listener' },
  LOOP_001: { level: 'CRITICAL', pilar: 'GAME_LOOP', rule: 'requestAnimationFrame', message: 'Must use requestAnimationFrame', fix: 'Use rAF for game loop' },
  LOOP_002: { level: 'CRITICAL', pilar: 'GAME_LOOP', rule: 'Separate update/render', message: 'Must separate update() and render()', fix: 'Create separate functions' },
};

function createViolationFromRule(ruleId: string, error?: unknown): ConstitutionalViolation {
  const info = RULE_MESSAGES[ruleId];
  if (!info) {
    return createViolation(ruleId, 'CRITICAL', 'INPUT_VALIDATION', `Unknown rule: ${ruleId}`, 'Check rule configuration');
  }
  if (error) {
    return createViolation(ruleId, 'CRITICAL', info.pilar, `Validation error: ${error instanceof Error ? error.message : String(error)}`, info.fix);
  }
  return createViolation(ruleId, info.level, info.pilar, info.message, info.fix);
}

export function validateConstitutionalCompliance(spec: RuntimeSpec): ValidationResult {
  let validatedSpec: RuntimeSpec;
  
  try {
    validatedSpec = validateRuntimeSpec(spec);
  } catch (error) {
    return {
      isValid: false,
      violations: [createViolationFromRule('VALIDATION_001', error)],
      summary: { total: 1, critical: 1, severe: 0, minor: 0 }
    };
  }
  
  try {
    if (!validateSpecHasContent(validatedSpec)) {
      return {
        isValid: false,
        violations: [createEmptySpecViolation()],
        summary: { total: 1, critical: 1, severe: 0, minor: 0 }
      };
    }
  } catch (error) {
    return {
      isValid: false,
      violations: [createViolationFromRule('VALIDATION_002', error)],
      summary: { total: 1, critical: 1, severe: 0, minor: 0 }
    };
  }

  const violations: ConstitutionalViolation[] = [];
  const ruleIds = Object.keys(RULE_MESSAGES);

  for (const ruleId of ruleIds) {
    try {
      const checkFunction = RULE_CHECKS[ruleId as keyof typeof RULE_CHECKS];
      if (!checkFunction) continue;
      
      if (!checkFunction(validatedSpec)) {
        violations.push(createViolationFromRule(ruleId));
      }
    } catch (error) {
      console.error(`Error checking rule ${ruleId}:`, error);
      violations.push(createViolationFromRule(ruleId, error));
    }
    
    if (violations.length >= VALIDATOR_CONFIG.MAX_VIOLATIONS) break;
  }

  const summary = calculateViolationSummary(violations);
  
  return {
    isValid: summary.critical === 0,
    violations,
    summary
  };
}

export function formatViolationsForAI(result: ValidationResult): string {
  return formatViolationsForOutput(result.violations);
}

// Re-export types
export type { RuntimeSpec, ViolationLevel, ConstitutionalViolation, ValidationResult };

export {
  VIOLATION_LEVELS,
  VALIDATION_PILARS,
  VALIDATOR_CONFIG,
};