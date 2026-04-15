/**
 * Constantes de Regras de Validação Técnica (Constitutional Rules)
 * 
 * Sistema centralizado de constantes para as regras técnicas de validação
 * que atualmente estão hardcoded em `constitutional-rules.ts`.
 */

import { z } from 'zod';

// Schemas para regras técnicas
export const TechnicalRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['time', 'fsm', 'ui', 'input', 'save', 'viewport', 'loop']),
  systemNames: z.array(z.string()), // Nomes de sistemas que satisfazem esta regra
  regexPatterns: z.array(z.string()), // Padrões regex para validação imperativa
  specProperty: z.string().optional(), // Propriedade na spec para validação manual
  minStates: z.number().optional(), // Para regras FSM
  required: z.boolean().default(true),
});

export type TechnicalRule = z.infer<typeof TechnicalRuleSchema>;

// Nomes de sistemas (extraídos dos hardcodes)
export const SYSTEM_NAMES = {
  // Sistemas de tempo
  TIME_MANAGER: 'TimeManager',
  TIMER_SYSTEM: 'TimerSystem',
  PHYSICS_SYSTEM: 'PhysicsSystem',
  
  // Sistemas de estado
  GAME_STATE_SYSTEM: 'GameStateSystem',
  STATE_MANAGER: 'StateManager',
  
  // Sistemas de UI
  UI_SYSTEM: 'UISystem',
  
  // Sistemas de input
  INPUT_MANAGER: 'InputManager',
  INPUT_SYSTEM: 'InputSystem',
  
  // Sistemas de save
  SAVE_SYSTEM: 'SaveSystem',
  SAVE_MANAGER: 'SaveManager',
  SCORE_SYSTEM: 'ScoreSystem',
  
  // Sistemas de viewport
  CAMERA_SYSTEM: 'CameraSystem',
  VIEWPORT_MANAGER: 'ViewportManager',
} as const;

// Estados de jogo (extraídos dos hardcodes)
export const GAME_STATES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
} as const;

