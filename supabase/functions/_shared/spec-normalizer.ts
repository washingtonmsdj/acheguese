/**
 * Spec Normalizer
 * Centralized OrdaxSpec normalization logic
 * 
 * This module normalizes OrdaxSpecs to ensure all required fields are present
 * and follow a consistent structure. It handles:
 * - Type validation and safety
 * - Default value application
 * - Entity and system normalization
 * - Error handling and logging
 * - Performance optimization
 * 
 * @version 2.0.0 (Refactored with 100% type safety)
 * @since 2026-02-16
 */

// ============================================================================
// IMPORTS
// ============================================================================

import type {
  PartialOrdaxSpec,
  OrdaxSpec,
  NormalizedSpec,
  OrdaxGameType,
  OrdaxEntity,
  NormalizeOptions,
  NormalizationResult,
  ValidationResult,
  NormalizationContext
} from "./spec-normalizer-types.ts";

import {
  DEFAULT_VALUES,
  ERROR_MESSAGES,
  VALIDATION_RULES,
  generateEntityId,
  getDefaultPositionForIndex,
  isValidSystem,
  getEntityVisualConfig,
  getDefaultVisualShapeForGameType
} from "./spec-normalizer-config.ts";

import {
  isString,
  isNonEmptyString,
  isNumber,
  isObject,
  isArray,
  isOrdaxGameType,
  validateField,
  validateEntity,
  detectEntity,
  createDefaultEntity as utilsCreateDefaultEntity,
  normalizeEntity,
  validateAndNormalizeSystems,
  createValidationError,
  logWarning,
  logChange,
  createCachedEntityDetector
} from "./spec-normalizer-utils.ts";

// ✅ NEW: Import gameplay configuration helpers
import {
  getDefaultPlayerConfig,
  getDefaultSpawnerConfig,
  getDefaultUIConfig,
  getDefaultBackgroundConfig,
  mergeWithDefaults
} from "./spec-normalizer-gameplay.ts";

// ============================================================================
// TYPE GUARDS (re-export from utils for convenience)
// ============================================================================

export {
  isOrdaxGameType,
  isString,
  isNonEmptyString,
  isNumber,
  isObject,
  isArray
} from "./spec-normalizer-utils.ts";

// ============================================================================
// MAIN NORMALIZER
// ============================================================================

/**
 * Normalize OrdaxSpec to ensure all required fields are present
 * 
 * @param spec - Partial or complete OrdaxSpec to normalize
 * @param options - Normalization options
 * @returns NormalizationResult with normalized spec and change details
 * 
 * @example
 * ```typescript
 * const result = normalizeOrdaxSpec(partialSpec, {
 *   gamePlan: validatedPlan,
 *   fillMissingEntities: true,
 *   fillMissingSystems: true,
 *   strictMode: false
 * });
 * 
 * if (result.spec) {
 *   // Use normalized spec
 *   renderGame(result.spec);
 * }
 * ```
 */
