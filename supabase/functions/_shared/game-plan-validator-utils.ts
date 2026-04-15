// Type guards and validation utilities for game-plan-validator.ts

import type {
  OrdaxGameType,
  GameLoopType,
  LifecycleSignal,
  LifecycleState,
  LifecycleTransition,
  LifecycleUI,
  LifecycleControl
} from "./game-plan-validator.ts";

// Type guards
export function isOrdaxGameType(value: unknown): value is OrdaxGameType {
  return typeof value === "string" && [
    "platformer", "topdown", "shooter", "puzzle", "racing", "sports", "unknown"
  ].includes(value);
}

export function isGameLoopType(value: unknown): value is GameLoopType {
  return typeof value === "string" && [
    "winlose", "survival", "objective"
  ].includes(value);
}

export function isLifecycleSignal(value: unknown): value is LifecycleSignal {
  return typeof value === "string" && [
    "player_health", "objective_progress", "timer"
  ].includes(value);
}

export function isLifecycleState(value: unknown): value is LifecycleState {
  return typeof value === "string" && [
    "start", "playing", "gameover"
  ].includes(value);
}

export function isLifecycleTransition(value: unknown): value is LifecycleTransition {
  return typeof value === "string" && [
    "start->playing", "playing->gameover", "gameover->restart"
  ].includes(value);
}

export function isLifecycleUI(value: unknown): value is LifecycleUI {
  return typeof value === "string" && [
    "hud", "gameover_screen"
  ].includes(value);
}

export function isLifecycleControl(value: unknown): value is LifecycleControl {
  return typeof value === "string" && [
    "start_game", "restart_game"
  ].includes(value);
}

// Validation functions
export function validateOrdaxGameType(value: unknown): OrdaxGameType {
  if (isOrdaxGameType(value)) {
    return value;
  }
  console.warn(`Invalid OrdaxGameType: ${value}, defaulting to "unknown"`);
  return "unknown";
}

export function validateGameLoopType(value: unknown): GameLoopType {
  if (isGameLoopType(value)) {
    return value;
  }
  console.warn(`Invalid GameLoopType: ${value}, defaulting to "objective"`);
  return "objective";
}

export function validateLifecycleSignal(value: unknown): LifecycleSignal {
  if (isLifecycleSignal(value)) {
    return value;
  }
  console.warn(`Invalid LifecycleSignal: ${value}, defaulting to "timer"`);
  return "timer";
}

// Array validation
export function filterValidOrdaxGameTypes(values: unknown[]): OrdaxGameType[] {
  return values.filter(isOrdaxGameType);
}

export function filterValidGameLoopTypes(values: unknown[]): GameLoopType[] {
  return values.filter(isGameLoopType);
}

export function filterValidLifecycleSignals(values: unknown[]): LifecycleSignal[] {
  return values.filter(isLifecycleSignal);
}

export function filterValidLifecycleStates(values: unknown[]): LifecycleState[] {
  return values.filter(isLifecycleState);
}

export function filterValidLifecycleTransitions(values: unknown[]): LifecycleTransition[] {
  return values.filter(isLifecycleTransition);
}

export function filterValidLifecycleUIs(values: unknown[]): LifecycleUI[] {
  return values.filter(isLifecycleUI);
}

export function filterValidLifecycleControls(values: unknown[]): LifecycleControl[] {
  return values.filter(isLifecycleControl);
}

// Parameter validation
export function validateStringParam(param: unknown, paramName: string, defaultValue: string = ""): string {
  if (typeof param === "string" && param.trim().length > 0) {
    const trimmed = param.trim();
    
    // ❌ REJEITAR VALORES GENÉRICOS PARA TÍTULO
    if (paramName === "title") {
      const genericTitles = [
        "novo jogo",
        "new game",
        "untitled",
        "sem título",
        "sem titulo",
        "game",
        "jogo"
      ];
      
      const lowerTitle = trimmed.toLowerCase();
      if (genericTitles.some(g => lowerTitle === g || lowerTitle.includes(g))) {
        console.warn(`[game-plan-validator] ⚠️ Título genérico detectado: "${trimmed}", usando fallback: "${defaultValue}"`);
        return defaultValue;
      }
    }
    
    // ❌ REJEITAR VALORES GENÉRICOS PARA DESCRIÇÃO
    if (paramName === "description") {
      const genericDescriptions = [
        "um jogo criado com ordax",
        "a game created with ordax",
        "jogo criado com",
        "game created with",
        "criado com ordax",
        "created with ordax"
      ];
      
      const lowerDesc = trimmed.toLowerCase();
      if (genericDescriptions.some(g => lowerDesc.includes(g))) {
        console.warn(`[game-plan-validator] ⚠️ Descrição genérica detectada: "${trimmed}", usando fallback: "${defaultValue}"`);
        return defaultValue;
      }
    }
    
    return trimmed;
  }
  console.warn(`Invalid ${paramName}: ${param}, using default: "${defaultValue}"`);
  return defaultValue;
}

export function validateArrayParam<T>(param: unknown, paramName: string, validator: (value: unknown) => value is T): T[] {
  if (Array.isArray(param)) {
    return param.filter(validator);
  }
  console.warn(`Invalid ${paramName}: not an array, using empty array`);
  return [];
}

export function validateBooleanParam(param: unknown, paramName: string, defaultValue: boolean = false): boolean {
  if (typeof param === "boolean") {
    return param;
  }
  console.warn(`Invalid ${paramName}: ${param}, using default: ${defaultValue}`);
  return defaultValue;
}

// Helper for common validation patterns
export function safeToLowerCase(str: unknown): string {
  if (typeof str === "string") {
    return str.toLowerCase();
  }
  return "";
}

export function safeTrim(str: unknown): string {
  if (typeof str === "string") {
    return str.trim();
  }
  return "";
}

export function isNonEmptyString(str: unknown): str is string {
  return typeof str === "string" && str.trim().length > 0;
}