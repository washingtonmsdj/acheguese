// Constitutional validation rules
// Uses centralized constants

import type { RuntimeSpec } from "./constants/validator-constants.ts";
import {
  getSpecCode
} from "./constitutional-validator-utils.ts";

import {
  TECHNICAL_RULES,
  SYSTEM_NAMES,
  SPEC_PROPERTIES,
  GAME_STATES,
  REGEX_PATTERNS,
  TECHNICAL_VALIDATION_CONFIG,
  validateSpecAgainstTechnicalRule
} from "./constants/validation-rules-constants.ts";

// Helper function
function validateRule(spec: RuntimeSpec, ruleId: string): boolean {
  const code = getSpecCode(spec);
  const rule = TECHNICAL_RULES.find(r => r.id === ruleId);
  if (!rule) return true;
  
  const result = validateSpecAgainstTechnicalRule(code, rule);
  return result.valid;
}

export function checkTime001(spec: RuntimeSpec): boolean { return validateRule(spec, 'time_management_1'); }
export function checkFsm001(spec: RuntimeSpec): boolean { return validateRule(spec, 'fsm_1'); }
export function checkFsm002(spec: RuntimeSpec): boolean { return validateRule(spec, 'fsm_2'); }
export function checkUi001(spec: RuntimeSpec): boolean { return validateRule(spec, 'ui_elements'); }
export function checkUi002(spec: RuntimeSpec): boolean { return validateRule(spec, 'ui_elements'); }
export function checkUi003(spec: RuntimeSpec): boolean { return validateRule(spec, 'ui_elements'); }
export function checkInput001(spec: RuntimeSpec): boolean { return validateRule(spec, 'input_manager'); }
export function checkInput002(spec: RuntimeSpec): boolean { return validateRule(spec, 'input_manager'); }
export function checkSave001(spec: RuntimeSpec): boolean { return validateRule(spec, 'save_manager'); }
export function checkSave002(spec: RuntimeSpec): boolean { return validateRule(spec, 'save_manager'); }
export function checkViewport001(spec: RuntimeSpec): boolean { return validateRule(spec, 'viewport_handler'); }
export function checkLoop001(spec: RuntimeSpec): boolean { return validateRule(spec, 'game_loop_1'); }
export function checkLoop002(spec: RuntimeSpec): boolean { return validateRule(spec, 'game_loop_2'); }

// Validate all rules
export function validateAllRules(spec: RuntimeSpec): Array<{ ruleId: string; passed: boolean; message: string }> {
  const results = [];
  const code = getSpecCode(spec);
  
  for (const rule of TECHNICAL_RULES) {
    const result = validateSpecAgainstTechnicalRule(code, rule);
    results.push({
      ruleId: rule.id,
      passed: result.valid,
      message: result.message || ''
    });
  }
  
  return results;
}

export const RULE_CHECKS = {
  TIME_001: checkTime001,
  FSM_001: checkFsm001,
  FSM_002: checkFsm002,
  UI_001: checkUi001,
  UI_002: checkUi002,
  UI_003: checkUi003,
  INPUT_001: checkInput001,
  INPUT_002: checkInput002,
  SAVE_001: checkSave001,
  SAVE_002: checkSave002,
  VIEWPORT_001: checkViewport001,
  LOOP_001: checkLoop001,
  LOOP_002: checkLoop002
} as const;

// Re-export constants
export {
  SYSTEM_NAMES,
  SPEC_PROPERTIES,
  GAME_STATES,
  REGEX_PATTERNS,
  TECHNICAL_RULES,
  TECHNICAL_VALIDATION_CONFIG
};