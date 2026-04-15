/**
 * Utilitários de Validação para Regras Constitucionais
 * 
 * Funções helper para substituir o padrão repetido de validação
 * que atualmente está duplicado em `constitutional-rules.ts`.
 */

// RuntimeSpec type used locally
type RuntimeSpec = Record<string, unknown>;
import { 
  SYSTEM_NAMES,
  SPEC_PROPERTIES,
  TECHNICAL_RULES,
  TECHNICAL_VALIDATION_CONFIG,
  validateSpecAgainstTechnicalRule,
  createCachedRegex
} from "./validation-rules";

// Tipos para resultados de validação
export interface ValidationCheckResult {
  passed: boolean;
  mode: 'declarative' | 'imperative' | 'manual' | 'none';
  message: string;
  error?: string;
}

export interface ValidationRuleCheck {
  ruleId: string;
  result: ValidationCheckResult;
  timestamp: number;
}

// Cache para regex compilados (performance)
const regexCache = new Map<string, RegExp>();

// Funções utilitárias originais (mantidas para backward compatibility)
export function safeRemoveComments(code: string): string {
  if (!code) return '';
  
  // Remove comentários de linha única
  let cleanCode = code.replace(/\/\/.*$/gm, '');
  
  // Remove comentários multi-linha
  cleanCode = cleanCode.replace(/\/\*[\s\S]*?\*\//g, '');
  
  return cleanCode;
}

export function checkArrayIncludes(arr: string[], item: string): boolean {
  if (!Array.isArray(arr)) return false;
  return arr.includes(item);
}

export function getSpecSystems(spec: RuntimeSpec): string[] {
  if (!spec || typeof spec !== 'object') return [];
  const s = spec as Record<string, unknown>;
  
  if (Array.isArray(s.systems)) {
    return s.systems;
  }
  
  if (s.technical && Array.isArray(s.technical.systems)) {
    return s.technical.systems;
  }
  
  return [];
}

export function getSpecCode(spec: RuntimeSpec): string {
  if (!spec || typeof spec !== 'object') return '';
  const s = spec as Record<string, unknown>;
  
  if (typeof s.code === 'string') {
    return s.code;
  }
  
  if (s.technical && typeof s.technical.code === 'string') {
    return s.technical.code;
  }
  
  return '';
}

// Nova função helper para criar checks de regra
export function createRuleCheck(
  ruleId: string,
  options: {
    customSystemCheck?: (systems: string[]) => boolean;
    customCodeCheck?: (cleanCode: string) => boolean;
    customSpecCheck?: (spec: RuntimeSpec) => boolean;
    fallbackOrder?: Array<'declarative' | 'imperative' | 'manual'>;
  } = {}
): (spec: RuntimeSpec) => ValidationCheckResult {
  return (spec: RuntimeSpec): ValidationCheckResult => {
    const systems = getSpecSystems(spec);
    const code = getSpecCode(spec);
    const fallbackOrder = options.fallbackOrder || TECHNICAL_VALIDATION_CONFIG.FALLBACK_ORDER;
    
    // Validação usando o novo sistema de constantes
    const ruleResult = validateSpecAgainstTechnicalRule(spec, ruleId, systems, code);
    
    if (ruleResult.passed) {
      return {
        passed: true,
        mode: ruleResult.mode,
        message: ruleResult.message,
      };
    }
    
    // Se o novo sistema não passou, tenta checks customizados
    for (const mode of fallbackOrder) {
      try {
        let passed = false;
        let message = '';
        
        switch (mode) {
          case 'declarative':
            if (systems.length > 0 && options.customSystemCheck) {
              passed = options.customSystemCheck(systems);
              message = passed 
                ? `Regra ${ruleId} satisfeita por check customizado de sistemas`
                : `Regra ${ruleId} não satisfeita por check customizado de sistemas`;
            }
            break;
            
          case 'imperative':
            if (code && options.customCodeCheck) {
              const cleanCode = safeRemoveComments(code);
              passed = options.customCodeCheck(cleanCode);
              message = passed 
                ? `Regra ${ruleId} satisfeita por check customizado de código`
                : `Regra ${ruleId} não satisfeita por check customizado de código`;
            }
            break;
            
          case 'manual':
            if (options.customSpecCheck) {
              passed = options.customSpecCheck(spec);
              message = passed 
                ? `Regra ${ruleId} satisfeita por check customizado de spec`
                : `Regra ${ruleId} não satisfeita por check customizado de spec`;
            }
            break;
        }
        
        if (passed) {
          return { passed: true, mode, message };
        }
      } catch (error) {
        // Silenciosamente continua para o próximo modo
      }
    }
    
    return {
      passed: false,
      mode: 'none',
      message: `Regra ${ruleId} não satisfeita por nenhum modo de validação`,
    };
  };
}

// Funções de validação específicas usando o novo helper
export const checkTime001 = createRuleCheck('TIME_001', {
  customSystemCheck: (systems) => 
    checkArrayIncludes(systems, SYSTEM_NAMES.TIME_MANAGER) || 
    checkArrayIncludes(systems, SYSTEM_NAMES.TIMER_SYSTEM) ||
    checkArrayIncludes(systems, SYSTEM_NAMES.PHYSICS_SYSTEM),
  customCodeCheck: (cleanCode) => {
    const updateWithDelta = createCachedRegex(/update\s*\(\s*deltaTime\s*:\s*number\s*\)/);
    const usesDeltaInMovement = createCachedRegex(/[+\-*\/]=?\s*.*\s*\*\s*deltaTime/);
    return updateWithDelta.test(cleanCode) && usesDeltaInMovement.test(cleanCode);
  },
  customSpecCheck: (spec) => spec[SPEC_PROPERTIES.HAS_TIME_MANAGER] === true,
});

export const checkFsm001 = createRuleCheck('FSM_001', {
  customSystemCheck: (systems) => 
    checkArrayIncludes(systems, SYSTEM_NAMES.GAME_STATE_SYSTEM) || 
    checkArrayIncludes(systems, SYSTEM_NAMES.STATE_MANAGER),
  customCodeCheck: (cleanCode) => {
    const gameStateEnum = createCachedRegex(/enum\s+GameState\s*{/);
    const gameStateStart = createCachedRegex(/START\s*=/);
    const gameStatePlaying = createCachedRegex(/PLAYING\s*=/);
    const gameStatePaused = createCachedRegex(/PAUSED\s*=/);
    const gameStateGameOver = createCachedRegex(/GAME_OVER\s*=/);
    
    return gameStateEnum.test(cleanCode) && 
           gameStateStart.test(cleanCode) && 
           gameStatePlaying.test(cleanCode) && 
           gameStatePaused.test(cleanCode) && 
           gameStateGameOver.test(cleanCode);
  },
  customSpecCheck: (spec) => spec[SPEC_PROPERTIES.HAS_STATE_MANAGER] === true,
});

export const checkFsm002 = createRuleCheck('FSM_002', {
  customSystemCheck: (systems) => 
    checkArrayIncludes(systems, SYSTEM_NAMES.GAME_STATE_SYSTEM) || 
    checkArrayIncludes(systems, SYSTEM_NAMES.STATE_MANAGER),
  customCodeCheck: (cleanCode) => {
    const currentState = createCachedRegex(/currentState/);
    return currentState.test(cleanCode);
  },
  customSpecCheck: (spec) => spec[SPEC_PROPERTIES.HAS_STATE_MANAGER] === true,
});

// Função para validar múltiplas regras
export function validateMultipleRules(
  spec: RuntimeSpec,
  ruleIds: string[]
): ValidationRuleCheck[] {
  const results: ValidationRuleCheck[] = [];
  const timestamp = Date.now();
  
  for (const ruleId of ruleIds) {
    try {
      const rule = TECHNICAL_RULES.find(r => r.id === ruleId);
      if (!rule) continue;
      
      const checkFunction = createRuleCheck(ruleId);
      const result = checkFunction(spec);
      
      results.push({
        ruleId,
        result,
        timestamp,
      });
    } catch (error) {
      results.push({
        ruleId,
        result: {
          passed: false,
          mode: 'none',
          message: `Erro ao validar regra ${ruleId}`,
          error: error instanceof Error ? error.message : String(error),
        },
        timestamp,
      });
    }
  }
  
  return results;
}

// Função para obter resumo de validação
export function getValidationSummary(results: ValidationRuleCheck[]): {
  total: number;
  passed: number;
  failed: number;
  byMode: Record<string, number>;
} {
  const summary = {
    total: results.length,
    passed: 0,
    failed: 0,
    byMode: {} as Record<string, number>,
  };
  
  for (const result of results) {
    if (result.result.passed) {
      summary.passed++;
      summary.byMode[result.result.mode] = (summary.byMode[result.result.mode] || 0) + 1;
    } else {
      summary.failed++;
    }
  }
  
  return summary;
}

// Função para validar todas as regras técnicas
export function validateAllTechnicalRules(spec: RuntimeSpec): ValidationRuleCheck[] {
  const ruleIds = TECHNICAL_RULES.map(rule => rule.id);
  return validateMultipleRules(spec, ruleIds);
}

// Exportar todas as funções de check (para backward compatibility)
export const RULE_CHECKS = {
  TIME_001: checkTime001,
  FSM_001: checkFsm001,
  FSM_002: checkFsm002,
  // Nota: As outras regras seriam adicionadas aqui seguindo o mesmo padrão
} as const;