// Padrões regex (extraídos dos hardcodes)
export const REGEX_PATTERNS = {
  // Time patterns
  UPDATE_WITH_DELTA: /update\s*\(\s*deltaTime\s*:\s*number\s*\)/,
  USES_DELTA_IN_MOVEMENT: /[+\-*\/]=?\s*.*\s*\*\s*deltaTime/,
  
  // FSM patterns
  GAME_STATE_ENUM: /enum\s+GameState\s*{/,
  GAME_STATE_START: /START\s*=/,
  GAME_STATE_PLAYING: /PLAYING\s*=/,
  GAME_STATE_PAUSED: /PAUSED\s*=/,
  GAME_STATE_GAME_OVER: /GAME_OVER\s*=/,
  CURRENT_STATE: /currentState/,
  
  // UI patterns
  START_SCREEN: /StartScreen|renderStartScreen/,
  GAME_OVER_SCREEN: /GameOverScreen|renderGameOverScreen/,
  HUD: /HUD|renderHUD/,
  
  // Input patterns
  KEYS_MAP: /keys\s*[:=].*Map/,
  KEYDOWN_KEYUP: /keydown|keyup/,
  MOUSE_OR_TOUCH: /mousedown|mouseup|touchstart|touchend|click/,
  
  // Save patterns
  LOCAL_STORAGE_SET: /localStorage\.setItem/,
  LOCAL_STORAGE_GET: /localStorage\.getItem/,
  SAVE_HIGH_SCORE: /saveHighScore/,
  LOAD_HIGH_SCORE: /loadHighScore/,
  
  // Viewport patterns
  RESIZE_LISTENER: /addEventListener\s*\(\s*['"]resize['"]/,
  HANDLE_RESIZE: /handleResize/,
  
  // Loop patterns
  REQUEST_ANIMATION_FRAME: /requestAnimationFrame/,
  UPDATE_FUNCTION: /function\s+update\s*\(|update\s*\(.*\)\s*{|update\s*:\s*\(/,
  RENDER_FUNCTION: /function\s+render\s*\(|render\s*\(.*\)\s*{|render\s*:\s*\(/,
} as const;

// Propriedades da spec (extraídas dos hardcodes)
export const SPEC_PROPERTIES = {
  HAS_TIME_MANAGER: 'hasTimeManager',
  HAS_STATE_MANAGER: 'hasStateManager',
  HAS_START_SCREEN: 'hasStartScreen',
  HAS_GAME_OVER_SCREEN: 'hasGameOverScreen',
  HAS_HUD: 'hasHUD',
  HAS_INPUT_MANAGER: 'hasInputManager',
  HAS_SAVE_MANAGER: 'hasSaveManager',
  HAS_VIEWPORT_MANAGER: 'hasViewportManager',
} as const;

// Regras técnicas (mapeamento das funções atuais)
export const TECHNICAL_RULES: TechnicalRule[] = [
  {
    id: 'TIME_001',
    name: 'Uso de deltaTime',
    description: 'deltaTime deve ser usado em todas as atualizações de movimento/física',
    category: 'time',
    systemNames: [
      SYSTEM_NAMES.TIME_MANAGER,
      SYSTEM_NAMES.TIMER_SYSTEM,
      SYSTEM_NAMES.PHYSICS_SYSTEM,
    ],
    regexPatterns: [
      REGEX_PATTERNS.UPDATE_WITH_DELTA.source,
      REGEX_PATTERNS.USES_DELTA_IN_MOVEMENT.source,
    ],
    specProperty: SPEC_PROPERTIES.HAS_TIME_MANAGER,
  },
  {
    id: 'FSM_001',
    name: 'Enum GameState com estados mínimos',
    description: 'Enum GameState deve existir com pelo menos 4 estados',
    category: 'fsm',
    systemNames: [
      SYSTEM_NAMES.GAME_STATE_SYSTEM,
      SYSTEM_NAMES.STATE_MANAGER,
    ],
    regexPatterns: [
      REGEX_PATTERNS.GAME_STATE_ENUM.source,
      REGEX_PATTERNS.GAME_STATE_START.source,
      REGEX_PATTERNS.GAME_STATE_PLAYING.source,
      REGEX_PATTERNS.GAME_STATE_PAUSED.source,
      REGEX_PATTERNS.GAME_STATE_GAME_OVER.source,
    ],
    specProperty: SPEC_PROPERTIES.HAS_STATE_MANAGER,
    minStates: 4,
  },
  {
    id: 'FSM_002',
    name: 'StateManager deve existir',
    description: 'StateManager deve existir no jogo',
    category: 'fsm',
    systemNames: [
      SYSTEM_NAMES.GAME_STATE_SYSTEM,
      SYSTEM_NAMES.STATE_MANAGER,
    ],
    regexPatterns: [
      REGEX_PATTERNS.CURRENT_STATE.source,
    ],
    specProperty: SPEC_PROPERTIES.HAS_STATE_MANAGER,
  },
  {
    id: 'UI_001',
    name: 'StartScreen deve existir',
    description: 'Tela de início deve existir',
    category: 'ui',
    systemNames: [
      SYSTEM_NAMES.UI_SYSTEM,
    ],
    regexPatterns: [
      REGEX_PATTERNS.START_SCREEN.source,
    ],
    specProperty: SPEC_PROPERTIES.HAS_START_SCREEN,
  },
  {
    id: 'UI_002',
    name: 'GameOverScreen deve existir',
    description: 'Tela de game over deve existir',
    category: 'ui',
    systemNames: [
      SYSTEM_NAMES.UI_SYSTEM,
    ],
    regexPatterns: [
      REGEX_PATTERNS.GAME_OVER_SCREEN.source,
    ],
    specProperty: SPEC_PROPERTIES.HAS_GAME_OVER_SCREEN,
  },
  {
    id: 'UI_003',
    name: 'HUD deve existir',
    description: 'HUD (Heads-Up Display) deve existir',
    category: 'ui',
    systemNames: [
      SYSTEM_NAMES.UI_SYSTEM,
    ],
    regexPatterns: [
      REGEX_PATTERNS.HUD.source,
    ],
    specProperty: SPEC_PROPERTIES.HAS_HUD,
  },
  {
    id: 'INPUT_001',
    name: 'InputManager deve existir',
    description: 'Gerenciador de input deve existir',
    category: 'input',
    systemNames: [
      SYSTEM_NAMES.INPUT_MANAGER,
      SYSTEM_NAMES.INPUT_SYSTEM,
    ],
    regexPatterns: [
      REGEX_PATTERNS.KEYS_MAP.source,
    ],
    specProperty: SPEC_PROPERTIES.HAS_INPUT_MANAGER,
  },
  {
    id: 'INPUT_002',
    name: 'Suporte a teclado e mouse/touch',
    description: 'InputManager deve suportar teclado e mouse/touch',
    category: 'input',
    systemNames: [
      SYSTEM_NAMES.INPUT_MANAGER,
      SYSTEM_NAMES.INPUT_SYSTEM,
    ],
    regexPatterns: [
      REGEX_PATTERNS.KEYDOWN_KEYUP.source,
      REGEX_PATTERNS.MOUSE_OR_TOUCH.source,
    ],
    specProperty: SPEC_PROPERTIES.HAS_INPUT_MANAGER,
  },
  {
    id: 'SAVE_001',
    name: 'SaveManager deve existir',
    description: 'Gerenciador de save deve existir',
    category: 'save',
    systemNames: [
      SYSTEM_NAMES.SAVE_SYSTEM,
      SYSTEM_NAMES.SAVE_MANAGER,
    ],
    regexPatterns: [
      REGEX_PATTERNS.LOCAL_STORAGE_SET.source,
      REGEX_PATTERNS.LOCAL_STORAGE_GET.source,
    ],
    specProperty: SPEC_PROPERTIES.HAS_SAVE_MANAGER,
  },
  {
    id: 'SAVE_002',
    name: 'HighScore deve ser salvo',
    description: 'HighScore deve ser salvo no localStorage',
    category: 'save',
    systemNames: [
      SYSTEM_NAMES.SAVE_SYSTEM,
      SYSTEM_NAMES.SAVE_MANAGER,
      SYSTEM_NAMES.SCORE_SYSTEM,
    ],
    regexPatterns: [
      REGEX_PATTERNS.LOCAL_STORAGE_SET.source,
      REGEX_PATTERNS.SAVE_HIGH_SCORE.source,
      REGEX_PATTERNS.LOCAL_STORAGE_GET.source,
      REGEX_PATTERNS.LOAD_HIGH_SCORE.source,
    ],
    specProperty: SPEC_PROPERTIES.HAS_SAVE_MANAGER,
  },
  {
    id: 'VIEWPORT_001',
    name: 'Handler de resize deve existir',
    description: 'Handler para redimensionamento de viewport deve existir',
    category: 'viewport',
    systemNames: [
      SYSTEM_NAMES.CAMERA_SYSTEM,
      SYSTEM_NAMES.VIEWPORT_MANAGER,
    ],
    regexPatterns: [
      REGEX_PATTERNS.RESIZE_LISTENER.source,
      REGEX_PATTERNS.HANDLE_RESIZE.source,
    ],
    specProperty: SPEC_PROPERTIES.HAS_VIEWPORT_MANAGER,
  },
  {
    id: 'LOOP_001',
    name: 'Uso de requestAnimationFrame',
    description: 'Jogo deve usar requestAnimationFrame para o loop principal',
    category: 'loop',
    systemNames: [], // Assumido se tiver sistemas
    regexPatterns: [
      REGEX_PATTERNS.REQUEST_ANIMATION_FRAME.source,
    ],
  },
  {
    id: 'LOOP_002',
    name: 'Separação de update() e render()',
    description: 'Jogo deve separar funções update() e render()',
    category: 'loop',
    systemNames: [], // Assumido se tiver sistemas
    regexPatterns: [
      REGEX_PATTERNS.UPDATE_FUNCTION.source,
      REGEX_PATTERNS.RENDER_FUNCTION.source,
    ],
  },
];

// Configurações de validação técnica
export const TECHNICAL_VALIDATION_CONFIG = {
  ENABLE_DECLARATIVE_MODE: true,
  ENABLE_IMPERATIVE_MODE: true,
  ENABLE_MANUAL_MODE: true,
  FALLBACK_ORDER: ['declarative', 'imperative', 'manual'] as const,
  MIN_STATES_FOR_FSM: 4,
  ASSUME_RAF_IF_SYSTEMS: true,
  ASSUME_UPDATE_RENDER_SEPARATION_IF_SYSTEMS: true,
} as const;

// Funções utilitárias
export function getTechnicalRuleById(id: string): TechnicalRule | undefined {
  return TECHNICAL_RULES.find(rule => rule.id === id);
}

export function getTechnicalRulesByCategory(category: TechnicalRule['category']): TechnicalRule[] {
  return TECHNICAL_RULES.filter(rule => rule.category === category);
}

export function getAllSystemNames(): string[] {
  const allNames = new Set<string>();
  
  TECHNICAL_RULES.forEach(rule => {
    rule.systemNames.forEach(name => allNames.add(name));
  });
  
  return Array.from(allNames);
}

export function getRegexPatternsForRule(ruleId: string): RegExp[] {
  const rule = getTechnicalRuleById(ruleId);
  if (!rule) return [];
  
  return rule.regexPatterns.map(pattern => new RegExp(pattern));
}

export function validateTechnicalRule(rule: unknown): TechnicalRule {
  return TechnicalRuleSchema.parse(rule);
}

export function validateTechnicalRuleSafe(rule: unknown): TechnicalRule | null {
  try {
    return TechnicalRuleSchema.parse(rule);
  } catch {
    return null;
  }
}

// Helper para criar regex com cache (similar ao createCachedRegex original)
const regexCache = new Map<string, RegExp>();

export function createCachedRegex(pattern: string | RegExp): RegExp {
  const patternStr = typeof pattern === 'string' ? pattern : pattern.source;
  
  if (regexCache.has(patternStr)) {
    return regexCache.get(patternStr)!;
  }
  
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  regexCache.set(patternStr, regex);
  return regex;
}

// Função para validar spec contra regra técnica
export function validateSpecAgainstTechnicalRule(
  spec: unknown,
  ruleId: string,
  systems: string[] = [],
  code: string = ''
): { passed: boolean; mode: 'declarative' | 'imperative' | 'manual' | 'none'; message: string } {
  const rule = getTechnicalRuleById(ruleId);
  if (!rule) {
    return { passed: false, mode: 'none', message: `Regra ${ruleId} não encontrada` };
  }
  
  // Modo declarativo: verificar sistemas
  if (TECHNICAL_VALIDATION_CONFIG.ENABLE_DECLARATIVE_MODE && systems.length > 0) {
    const hasSystem = rule.systemNames.some(systemName => 
      systems.includes(systemName)
    );
    
    if (hasSystem) {
      return { 
        passed: true, 
        mode: 'declarative', 
        message: `Regra ${ruleId} satisfeita por sistema: ${rule.systemNames.find(s => systems.includes(s))}` 
      };
    }
    
    // Regras especiais com assumptions
    if (ruleId === 'LOOP_001' && TECHNICAL_VALIDATION_CONFIG.ASSUME_RAF_IF_SYSTEMS && systems.length > 0) {
      return { 
        passed: true, 
        mode: 'declarative', 
        message: `Regra ${ruleId} assumida como verdadeira (engine usa RAF)` 
      };
    }
    
    if (ruleId === 'LOOP_002' && TECHNICAL_VALIDATION_CONFIG.ASSUME_UPDATE_RENDER_SEPARATION_IF_SYSTEMS && systems.length > 0) {
      return { 
        passed: true, 
        mode: 'declarative', 
        message: `Regra ${ruleId} assumida como verdadeira (engine separa update/render)` 
      };
    }
  }
  
  // Modo imperativo: verificar código
  if (TECHNICAL_VALIDATION_CONFIG.ENABLE_IMPERATIVE_MODE && code) {
    try {
      const cleanCode = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      const regexes = getRegexPatternsForRule(ruleId);
      
      if (regexes.length > 0) {
        const allPatternsMatch = regexes.every(regex => regex.test(cleanCode));
        
        if (allPatternsMatch) {
          return { 
            passed: true, 
            mode: 'imperative', 
            message: `Regra ${ruleId} satisfeita por padrões no código` 
          };
        }
      }
    } catch (error) {
      // Silenciosamente falha para modo imperativo
    }
  }
  
  // Modo manual: verificar propriedade da spec
  if (TECHNICAL_VALIDATION_CONFIG.ENABLE_MANUAL_MODE && rule.specProperty) {
    const propertyValue = spec[rule.specProperty];
    if (propertyValue === true) {
      return { 
        passed: true, 
        mode: 'manual', 
        message: `Regra ${ruleId} satisfeita por flag manual: ${rule.specProperty}` 
      };
    }
  }
  
  return { 
    passed: false, 
    mode: 'none', 
    message: `Regra ${ruleId} não satisfeita por nenhum modo` 
  };
}