/**
 * ⚙️ PHYSICS SYSTEM CONFIG — Centralised configuration
 *
 * @version 2.1.0
 * @changelog
 *   - 2.1.0: SSOT compliance - imports constants from config.ts
 */

import { PHYSICS_CONSTANTS, PHYSICS_DEFAULTS } from '../config';
import { PHYSICS_LIMITS, DEFAULT_VALUES } from './physicsSystemTypes';

// ---------------------------------------------------------------------------
// System config
// ---------------------------------------------------------------------------

export const PHYSICS_SYSTEM_CONFIG = {
  MAX_COMPONENTS: 2000,
  FIXED_DT: PHYSICS_CONSTANTS.FIXED_DT,
  MAX_SUB_STEPS: PHYSICS_CONSTANTS.MAX_SUB_STEPS,
  SLEEP_THRESHOLD: PHYSICS_CONSTANTS.SLEEP_THRESHOLD,
  SLEEP_FRAMES: PHYSICS_CONSTANTS.SLEEP_FRAMES,

  DEBUG_ENABLED: typeof import.meta !== 'undefined' && import.meta.env?.DEV,
  LOG_LEVEL: 'warn' as 'error' | 'warn' | 'info' | 'debug',

  GRAVITY: PHYSICS_DEFAULTS.GRAVITY,
  AIR_RESISTANCE_FACTOR: PHYSICS_CONSTANTS.AIR_DRAG_RATIO,
  FORCE_THRESHOLD: PHYSICS_CONSTANTS.FORCE_EPS,

  VALIDATE_INPUTS: true,
  THROW_ON_INVALID: false,
  MAX_FORCES_PER_COMPONENT: 10,
  MAX_VELOCITY: PHYSICS_CONSTANTS.MAX_SPEED_GLOBAL,
  MIN_DT: PHYSICS_CONSTANTS.FIXED_DT / 100,
  MAX_DT: PHYSICS_CONSTANTS.MAX_SUB_STEPS * PHYSICS_CONSTANTS.FIXED_DT,
} as const;

// ---------------------------------------------------------------------------
// Error messages
// ---------------------------------------------------------------------------

export const ERROR_MESSAGES = {
  INVALID_ENTITY_ID: 'Invalid entity ID: must be non-empty string',
  INVALID_MASS: `Invalid mass: must be between ${PHYSICS_LIMITS.MIN_MASS} and ${PHYSICS_LIMITS.MAX_MASS}`,
  INVALID_FRICTION: `Invalid friction: must be between ${PHYSICS_LIMITS.MIN_FRICTION} and ${PHYSICS_LIMITS.MAX_FRICTION}`,
  INVALID_RESTITUTION: `Invalid restitution: must be between ${PHYSICS_LIMITS.MIN_RESTITUTION} and ${PHYSICS_LIMITS.MAX_RESTITUTION}`,
  INVALID_DT: `Invalid delta time: must be between ${PHYSICS_LIMITS.MIN_DT} and ${PHYSICS_LIMITS.MAX_DT}`,
  ENTITY_NOT_FOUND: 'Entity not found in physics system',
  MASS_ZERO_DIVISION: 'Mass cannot be zero (would cause division by zero)',
} as const;

// ---------------------------------------------------------------------------
// Gravity presets
// ---------------------------------------------------------------------------

export const GRAVITY_PRESETS = {
  none: { x: 0, y: 0 },
  earth: { x: 0, y: 9.8 },
  moon: { x: 0, y: 1.62 },
  platformer: { x: 0, y: 15 },
  shooter: { x: 0, y: 0 },
} as const;

// ---------------------------------------------------------------------------
// Entity defaults by type
// ---------------------------------------------------------------------------

export const ENTITY_DEFAULTS: Record<string, {
  mass: number; friction: number; restitution: number; maxSpeed: number;
}> = {
  player:   { mass: 1.0, friction: 0.10, restitution: 0.2, maxSpeed: 300 },
  enemy:    { mass: 1.5, friction: 0.15, restitution: 0.3, maxSpeed: 200 },
  bullet:   { mass: 0.1, friction: 0.05, restitution: 0.8, maxSpeed: 500 },
  asteroid: { mass: 5.0, friction: 0.20, restitution: 0.7, maxSpeed: 100 },
  powerup:  { mass: 0.5, friction: 0.08, restitution: 0.4, maxSpeed: 150 },
  default:  { mass: 1.0, friction: 0.10, restitution: 0.5, maxSpeed: 0   },
};

export function getEntityDefaults(type?: string) {
  return ENTITY_DEFAULTS[(type ?? '').toLowerCase()] ?? ENTITY_DEFAULTS.default;
}

export function getGravityPreset(preset: keyof typeof GRAVITY_PRESETS = 'none') {
  return GRAVITY_PRESETS[preset];
}

// ---------------------------------------------------------------------------
// Debug logging
// ---------------------------------------------------------------------------

const LEVEL_ORDER = ['error', 'warn', 'info', 'debug'] as const;

export function debugLog(_level: typeof LEVEL_ORDER[number], _message: string, _data?: unknown): void {
  // Debug logging silenciado conforme regras de zero console.log em sistemas
  // Usar DebugLogPanel se necessário para diagnósticos
  return;
}
