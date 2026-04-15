// Type guards and validation utilities for genreContracts.ts

import type { GamePlan, GenreContractResult, GenreContractViolation } from "./constants/genre-contracts-constants.ts";

// Type guards
export function isGamePlan(value: unknown): value is GamePlan {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  if (obj.kind !== "GAME_PLAN") return false;
  if (typeof obj.gameType !== "string") return false;
  if (typeof obj.title !== "string") return false;
  if (!Array.isArray(obj.requiredSystems)) return false;
  if (!Array.isArray(obj.requiredEntities)) return false;
  return true;
}

export function isGenreContractResult(value: unknown): value is GenreContractResult {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.valid === "boolean";
}

export function isGenreContractViolation(value: unknown): value is GenreContractViolation {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.type === "string" && typeof obj.message === "string";
}

// Validation
export function validateGamePlan(value: unknown): GamePlan {
  if (isGamePlan(value)) return value;
  throw new Error("Invalid GamePlan");
}

export function validateStringParam(param: unknown, paramName: string): string {
  if (typeof param === "string" && param.trim().length > 0) return param.trim();
  throw new Error(`Invalid ${paramName}: ${param}`);
}

// Set utilities
export function createLookupSet<T extends string>(items: readonly T[]): Set<T> {
  return new Set(items);
}

export function hasAllItems<T>(set: Set<T>, items: T[]): boolean {
  return items.every(item => set.has(item));
}

export function getMissingItems<T>(set: Set<T>, required: readonly T[]): T[] {
  return required.filter(item => !set.has(item));
}

// Error utilities
export function createContractViolation(
  type: string,
  message: string,
  severity: 'error' | 'warning' = 'error',
  suggestion?: string
): GenreContractViolation {
  return { type, message, severity, suggestion };
}

export function createValidationError(message: string, details?: Record<string, unknown>): Error {
  const error = new Error(message);
  (error as Record<string, unknown>).validationDetails = details;
  return error;
}

// Cached validators
const systemCache = new Map<string, boolean>();
const entityCache = new Map<string, boolean>();

const VALID_SYSTEMS = new Set([
  "PhysicsSystem", "CollisionSystem", "ParticleSystem", "AnimationSystem", "AudioSystem", "CameraSystem",
  "AISystem", "SpawnerSystem", "ScoreSystem", "UISystem", "TimerSystem", "DialogueSystem",
  "InventorySystem", "SaveSystem", "GameStateSystem", "InputSystem", "TimeSystem", "FSMSystem",
  "VehicleSystem", "ViewportSystem"
]);

const VALID_ENTITIES = new Set([
  "player", "enemy", "goal", "obstacle", "powerup", "platform", "bullet",
  "vehicle", "track", "ball", "net", "paddle", "block", "coin", "key",
  "door", "checkpoint", "spawn_point", "finish_line", "start_line", "pickup", "spawner"
]);

export function isValidSystemCached(system: string): boolean {
  if (systemCache.has(system)) return systemCache.get(system)!;
  const valid = VALID_SYSTEMS.has(system);
  systemCache.set(system, valid);
  return valid;
}

export function isValidEntityCached(entity: string): boolean {
  if (entityCache.has(entity)) return entityCache.get(entity)!;
  const valid = VALID_ENTITIES.has(entity);
  entityCache.set(entity, valid);
  return valid;
}