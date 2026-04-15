// Utility functions for spec-normalizer.ts
// Type guards, validation helpers, and common utilities

import type {
  PartialOrdaxSpec,
  OrdaxSpec,
  NormalizedSpec,
  OrdaxEntity,
  OrdaxGameType,
  ValidationResult,
  EntityDetectionResult,
  NormalizationContext
} from "./spec-normalizer-types.ts";

export {
  isOrdaxGameType,
  isOrdaxVisualShape
} from "./spec-normalizer-types.ts";

import {
  ERROR_MESSAGES,
  VALIDATION_RULES,
  isValidSystem,
  normalizeSystemName,
  getEntityVisualConfig,
  generateEntityId,
  getDefaultPositionForIndex
} from "./spec-normalizer-config.ts";

// Type guards
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}



// Validation helpers
export function validateField(
  value: unknown,
  fieldName: string,
  expectedType: string,
  isRequired: boolean = true
): { valid: boolean; error?: string } {
  // Check if field is required but missing
  if (isRequired && value === undefined) {
    return {
      valid: false,
      error: `Campo obrigatório ausente: ${fieldName}`
    };
  }
  
  // If field is optional and missing, it's valid
  if (!isRequired && value === undefined) {
    return { valid: true };
  }
  
  // Validate type
  switch (expectedType) {
    case "string":
      if (!isString(value)) {
        return {
          valid: false,
          error: `Campo ${fieldName} deve ser string, recebido: ${typeof value}`
        };
      }
      if (isRequired && !isNonEmptyString(value)) {
        return {
          valid: false,
          error: `Campo ${fieldName} não pode ser vazio`
        };
      }
      break;
      
    case "number":
      if (!isNumber(value)) {
        return {
          valid: false,
          error: `Campo ${fieldName} deve ser number, recebido: ${typeof value}`
        };
      }
      break;
      
    case "array":
      if (!isArray(value)) {
        return {
          valid: false,
          error: `Campo ${fieldName} deve ser array, recebido: ${typeof value}`
        };
      }
      break;
      
    case "object":
      if (!isObject(value)) {
        return {
          valid: false,
          error: `Campo ${fieldName} deve ser object, recebido: ${typeof value}`
        };
      }
      break;
      
    default:
      return {
        valid: false,
        error: `Tipo desconhecido para validação: ${expectedType}`
      };
  }
  
  return { valid: true };
}

