// ECS Components - Pure data structures

import {
  ECS_PHYSICS_DEFAULTS,
  ECS_AI_DEFAULTS,
  ECS_SCORE_DEFAULTS,
  ECS_COLLIDER_DEFAULTS,
  AI_BEHAVIOR_TYPES,
  COMPONENT_TYPES,
  validateEcsPhysicsConfig as validatePhysicsConfig,
  validateAIConfig,
} from "@/lib/constants/systems/ecs";

export interface Component {
  type: string;
}

// Position Component
export interface Position extends Component {
  type: "Position";
  x: number;
  y: number;
}

// Velocity Component
export interface Velocity extends Component {
  type: "Velocity";
  vx: number;
  vy: number;
}

// Size Component
export interface Size extends Component {
  type: "Size";
  w: number;
  h: number;
}

// Health Component
export interface Health extends Component {
  type: "Health";
  current: number;
  max: number;
}

// Sprite Component
export interface Sprite extends Component {
  type: "Sprite";
  url: string;
  frameWidth: number;
  frameHeight: number;
  currentAnimation?: string;
}

// Physics Component
export interface Physics extends Component {
  type: "Physics";
  mass: number;
  friction: number;
  restitution: number;
  grounded: boolean;
}

// Collider Component
export interface Collider extends Component {
  type: "Collider";
  layer: string;
  isTrigger: boolean;
}

// Tag Component
export interface Tag extends Component {
  type: "Tag";
  value: string;
}

// AI Component
export interface AI extends Component {
  type: "AI";
  behavior: "idle" | "patrol" | "chase" | "flee" | "wander";
  speed: number;
  detectionRange: number;
}

// Score Component
export interface Score extends Component {
  type: "Score";
  value: number;
  multiplier: number;
}

// Helper functions
export function createPosition(x: number, y: number): Position {
  return { type: COMPONENT_TYPES.POSITION, x, y };
}

export function createVelocity(vx: number, vy: number): Velocity {
  return { type: COMPONENT_TYPES.VELOCITY, vx, vy };
}

export function createSize(w: number, h: number): Size {
  return { type: COMPONENT_TYPES.SIZE, w, h };
}

export function createHealth(current: number, max: number): Health {
  return { type: COMPONENT_TYPES.HEALTH, current, max };
}

export function createSprite(
  url: string,
  frameWidth: number,
  frameHeight: number
): Sprite {
  return { type: COMPONENT_TYPES.SPRITE, url, frameWidth, frameHeight };
}

export function createPhysics(
  mass?: number,
  friction?: number,
  restitution?: number
): Physics {
  const config = validatePhysicsConfig({ mass, friction, restitution });
  return { 
    type: COMPONENT_TYPES.PHYSICS, 
    mass: config.mass, 
    friction: config.friction, 
    restitution: config.restitution, 
    grounded: false 
  };
}

export function createCollider(layer?: string, isTrigger?: boolean): Collider {
  return { 
    type: COMPONENT_TYPES.COLLIDER, 
    layer: layer ?? ECS_COLLIDER_DEFAULTS.LAYER, 
    isTrigger: isTrigger ?? ECS_COLLIDER_DEFAULTS.IS_TRIGGER 
  };
}

export function createTag(value: string): Tag {
  return { type: COMPONENT_TYPES.TAG, value };
}

export function createAI(
  behavior?: string,
  speed?: number,
  detectionRange?: number
): AI {
  const config = validateAIConfig({ behavior, speed, detectionRange });
  return { 
    type: COMPONENT_TYPES.AI, 
    behavior: config.behavior, 
    speed: config.speed, 
    detectionRange: config.detectionRange 
  };
}

export function createScore(value?: number, multiplier?: number): Score {
  return { 
    type: COMPONENT_TYPES.SCORE, 
    value: value ?? ECS_SCORE_DEFAULTS.INITIAL_VALUE, 
    multiplier: multiplier ?? ECS_SCORE_DEFAULTS.INITIAL_MULTIPLIER 
  };
}
