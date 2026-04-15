// Type guards and validation utilities for constitutional-validator.ts

import type {
  ViolationLevel,
  ConstitutionalViolation,
  ValidationResult,
  RuntimeSpec
} from "./constants/validator-constants.ts";

// Re-export RuntimeSpec for other modules
export type { RuntimeSpec };

// Type guards
export function isViolationLevel(value: unknown): value is ViolationLevel {
  return typeof value === "string" && [
    "CRITICAL", "SEVERE", "MINOR"
  ].includes(value);
}

export function isRuntimeSpec(value: unknown): value is RuntimeSpec {
  if (!value || typeof value !== "object") {
    return false;
  }
  
  const spec = value as Record<string, unknown>;
  
  if (spec.code !== undefined && typeof spec.code !== "string") {
    return false;
  }
  
  if (spec.systems !== undefined && !Array.isArray(spec.systems)) {
    return false;
  }
  
  const booleanFields = [
    "hasTimeManager", "hasStateManager", "hasInputManager",
    "hasSaveManager", "hasViewportManager", "hasStartScreen",
    "hasHUD", "hasGameOverScreen"
  ];
  
  for (const field of booleanFields) {
    if (spec[field] !== undefined && typeof spec[field] !== "boolean") {
      return false;
    }
  }
  
  const hasCode = spec.code !== undefined && typeof spec.code === "string" && spec.code.trim().length > 0;
  const hasSystems = spec.systems !== undefined && Array.isArray(spec.systems) && spec.systems.length > 0;
  const hasFlags = booleanFields.some(field => spec[field] === true);
  
  return hasCode || hasSystems || hasFlags;
}

// Validation functions
export function validateViolationLevel(value: unknown): ViolationLevel {
  if (isViolationLevel(value)) {
    return value;
  }
  console.warn(`Invalid ViolationLevel: ${value}, defaulting to "MINOR"`);
  return "MINOR";
}

export function validateRuntimeSpec(value: unknown): RuntimeSpec {
  if (isRuntimeSpec(value)) {
    return value as RuntimeSpec;
  }
  
  console.warn("Invalid RuntimeSpec, returning empty spec");
  return {
    code: "",
    systems: [],
    hasTimeManager: false,
    hasStateManager: false,
    hasInputManager: false,
    hasSaveManager: false,
    hasViewportManager: false,
    hasStartScreen: false,
    hasHUD: false,
    hasGameOverScreen: false
  };
}

// String utilities with safety
export function safeRemoveComments(code: string, _timeoutMs: number = 100): string {
  if (!code || typeof code !== "string") {
    return "";
  }
  
  if (code.length > 100000) {
    console.warn(`Code too large for comment removal: ${code.length} chars, truncating`);
    code = code.substring(0, 100000);
  }
  
  try {
    let cleaned = code.replace(/\/\/.*$/gm, "");
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
    return cleaned;
  } catch (error) {
    console.error("Error removing comments:", error);
    return code;
  }
}

export function escapeForTemplateLiteral(str: string): string {
  if (typeof str !== "string") {
    return "";
  }
  
  return str
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

export function formatViolationForOutput(violation: ConstitutionalViolation): string {
  const escapedId = escapeForTemplateLiteral(violation.id);
  const escapedLevel = escapeForTemplateLiteral(violation.level);
  const escapedPilar = escapeForTemplateLiteral(violation.pilar);
  const escapedMessage = escapeForTemplateLiteral(violation.message);
  const escapedFix = escapeForTemplateLiteral(violation.fix || '');
  
  return `  { id: '${escapedId}', level: '${escapedLevel}', pilar: '${escapedPilar}', message: '${escapedMessage}', fix: '${escapedFix}' }`;
}

// Performance utilities
export function createCachedRegex(pattern: string, flags: string = ""): RegExp {
  return new RegExp(pattern, flags);
}

export function checkArrayIncludes<T>(array: T[] | undefined, value: T): boolean {
  if (!array || !Array.isArray(array)) {
    return false;
  }
  return array.includes(value);
}

// Mode detection
export type RuntimeSpecMode = "declarative" | "imperative" | "hybrid" | "invalid";

export function detectRuntimeSpecMode(spec: RuntimeSpec): RuntimeSpecMode {
  const hasSystems = spec.systems && Array.isArray(spec.systems) && spec.systems.length > 0;
  const hasCode = spec.code && typeof spec.code === "string" && spec.code.trim().length > 0;
  
  if (hasSystems && hasCode) {
    return "hybrid";
  } else if (hasSystems) {
    return "declarative";
  } else if (hasCode) {
    return "imperative";
  } else {
    const hasFlags = [
      spec.hasTimeManager, spec.hasStateManager, spec.hasInputManager,
      spec.hasSaveManager, spec.hasViewportManager, spec.hasStartScreen,
      spec.hasHUD, spec.hasGameOverScreen
    ].some(flag => flag === true);
    
    return hasFlags ? "declarative" : "invalid";
  }
}

// Validation helpers
export function validateSpecHasContent(spec: RuntimeSpec): boolean {
  const mode = detectRuntimeSpecMode(spec);
  return mode !== "invalid";
}

export function getSpecSystems(spec: RuntimeSpec): string[] {
  if (!spec.systems || !Array.isArray(spec.systems)) {
    return [];
  }
  return spec.systems.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
}

export function getSpecCode(spec: RuntimeSpec): string {
  if (!spec.code || typeof spec.code !== "string") {
    return "";
  }
  return spec.code;
}