export function validateEntity(entity: unknown, index: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!isObject(entity)) {
    errors.push(ERROR_MESSAGES.INVALID_ENTITY(index, "não é um objeto"));
    return { valid: false, errors };
  }
  
  const obj = entity as Record<string, unknown>;
  
  // Validate required fields
  for (const field of VALIDATION_RULES.ENTITY_REQUIRED_FIELDS) {
    const expectedType = VALIDATION_RULES.ENTITY_FIELD_TYPES[field as keyof typeof VALIDATION_RULES.ENTITY_FIELD_TYPES];
    const { valid, error } = validateField(obj[field], field, expectedType, true);
    
    if (!valid && error) {
      errors.push(ERROR_MESSAGES.INVALID_ENTITY(index, error));
    }
  }
  
  // Validate visual if present
  if (obj.visual !== undefined) {
    if (!isObject(obj.visual)) {
      errors.push(ERROR_MESSAGES.INVALID_ENTITY(index, "visual deve ser objeto"));
    }
  }
  
  // Validate props if present
  if (obj.props !== undefined && !isObject(obj.props)) {
    errors.push(ERROR_MESSAGES.INVALID_ENTITY(index, "props deve ser objeto"));
  }
  
  // Validate sprite if present
  if (obj.sprite !== undefined) {
    if (!isObject(obj.sprite)) {
      errors.push(ERROR_MESSAGES.INVALID_ENTITY(index, "sprite deve ser objeto"));
    } else {
      const sprite = obj.sprite as Record<string, unknown>;
      if (!isString(sprite.url)) {
        errors.push(ERROR_MESSAGES.INVALID_ENTITY(index, "sprite.url deve ser string"));
      }
      if (!isNumber(sprite.frameWidth)) {
        errors.push(ERROR_MESSAGES.INVALID_ENTITY(index, "sprite.frameWidth deve ser number"));
      }
      if (!isNumber(sprite.frameHeight)) {
        errors.push(ERROR_MESSAGES.INVALID_ENTITY(index, "sprite.frameHeight deve ser number"));
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// Entity detection and matching
export function detectEntity(
  entities: OrdaxEntity[],
  entityKey: string
): EntityDetectionResult {
  const key = entityKey.toLowerCase();
  let matchedEntity: OrdaxEntity | undefined;
  let matchType: EntityDetectionResult["matchType"] = "none";
  const details = {
    matchedById: false,
    matchedByType: false,
    matchedByPrefix: false
  };
  
  for (const entity of entities) {
    const entityId = entity.id.toLowerCase();
    const entityType = entity.type.toLowerCase();
    
    // Exact match by ID
    if (entityId === key) {
      matchedEntity = entity;
      matchType = "exact";
      details.matchedById = true;
      break;
    }
    
    // Exact match by type
    if (entityType === key) {
      matchedEntity = entity;
      matchType = "exact";
      details.matchedByType = true;
      break;
    }
    
    // Partial match by ID prefix
    if (entityId.startsWith(`${key}_`)) {
      matchedEntity = entity;
      matchType = "partial";
      details.matchedByPrefix = true;
      // Continue searching for exact match
    }
    
    // Partial match by type prefix
    if (entityType.startsWith(`${key}_`)) {
      if (!matchedEntity || matchType === "none") {
        matchedEntity = entity;
        matchType = "partial";
        details.matchedByPrefix = true;
      }
    }
  }
  
  return {
    exists: !!matchedEntity,
    entity: matchedEntity,
    matchType,
    details
  };
}

// Entity creation and normalization
export function createDefaultEntity(
  entityType: string,
  gameType: OrdaxGameType,
  index: number = 1
): OrdaxEntity {
  const visualConfig = getEntityVisualConfig(entityType);
  const position = getDefaultPositionForIndex(index - 1);
  
  return {
    id: generateEntityId(entityType, index),
    type: entityType,
    x: position.x,
    y: position.y,
    w: visualConfig.size?.width || 32,
    h: visualConfig.size?.height || 32,
    visual: {
      shape: visualConfig.shape,
      color: visualConfig.color,
      fill: true,
      strokeWidth: 1,
      strokeColor: "hsl(0, 0%, 20%)"
    },
    props: {}
  };
}

export function normalizeEntity(
  entity: Partial<OrdaxEntity>,
  context: NormalizationContext
): { entity: OrdaxEntity; changes: Array<NormalizationContext["changes"][0]> } {
  const changes: Array<NormalizationContext["changes"][0]> = [];
  const normalized: Partial<OrdaxEntity> = { ...entity };
  
  // Ensure ID
  if (!normalized.id || !isNonEmptyString(normalized.id)) {
    const oldId = normalized.id;
    normalized.id = generateEntityId(normalized.type || "entity", 1);
    changes.push({
      field: "id",
      action: "added",
      before: oldId,
      after: normalized.id,
      reason: ERROR_MESSAGES.ENTITY_MISSING_ID(context.changes.length)
    });
  }
  
  // Ensure type
  if (!normalized.type || !isString(normalized.type)) {
    const oldType = normalized.type;
    normalized.type = "entity";
    changes.push({
      field: "type",
      action: "added",
      before: oldType,
      after: normalized.type,
      reason: "Tipo de entidade ausente"
    });
  }
  
  // Ensure position
  if (!isNumber(normalized.x) || !isNumber(normalized.y)) {
    const oldPosition = { x: normalized.x, y: normalized.y };
    const defaultPosition = getDefaultPositionForIndex(context.changes.length);
    normalized.x = defaultPosition.x;
    normalized.y = defaultPosition.y;
    changes.push({
      field: "position",
      action: normalized.x === undefined || normalized.y === undefined ? "added" : "modified",
      before: oldPosition,
      after: { x: normalized.x, y: normalized.y },
      reason: ERROR_MESSAGES.ENTITY_MISSING_POSITION(normalized.id!)
    });
  }
  
  // Ensure size
  if (!isNumber(normalized.w) || !isNumber(normalized.h)) {
    const oldSize = { w: normalized.w, h: normalized.h };
    const visualConfig = getEntityVisualConfig(normalized.type!);
    normalized.w = visualConfig.size?.width || 32;
    normalized.h = visualConfig.size?.height || 32;
    changes.push({
      field: "size",
      action: normalized.w === undefined || normalized.h === undefined ? "added" : "modified",
      before: oldSize,
      after: { w: normalized.w, h: normalized.h },
      reason: ERROR_MESSAGES.ENTITY_MISSING_SIZE(normalized.id!)
    });
  }
  
  // Ensure visual
  if (!normalized.visual || !isObject(normalized.visual)) {
    const oldVisual = normalized.visual;
    const visualConfig = getEntityVisualConfig(normalized.type!);
    normalized.visual = {
      shape: visualConfig.shape,
      color: visualConfig.color,
      fill: true,
      strokeWidth: 1,
      strokeColor: "hsl(0, 0%, 20%)"
    };
    changes.push({
      field: "visual",
      action: "added",
      before: oldVisual,
      after: normalized.visual,
      reason: ERROR_MESSAGES.ENTITY_MISSING_VISUAL(normalized.id!)
    });
  }
  
  // Ensure props
  if (!normalized.props || !isObject(normalized.props)) {
    const oldProps = normalized.props;
    normalized.props = {};
    changes.push({
      field: "props",
      action: "added",
      before: oldProps,
      after: normalized.props,
      reason: "Props ausente, criando objeto vazio"
    });
  }
  
  return {
    entity: normalized as OrdaxEntity,
    changes
  };
}

// System validation and normalization
export function validateAndNormalizeSystems(
  systems: unknown,
  context: NormalizationContext
): { systems: string[]; changes: Array<NormalizationContext["changes"][0]>; warnings: string[] } {
  const changes: Array<NormalizationContext["changes"][0]> = [];
  const warnings: string[] = [];
  
  // Filter and validate systems
  const systemSet = new Set<string>();

  // If systems is not an array, start empty (will be filled from gamePlan below)
  if (!isArray(systems)) {
    if (systems !== undefined && systems !== null) {
      changes.push({
        field: "systems",
        action: "added",
        before: systems,
        after: [],
        reason: ERROR_MESSAGES.MISSING_SYSTEMS
      });
    }
  } else {
    for (let i = 0; i < systems.length; i++) {
      const system = systems[i];
      
      if (!isString(system) || !system.trim()) {
        warnings.push(ERROR_MESSAGES.INVALID_SYSTEM_NAME(String(system)));
        continue;
      }
      
      const trimmedSystem = system.trim();
      
      // Normalize snake_case / alias → canonical PascalCase
      const normalizedSystem = normalizeSystemName(trimmedSystem);
      
      // Check for duplicates
      if (systemSet.has(normalizedSystem)) {
        warnings.push(ERROR_MESSAGES.DUPLICATE_SYSTEM(normalizedSystem));
        continue;
      }
      
      // Check if system is valid after normalization
      if (!isValidSystem(normalizedSystem)) {
        warnings.push(ERROR_MESSAGES.INVALID_SYSTEM_NAME(trimmedSystem));
        // Still add it, but with warning
      }
      
      systemSet.add(normalizedSystem);
    }
  }

  // ✅ CRITICAL: Inject ALL requiredSystems from gamePlan that are missing
  // This ensures CollisionSystem, ParticleSystem, CameraSystem, etc. are always present
  if (context.options.fillMissingSystems && context.gamePlan?.requiredSystems) {
    const planSystems = context.gamePlan.requiredSystems;
    if (isArray(planSystems)) {
      for (const sys of planSystems) {
        if (isString(sys) && sys.trim() && !systemSet.has(sys.trim())) {
          systemSet.add(sys.trim());
          changes.push({
            field: "systems",
            action: "added",
            before: undefined,
            after: sys.trim(),
            reason: `Sistema '${sys}' obrigatório pelo gamePlan, injetado automaticamente`
          });
        }
      }
    }
  }

  const normalizedSystems = Array.from(systemSet);
  
  // If still no systems, add sensible defaults
  if (normalizedSystems.length === 0 && context.options.fillMissingSystems) {
    const defaultSystems = [
      "PhysicsSystem", "CollisionSystem", "UISystem", "ScoreSystem",
      "TimerSystem", "CameraSystem", "AISystem"
    ];
    for (const s of defaultSystems) systemSet.add(s);
    changes.push({
      field: "systems",
      action: "modified",
      before: [],
      after: defaultSystems,
      reason: "Nenhum sistema encontrado, adicionando sistemas padrão completos"
    });
    return { systems: defaultSystems, changes, warnings };
  }
  
  return { systems: normalizedSystems, changes, warnings };
}

// Error with validation details interface
interface ValidationErrorWithDetails extends Error {
  validationDetails?: Record<string, unknown>;
}

// Error and warning utilities
export function createValidationError(message: string, details?: Record<string, unknown>): ValidationErrorWithDetails {
  const error = new Error(message) as ValidationErrorWithDetails;
  error.validationDetails = details;
  return error;
}

export function logWarning(warning: string, context: NormalizationContext): void {
  context.warnings.push(warning);
  // In production, this would use structured logging
  console.warn(`[SpecNormalizer] ${warning}`);
}

export function logChange(change: NormalizationContext["changes"][0], context: NormalizationContext): void {
  context.changes.push(change);
  // In production, this would use structured logging
  console.log(`[SpecNormalizer] ${change.field}: ${change.action} - ${change.reason}`);
}

// Performance optimization: cached validators
const entityCache = new Map<string, EntityDetectionResult>();

export function createCachedEntityDetector(entities: OrdaxEntity[]) {
  // Build cache
  const cache = new Map<string, EntityDetectionResult>();
  
  for (const entity of entities) {
    const idKey = entity.id.toLowerCase();
    const typeKey = entity.type.toLowerCase();
    
    // Cache by ID
    if (!cache.has(idKey)) {
      cache.set(idKey, {
        exists: true,
        entity,
        matchType: "exact",
        details: { matchedById: true, matchedByType: false, matchedByPrefix: false }
      });
    }
    
    // Cache by type
    if (!cache.has(typeKey)) {
      cache.set(typeKey, {
        exists: true,
        entity,
        matchType: "exact",
        details: { matchedById: false, matchedByType: true, matchedByPrefix: false }
      });
    }
  }
  
  return function detectEntityCached(entityKey: string): EntityDetectionResult {
    const key = entityKey.toLowerCase();
    
    // Check cache first
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    // Fall back to regular detection
    return detectEntity(entities, entityKey);
  };
}