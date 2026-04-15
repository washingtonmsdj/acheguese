/**
 * Constantes para o sistema ECS (Entity Component System)
 * 
 * Centraliza todos os valores padrão para componentes
 */

import type { AI } from "@/lib/ordax/ecs/Component";

/**
 * Constantes de física padrão para componentes
 */
export const ECS_PHYSICS_DEFAULTS = {
  MASS: 1,
  FRICTION: 0.1,
  RESTITUTION: 0.5,
} as const;

/**
 * Constantes de AI padrão para componentes
 */
export const ECS_AI_DEFAULTS = {
  SPEED: 100,
  DETECTION_RANGE: 200,
} as const;

/**
 * Constantes de score padrão para componentes
 */
export const ECS_SCORE_DEFAULTS = {
  INITIAL_VALUE: 0,
  INITIAL_MULTIPLIER: 1,
} as const;

/**
 * Constantes de collider padrão para componentes
 */
export const ECS_COLLIDER_DEFAULTS = {
  LAYER: "default",
  IS_TRIGGER: false,
} as const;

/**
 * Tipos de comportamento de AI disponíveis
 * Sistema 100% genérico: pode ser estendido dinamicamente
 */
export const AI_BEHAVIOR_TYPES = {
  IDLE: "idle",
  PATROL: "patrol",
  CHASE: "chase",
  FLEE: "flee",
  WANDER: "wander",
} as const;

/**
 * Tipos de componentes disponíveis
 * Sistema 100% genérico: pode ser estendido dinamicamente
 */
export const COMPONENT_TYPES = {
  POSITION: "Position",
  VELOCITY: "Velocity",
  SIZE: "Size",
  HEALTH: "Health",
  SPRITE: "Sprite",
  PHYSICS: "Physics",
  COLLIDER: "Collider",
  TAG: "Tag",
  AI: "AI",
  SCORE: "Score",
} as const;

/**
 * Configuração padrão do ECS
 */
export const ECS_CONFIG = {
  DEFAULTS: {
    PHYSICS: ECS_PHYSICS_DEFAULTS,
    AI: ECS_AI_DEFAULTS,
    SCORE: ECS_SCORE_DEFAULTS,
    COLLIDER: ECS_COLLIDER_DEFAULTS,
  },
  BEHAVIOR_TYPES: AI_BEHAVIOR_TYPES,
  COMPONENT_TYPES: COMPONENT_TYPES,
} as const;

/**
 * Obtém comportamento de AI válido
 */
export function getValidAIBehavior(behavior: string): AI["behavior"] {
  const validBehaviors = Object.values(AI_BEHAVIOR_TYPES);
  return validBehaviors.includes(behavior as AI["behavior"]) 
    ? behavior as AI["behavior"] 
    : AI_BEHAVIOR_TYPES.IDLE;
}

/**
 * Valida e normaliza configuração de física ECS
 */
export function validateEcsPhysicsConfig(config: {
  mass?: number;
  friction?: number;
  restitution?: number;
}) {
  return {
    mass: config.mass ?? ECS_PHYSICS_DEFAULTS.MASS,
    friction: config.friction ?? ECS_PHYSICS_DEFAULTS.FRICTION,
    restitution: config.restitution ?? ECS_PHYSICS_DEFAULTS.RESTITUTION,
  };
}

/**
 * Valida e normaliza configuração de AI
 */
export function validateAIConfig(config: {
  behavior?: string;
  speed?: number;
  detectionRange?: number;
}) {
  return {
    behavior: getValidAIBehavior(config.behavior ?? AI_BEHAVIOR_TYPES.IDLE),
    speed: config.speed ?? ECS_AI_DEFAULTS.SPEED,
    detectionRange: config.detectionRange ?? ECS_AI_DEFAULTS.DETECTION_RANGE,
  };
}