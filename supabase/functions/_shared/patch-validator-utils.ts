// Type guards and validation utilities for patch-validator.ts

import type {
  CodeSemanticPatch
} from "./patch-validator.ts";

// Type definitions
export type PatchOperation = 
  | "create_file" 
  | "update_file" 
  | "delete_file" 
  | "rename_file"
  | "move_file";

export interface PatchOp {
  op: PatchOperation;
  path?: string;
  to?: string;
  from?: string;
  content?: string;
}

// Type guards
export function isPatchOperation(value: unknown): value is PatchOperation {
  return typeof value === "string" && [
    "create_file", "update_file", "delete_file", "rename_file", "move_file"
  ].includes(value);
}

export function isPatchOp(value: unknown): value is PatchOp {
  if (!value || typeof value !== "object") {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  
  if (!isPatchOperation(obj.op)) {
    return false;
  }
  
  // Validate optional fields
  if (obj.path !== undefined && typeof obj.path !== "string") {
    return false;
  }
  
  if (obj.to !== undefined && typeof obj.to !== "string") {
    return false;
  }
  
  if (obj.from !== undefined && typeof obj.from !== "string") {
    return false;
  }
  
  if (obj.content !== undefined && typeof obj.content !== "string") {
    return false;
  }
  
  // Validate required fields based on operation type
  switch (obj.op) {
    case "create_file":
    case "update_file":
      return typeof obj.path === "string" && typeof obj.content === "string";
    
    case "delete_file":
      return typeof obj.path === "string";
    
    case "rename_file":
      return typeof obj.from === "string" && typeof obj.to === "string";
    
    case "move_file":
      return typeof obj.path === "string" && typeof obj.to === "string";
    
    default:
      return false;
  }
}

export function isCodeSemanticPatch(value: unknown): value is CodeSemanticPatch {
  if (!value || typeof value !== "object") {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  
  if (obj.kind !== "CODE_SEMANTIC_PATCH") {
    return false;
  }
  
  if (typeof obj.version !== "string") {
    return false;
  }
  
  if (typeof obj.gameId !== "string") {
    return false;
  }
  
  if (!Array.isArray(obj.ops)) {
    return false;
  }
  
  return obj.ops.every(isPatchOp);
}

// Validation functions
export function validatePatchOperation(value: unknown): PatchOperation {
  if (isPatchOperation(value)) {
    return value;
  }
  throw new Error(`Invalid patch operation: ${value}`);
}

export function validatePatchOp(value: unknown): PatchOp {
  if (isPatchOp(value)) {
    return value;
  }
  throw new Error("Invalid patch operation object");
}

export function validateCodeSemanticPatch(value: unknown): CodeSemanticPatch {
  if (isCodeSemanticPatch(value)) {
    return value;
  }
  throw new Error("Invalid CodeSemanticPatch");
}

// String utilities with safety
export function safeNormalizePath(p: unknown): string {
  if (typeof p !== "string") {
    return "/";
  }
  
  const t = p.trim();
  if (!t) {
    return "/";
  }
  
  if (!t.startsWith("/")) {
    return `/${t}`;
  }
  
  return t;
}

export function validateStringParam(param: unknown, paramName: string, defaultValue: string = ""): string {
  if (typeof param === "string" && param.trim().length > 0) {
    return param.trim();
  }
  throw new Error(`Invalid ${paramName}: ${param}`);
}

export function validateGameId(gameId: unknown): string {
  const validated = validateStringParam(gameId, "gameId");
  
  // Basic gameId validation (alphanumeric, dashes, underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(validated)) {
    throw new Error(`Invalid gameId format: ${validated}`);
  }
  
  return validated;
}

// Path validation utilities
export function isPathWithinScope(path: string, prefix: string): boolean {
  const normalized = safeNormalizePath(path);
  return normalized.startsWith(prefix);
}

export function containsPathTraversal(path: string): boolean {
  const normalized = safeNormalizePath(path);
  return normalized.includes("..");
}

export function getPathSegments(path: string, prefix: string): string[] {
  const normalized = safeNormalizePath(path);
  
  if (!normalized.startsWith(prefix)) {
    return [];
  }
  
  const relative = normalized.slice(prefix.length);
  return relative.split("/").filter(segment => segment.length > 0);
}

// Error utilities
export function createValidationError(message: string, details?: Record<string, unknown>): Error {
  const error = new Error(message);
  (error as Record<string, unknown>).validationDetails = details;
  return error;
}

export function formatValidationError(op: PatchOp, message: string): Error {
  return createValidationError(`Patch validation failed: ${message}`, { operation: op });
}