export function normalizeOrdaxSpec(
  spec: unknown,
  options: NormalizeOptions = {}
): NormalizationResult {
  const context: NormalizationContext = {
    gamePlan: options.gamePlan,
    options: {
      fillMissingEntities: options.fillMissingEntities ?? true,
      fillMissingSystems: options.fillMissingSystems ?? true,
      strictMode: options.strictMode ?? false,
      validationLevel: options.validationLevel ?? "basic"
    },
    changes: [],
    warnings: []
  };

  try {
    // Step 1: Validate input
    const validation = validateInput(spec, context);
    if (!validation.valid) {
      throw createValidationError("Input validation failed", {
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Step 2: Normalize spec
    const partialSpec = spec as PartialOrdaxSpec;
    const normalized = normalizeSpec(partialSpec, context);

    // Step 3: Validate normalized spec
    const finalValidation = validateNormalizedSpec(normalized);
    if (!finalValidation.valid && context.options.strictMode) {
      throw createValidationError("Normalized spec validation failed in strict mode", {
        errors: finalValidation.errors,
        warnings: finalValidation.warnings
      });
    }

    // Step 4: Log completion
    logWarning(
      ERROR_MESSAGES.NORMALIZATION_COMPLETE(context.changes.length, context.warnings.length),
      context
    );

    return {
      spec: normalized,
      changes: context.changes,
      warnings: context.warnings
    };

  } catch (error) {
    // Handle errors gracefully
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error && 'validationDetails' in error 
      ? (error as { validationDetails?: Record<string, unknown> }).validationDetails 
      : undefined;

    logWarning(`Normalization failed: ${errorMessage}`, context);

    // In strict mode, re-throw the error
    if (context.options.strictMode) {
      throw error;
    }

    // In non-strict mode, return a minimal valid spec
    return {
      spec: createMinimalValidSpec(context),
      changes: context.changes,
      warnings: [...context.warnings, `Normalization failed: ${errorMessage}`]
    };
  }
}

/**
 * Validate input before normalization
 */
function validateInput(
  spec: unknown,
  context: NormalizationContext
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if spec is defined
  if (spec === undefined || spec === null) {
    errors.push(ERROR_MESSAGES.INVALID_SPEC);
    return { valid: false, errors, warnings };
  }

  // Check if spec is an object
  if (!isObject(spec)) {
    errors.push(ERROR_MESSAGES.INVALID_SPEC);
    return { valid: false, errors, warnings };
  }

  // Validate gamePlan if provided
  if (context.gamePlan !== undefined) {
    if (!isObject(context.gamePlan)) {
      warnings.push("gamePlan is not an object, ignoring");
      context.gamePlan = undefined;
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Normalize spec step by step
 */
function normalizeSpec(
  spec: PartialOrdaxSpec,
  context: NormalizationContext
): NormalizedSpec {
  const normalized: Partial<NormalizedSpec> = { ...spec };

  // Step 1: Normalize game type
  normalizeGameType(normalized, context);

  // Step 2: Normalize title and description
  normalizeTitle(normalized, context);
  normalizeDescription(normalized, context);

  // Step 3: Normalize systems
  normalizeSystems(normalized, context);

  // Step 4: Normalize scene
  normalizeScene(normalized, context);

  // Step 5: Fill missing entities from game plan
  if (context.options.fillMissingEntities && context.gamePlan?.requiredEntities) {
    fillMissingEntitiesFromPlan(normalized, context);
  }

  // Step 6: Normalize visual and audio (optional)
  normalizeVisual(normalized, context);
  normalizeAudio(normalized, context);

  // ✅ NEW: Step 7: Normalize gameplay configurations
  normalizePlayerConfig(normalized, context);
  normalizeSpawnerConfig(normalized, context);
  normalizeUIConfig(normalized, context);
  normalizeBackgroundConfig(normalized, context);

  return normalized as NormalizedSpec;
}

/**
 * Normalize game type
 */
function normalizeGameType(
  spec: Partial<NormalizedSpec>,
  context: NormalizationContext
): void {
  const field = "gameType";
  const currentValue = spec.gameType;
  const defaultValue = context.gamePlan?.gameType || DEFAULT_VALUES.GAME.GAME_TYPE;

  if (!isString(currentValue) || !isOrdaxGameType(currentValue)) {
    const oldValue = currentValue;
    spec.gameType = isOrdaxGameType(defaultValue) ? defaultValue : DEFAULT_VALUES.GAME.GAME_TYPE;

    logChange({
      field,
      action: oldValue === undefined ? "added" : "modified",
      before: oldValue,
      after: spec.gameType,
      reason: ERROR_MESSAGES.MISSING_GAME_TYPE
    }, context);
  }
}

/**
 * Normalize title
 */
function normalizeTitle(
  spec: Partial<NormalizedSpec>,
  context: NormalizationContext
): void {
  const field = "title";
  const currentValue = spec.title;
  const defaultValue = context.gamePlan?.title || DEFAULT_VALUES.GAME.TITLE;

  if (!isNonEmptyString(currentValue)) {
    const oldValue = currentValue;
    spec.title = isString(defaultValue) && defaultValue.trim() ? defaultValue : DEFAULT_VALUES.GAME.TITLE;

    logChange({
      field,
      action: oldValue === undefined ? "added" : "modified",
      before: oldValue,
      after: spec.title,
      reason: ERROR_MESSAGES.MISSING_TITLE
    }, context);
  }
}

/**
 * Normalize description
 */
function normalizeDescription(
  spec: Partial<NormalizedSpec>,
  context: NormalizationContext
): void {
  const field = "description";
  const currentValue = spec.description;
  const defaultValue = context.gamePlan?.description || DEFAULT_VALUES.GAME.DESCRIPTION;

  if (!isString(currentValue)) {
    const oldValue = currentValue;
    spec.description = isString(defaultValue) ? defaultValue : DEFAULT_VALUES.GAME.DESCRIPTION;

    logChange({
      field,
      action: oldValue === undefined ? "added" : "modified",
      before: oldValue,
      after: spec.description,
      reason: ERROR_MESSAGES.MISSING_DESCRIPTION
    }, context);
  }
}

/**
 * Normalize systems
 */
function normalizeSystems(
  spec: Partial<NormalizedSpec>,
  context: NormalizationContext
): void {
  const field = "systems";
  const currentValue = spec.systems;
  
  const { systems, changes, warnings } = validateAndNormalizeSystems(
    currentValue,
    context
  );

  spec.systems = systems;
  
  // Log changes
  for (const change of changes) {
    logChange(change, context);
  }
  
  // Log warnings
  for (const warning of warnings) {
    logWarning(warning, context);
  }
}

/**
 * Normalize scene
 */
function normalizeScene(
  spec: Partial<NormalizedSpec>,
  context: NormalizationContext
): void {
  // Ensure scene exists
  if (!spec.scene || !isObject(spec.scene)) {
    const oldValue = spec.scene;
    spec.scene = {
      gravity: { ...DEFAULT_VALUES.SCENE.GRAVITY },
      entities: []
    };

    logChange({
      field: "scene",
      action: oldValue === undefined ? "added" : "modified",
      before: oldValue,
      after: spec.scene,
      reason: ERROR_MESSAGES.MISSING_SCENE
    }, context);
  }

  // Normalize gravity
  normalizeGravity(spec.scene!, context);

  // Normalize entities
  normalizeEntities(spec.scene!, context);
}

/**
 * Normalize gravity - uses game type specific defaults
 */
function normalizeGravity(
  scene: { gravity?: { x?: number; y?: number } },
  context: NormalizationContext
): void {
  const field = "scene.gravity";
  
  // Get game type specific gravity defaults
  const gameType = context.gamePlan?.gameType || "custom";
  const gameTypeDefaults = GAME_TYPE_DEFAULTS[gameType as keyof typeof GAME_TYPE_DEFAULTS] 
    || GAME_TYPE_DEFAULTS.custom;
  const defaultGravity = gameTypeDefaults?.gravity || DEFAULT_VALUES.SCENE.GRAVITY;
  
  // Debug log
  console.log("[normalizeGravity]", {
    gameType,
    hasGamePlan: !!context.gamePlan,
    gamePlanGameType: context.gamePlan?.gameType,
    currentGravityY: scene.gravity?.y,
    defaultGravityY: defaultGravity.y,
    needsGravity: ["platformer", "endless_runner", "fighting", "sports"].includes(gameType),
    isGravityTooLow: scene.gravity?.y !== undefined && Math.abs(scene.gravity.y) < 10
  });
  
  if (!scene.gravity || !isObject(scene.gravity)) {
    const oldValue = scene.gravity;
    scene.gravity = { ...defaultGravity };

    logChange({
      field,
      action: oldValue === undefined ? "added" : "modified",
      before: oldValue,
      after: scene.gravity,
      reason: `Applied default gravity for ${gameType}`
    }, context);
  } else {
    // Ensure x and y are numbers, use game type defaults if missing
    if (!isNumber(scene.gravity.x)) {
      const oldValue = scene.gravity.x;
      scene.gravity.x = defaultGravity.x;

      logChange({
        field: "scene.gravity.x",
        action: "modified",
        before: oldValue,
        after: scene.gravity.x,
        reason: "gravity.x must be a number"
      }, context);
    }

    if (!isNumber(scene.gravity.y)) {
      const oldValue = scene.gravity.y;
      scene.gravity.y = defaultGravity.y;

      logChange({
        field: "scene.gravity.y",
        action: "modified",
        before: oldValue,
        after: scene.gravity.y,
        reason: "gravity.y must be a number"
      }, context);
    }

    // Semantic validation: if gravity is ~0 for games that need gravity, fix it
    const needsGravity = ["platformer", "endless_runner", "fighting", "sports"].includes(gameType);
    if (needsGravity && Math.abs(scene.gravity.y) < 10) {
      const oldValue = scene.gravity.y;
      scene.gravity.y = defaultGravity.y;

      logChange({
        field: "scene.gravity.y",
        action: "modified",
        before: oldValue,
        after: scene.gravity.y,
        reason: `Gravity too low for ${gameType}, applied default`
      }, context);
    }
  }
}

/**
 * Normalize entities
 */
function normalizeEntities(
  scene: { entities?: unknown[] },
  context: NormalizationContext
): void {
  const field = "scene.entities";
  
  if (!scene.entities || !isArray(scene.entities)) {
    const oldValue = scene.entities;
    scene.entities = [];

    logChange({
      field,
      action: oldValue === undefined ? "added" : "modified",
      before: oldValue,
      after: scene.entities,
      reason: ERROR_MESSAGES.MISSING_ENTITIES
    }, context);
  } else {
    // Normalize each entity
    const normalizedEntities = [];
    
    for (let i = 0; i < scene.entities.length; i++) {
      const entity = scene.entities[i];
      
      // Validate entity before normalization
      const entityValidation = validateEntity(entity, i);
      if (!entityValidation.valid) {
        // Skip invalid entities and log warning
        logWarning(`Skipping invalid entity at index ${i}: ${entityValidation.errors.join(", ")}`, context);
        continue;
      }
      
      // Type assertion after validation
      const partialEntity = entity as Partial<OrdaxEntity>;
      const { entity: normalizedEntity, changes } = normalizeEntity(partialEntity, context);
      
      normalizedEntities.push(normalizedEntity);
      
      // Log entity changes
      for (const change of changes) {
        logChange(change, context);
      }
    }
    
    scene.entities = normalizedEntities;
  }
}

/**
 * Fill missing entities from game plan
 */
function fillMissingEntitiesFromPlan(
  spec: Partial<NormalizedSpec>,
  context: NormalizationContext
): void {
  if (!context.gamePlan?.requiredEntities || !isArray(context.gamePlan.requiredEntities)) {
    return;
  }

  if (!spec.scene?.entities || !isArray(spec.scene.entities)) {
    return;
  }

  const requiredEntities = context.gamePlan.requiredEntities;
  const entities = spec.scene.entities;
  const gameType = spec.gameType as OrdaxGameType || DEFAULT_VALUES.GAME.GAME_TYPE;

  // Create cached detector for performance
  const detectEntityCached = createCachedEntityDetector(entities);

  for (let i = 0; i < requiredEntities.length; i++) {
    const entityKey = requiredEntities[i];
    
    if (!isString(entityKey) || !entityKey.trim()) {
      continue;
    }

    const detection = detectEntityCached(entityKey);
    
    if (!detection.exists) {
      logWarning(ERROR_MESSAGES.ADDING_MISSING_ENTITY(entityKey), context);
      
      const newEntity = createDefaultEntity(entityKey, gameType, i + 1);
      entities.push(newEntity);

      logChange({
        field: `scene.entities[${entities.length - 1}]`,
        action: "added",
        before: undefined,
        after: newEntity,
        reason: ERROR_MESSAGES.ADDING_MISSING_ENTITY(entityKey)
      }, context);
    }
  }
}

/**
 * Normalize visual (optional)
 */
function normalizeVisual(
  spec: Partial<NormalizedSpec>,
  context: NormalizationContext
): void {
  // Visual is optional, only normalize if present
  if (spec.visual !== undefined) {
    if (!isObject(spec.visual)) {
      const oldValue = spec.visual;
      spec.visual = {
        theme: {
          background: DEFAULT_VALUES.THEME.BACKGROUND,
          primary: DEFAULT_VALUES.THEME.PRIMARY,
          accent: DEFAULT_VALUES.THEME.ACCENT,
          font: DEFAULT_VALUES.THEME.FONT
        }
      };

      logChange({
        field: "visual",
        action: oldValue === undefined ? "added" : "modified",
        before: oldValue,
        after: spec.visual,
        reason: "visual must be an object"
      }, context);
    }
  }
}

/**
 * Normalize audio (optional)
 */
function normalizeAudio(
  spec: Partial<NormalizedSpec>,
  context: NormalizationContext
): void {
  // Audio is optional, only normalize if present
  if (spec.audio !== undefined && !isObject(spec.audio)) {
    const oldValue = spec.audio;
    spec.audio = {};

    logChange({
      field: "audio",
      action: oldValue === undefined ? "added" : "modified",
      before: oldValue,
      after: spec.audio,
      reason: "audio must be an object"
    }, context);
  }
}

/**
 * Create minimal valid spec for error fallback
 */
function createMinimalValidSpec(context: NormalizationContext): NormalizedSpec {
  return {
    gameType: DEFAULT_VALUES.GAME.GAME_TYPE,
    title: DEFAULT_VALUES.GAME.TITLE,
    description: DEFAULT_VALUES.GAME.DESCRIPTION,
    systems: [...DEFAULT_VALUES.GAME.SYSTEMS],
    scene: {
      gravity: { ...DEFAULT_VALUES.SCENE.GRAVITY },
      entities: []
    }
  };
}

// ============================================================================
// VALIDATION FUNCTIONS (public API)
// ============================================================================

/**
 * Validate normalized spec
 * 
 * @param spec - Spec to validate
 * @returns ValidationResult with errors and warnings
 * 
 * @example
 * ```typescript
 * const validation = validateNormalizedSpec(spec);
 * if (validation.valid) {
 *   // Spec is valid
 * } else {
 *   console.error("Validation errors:", validation.errors);
 * }
 * ```
 */
export function validateNormalizedSpec(spec: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!spec || typeof spec !== "object") {
    errors.push(ERROR_MESSAGES.INVALID_SPEC);
    return { valid: false, errors, warnings };
  }

  const obj = spec as Record<string, unknown>;

  // Validate required fields
  for (const field of VALIDATION_RULES.REQUIRED_FIELDS) {
    const expectedType = VALIDATION_RULES.FIELD_TYPES[field as keyof typeof VALIDATION_RULES.FIELD_TYPES];
    const { valid, error } = validateField(obj[field], field, expectedType, true);
    
    if (!valid && error) {
      errors.push(error);
    }
  }

  // Validate game type
  if (obj.gameType && !isOrdaxGameType(obj.gameType)) {
    errors.push(ERROR_MESSAGES.INVALID_GAME_TYPE(String(obj.gameType)));
  }

  // Validate scene if present
  if (obj.scene && isObject(obj.scene)) {
    const scene = obj.scene as Record<string, unknown>;
    
    // Validate gravity
    if (scene.gravity) {
      if (!isObject(scene.gravity)) {
        errors.push(ERROR_MESSAGES.INVALID_GRAVITY);
      } else {
        const gravity = scene.gravity as Record<string, unknown>;
        if (!isNumber(gravity.x)) {
          errors.push("scene.gravity.x must be a number");
        }
        if (!isNumber(gravity.y)) {
          errors.push("scene.gravity.y must be a number");
        }
      }
    }
    
    // Validate entities
    if (scene.entities) {
      if (!isArray(scene.entities)) {
        errors.push(ERROR_MESSAGES.INVALID_ENTITIES);
      } else {
        // Type guard ensures entities is an array
        const entities = scene.entities;
        for (let i = 0; i < entities.length; i++) {
          const entityValidation = validateEntity(entities[i], i);
          if (!entityValidation.valid) {
            errors.push(...entityValidation.errors);
          }
        }
      }
    }
  }

  // Validate systems
  if (obj.systems && isArray(obj.systems)) {
    // Type guard ensures systems is an array
    const systems = obj.systems;
    for (const system of systems) {
      if (isString(system) && !isValidSystem(system)) {
        warnings.push(ERROR_MESSAGES.INVALID_SYSTEM_NAME(system));
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Quick validation (basic checks only)
 */
export function quickValidateSpec(spec: unknown): boolean {
  if (!spec || typeof spec !== "object") {
    return false;
  }

  const obj = spec as Record<string, unknown>;
  
  // Check required fields exist
  for (const field of VALIDATION_RULES.REQUIRED_FIELDS) {
    if (obj[field] === undefined) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// HELPER FUNCTIONS (public API)
// ============================================================================

/**
 * Create a default entity for a given type
 * 
 * @param entityType - Type of entity to create
 * @param gameType - Game type for visual defaults
 * @param index - Index for positioning (default: 1)
 * @returns Default OrdaxEntity
 * 
 * @example
 * ```typescript
 * const playerEntity = createDefaultEntity("player", "platformer", 1);
 * ```
 */
export function createDefaultEntity(
  entityType: string,
  gameType: OrdaxGameType,
  index: number = 1
) {
  return utilsCreateDefaultEntity(entityType, gameType, index);
}

// Re-export configuration functions
export { getEntityVisualConfig, getDefaultVisualShapeForGameType } from "./spec-normalizer-config.ts";

import { DEFAULT_VALUES, GAME_TYPE_DEFAULTS } from "./spec-normalizer-config.ts";

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  OrdaxSpec,
  NormalizedSpec,
  PartialOrdaxSpec,
  OrdaxGameType,
  OrdaxEntity,
  OrdaxVisual,
  NormalizeOptions,
  ValidationResult,
  NormalizationResult
} from "./spec-normalizer-types.ts";

// ============================================================================
// VERSION INFO
// ============================================================================

export const VERSION = "2.0.0";
export const BUILD_DATE = "2026-02-16";
// Example game types for documentation purposes only
// The system is 100% generic and accepts any string as valid game type
export const EXAMPLE_GAME_TYPES = [
  "platformer",
  "topdown", 
  "shooter",
  "puzzle",
  "racing",
  "sports"
] as const;


// ============================================================================
// GAMEPLAY CONFIGURATION NORMALIZATION (NEW)
// ============================================================================

/**
 * Normalize player configuration based on game type
 */
function normalizePlayerConfig(
  spec: Partial<NormalizedSpec>,
  context: NormalizationContext
): void {
  const gameType = spec.gameType || DEFAULT_VALUES.GAME.GAME_TYPE;
  const defaultPlayerConfig = getDefaultPlayerConfig(gameType as OrdaxGameType);
  
  // Get player entity
  const playerEntity = spec.scene?.entities?.find(e => e.type === "player" || e.id === "player");
  
  if (playerEntity && playerEntity.props) {
    // Merge user config with defaults
    const mergedProps = mergeWithDefaults(playerEntity.props as Record<string, unknown>, defaultPlayerConfig as Record<string, unknown>);
    playerEntity.props = mergedProps;
    
    logChange({
      field: "player.props",
      action: "modified",
      before: playerEntity.props,
      after: mergedProps,
      reason: `Applied default player config for ${gameType}`
    }, context);
  }
}

/**
 * Normalize spawner configuration based on game type
 */
function normalizeSpawnerConfig(
  spec: Partial<NormalizedSpec>,
  context: NormalizationContext
): void {
  const gameType = spec.gameType || DEFAULT_VALUES.GAME.GAME_TYPE;
  const defaultSpawnerConfig = getDefaultSpawnerConfig(gameType as OrdaxGameType);
  
  // Only add spawner config if game type typically has spawners
  if (defaultSpawnerConfig && !spec.spawners) {
    (spec as unknown as { spawners: unknown }).spawners = defaultSpawnerConfig;
    
    logChange({
      field: "spawners",
      action: "added",
      before: undefined,
      after: defaultSpawnerConfig,
      reason: `Added default spawner config for ${gameType}`
    }, context);
  } else if (spec.spawners && defaultSpawnerConfig) {
    // Merge user config with defaults
    (spec as unknown as { spawners: unknown }).spawners = mergeWithDefaults(spec.spawners as unknown as Record<string, unknown>, defaultSpawnerConfig as unknown as Record<string, unknown>);
  }
}

/**
 * Normalize UI configuration based on game type
 */
function normalizeUIConfig(
  spec: Partial<NormalizedSpec>,
  context: NormalizationContext
): void {
  const gameType = spec.gameType || DEFAULT_VALUES.GAME.GAME_TYPE;
  const defaultUIConfig = getDefaultUIConfig(gameType as OrdaxGameType);
  
  if (!spec.ui) {
    (spec as unknown as { ui: unknown }).ui = defaultUIConfig;
    
    logChange({
      field: "ui",
      action: "added",
      before: undefined,
      after: defaultUIConfig,
      reason: `Added default UI config for ${gameType}`
    }, context);
  } else {
    // Merge user config with defaults
    (spec as unknown as { ui: unknown }).ui = mergeWithDefaults(spec.ui as unknown as Record<string, unknown>, defaultUIConfig as unknown as Record<string, unknown>);
  }
}

/**
 * Normalize background configuration based on game type
 */
function normalizeBackgroundConfig(
  spec: Partial<NormalizedSpec>,
  context: NormalizationContext
): void {
  const gameType = spec.gameType || DEFAULT_VALUES.GAME.GAME_TYPE;
  const defaultBgConfig = getDefaultBackgroundConfig(gameType as OrdaxGameType);
  
  if (!spec.visual) {
    (spec as unknown as { visual: { background?: unknown } }).visual = { ...(spec.visual || {}) };
  }
  
  if (!spec.visual.background) {
    spec.visual.background = defaultBgConfig;
    
    logChange({
      field: "visual.background",
      action: "added",
      before: undefined,
      after: defaultBgConfig,
      reason: `Added default background config for ${gameType}`
    }, context);
  } else {
    // Merge user config with defaults
    if (spec.visual) {
      spec.visual.background = mergeWithDefaults(spec.visual.background as unknown as Record<string, unknown>, defaultBgConfig as unknown as Record<string, unknown>);
    }
  }
}
