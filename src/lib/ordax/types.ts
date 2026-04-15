// ============================================================================
// FUNDAMENTAL TYPES - 100% GENERIC SYSTEM
// ============================================================================

// Open types - any valid string (enables 100% generic system)
export type GameGenre = string; // Any game genre (racing, shooter, puzzle, custom, hybrid, etc.)
export type VisualShape = string; // Any visual shape (rect, circle, custom, etc.)
export type BackgroundLayerType = string; // Any background type (starfield, gradient, custom, etc.)
export type BackgroundType = string; // Any background configuration type
export type MovementType = string; // Any movement system type
export type SystemId = string; // Any system identifier
export type EntityType = string; // Any entity type

// Compatibility aliases
export type OrdaxGameType = GameGenre;
export type OrdaxVisualShape = VisualShape;

// ============================================================================
// GENERIC CONFIGURATION INTERFACES
// ============================================================================

/**
 * Base configuration interface for game components
 * Uses unknown instead of any for better type safety
 */
export interface GameConfig {
  [key: string]: unknown;
}

/**
 * Gameplay configuration
 * Defines core gameplay mechanics and movement
 */
export interface GameplayConfig {
  movementType?: MovementType;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  timeLimit?: number;
  [key: string]: unknown;
}

/**
 * Player configuration
 * Defines player attributes and capabilities
 */
export interface PlayerConfig {
  speed?: number;
  health?: number;
  maxHealth?: number;
  shield?: number;
  maxShield?: number;
  damage?: number;
  [key: string]: unknown;
}

/**
 * Entity configuration
 * Base configuration for all game entities
 */
export interface EntityConfig {
  type: EntityType;
  id?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  [key: string]: unknown;
}

/**
 * Spawner configuration
 * Controls entity spawning behavior
 */
export interface SpawnerConfig {
  spawnRate?: number;
  maxSpawns?: number;
  spawnTypes?: string[];
  [key: string]: unknown;
}

/**
 * Powerup configuration
 * Defines powerup behavior and availability
 */
export interface PowerupConfig {
  enabled?: boolean;
  chance?: number;
  duration?: number;
  types?: string[];
  [key: string]: unknown;
}

/**
 * Background configuration
 * Defines visual background settings
 */
export interface BackgroundConfig {
  type: BackgroundType;
  color?: string;
  layers?: OrdaxBackgroundLayer[];
  [key: string]: unknown;
}

/**
 * UI configuration
 * Defines user interface settings
 */
export interface UIConfig {
  showScore?: boolean;
  showHealth?: boolean;
  showTimer?: boolean;
  theme?: OrdaxVisualTheme;
  [key: string]: unknown;
}

/**
 * Runtime specification
 * Defines runtime behavior and entity management
 */
export interface RuntimeSpec {
  profile?: string;
  entities?: Record<string, unknown>;
  systems?: string[];
  [key: string]: unknown;
}

/**
 * Visual representation of an entity
 * Defines shape, colors, and rendering properties
 */
export type OrdaxVisual = {
  shape: VisualShape;
  orientation?: "up" | "down" | "left" | "right";
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fill?: boolean;
  details?: Record<string, unknown>; // Shape-specific properties
  path?: string; // For custom shapes (SVG path or image URL)
};

/**
 * Unified Entity Type — Single source of truth for all entity data
 * Compatible with canvas rendering (x/y/w/h) and runtime systems (position/physics)
 */
export type OrdaxEntity = {
  id: string;
  type: string;
  
  // Position (canvas style - primary)
  x: number;
  y: number;
  w: number;
  h: number;
  
  // Visual representation
  visual?: OrdaxVisual;
  
  // Generic properties bag (health, speed, damage, etc.)
  props?: Record<string, unknown>;
  
  // Sprite animation
  sprite?: {
    url: string;
    frameWidth: number;
    frameHeight: number;
    currentAnimation?: string;
  };
  
  // Physics (optional, for runtime systems)
  physics?: {
    velocity?: { x: number; y: number };
    acceleration?: { x: number; y: number };
    mass?: number;
    friction?: number;
    gravity?: number;
  };
  
  // Metadata (optional)
  metadata?: Record<string, unknown>;
  
  // Allow custom extensions
  [key: string]: unknown;
};

// Alias for backward compatibility with runtime code
export type Entity = OrdaxEntity;

export type OrdaxVisualTheme = {
  /** CSS color string. Prefer hsl(...) */
  background?: string;
  primary?: string;
  accent?: string;
  /** CSS font-family string */
  font?: string;
};

/**
 * Background layer configuration
 * Supports parallax scrolling and various layer types
 */
export type OrdaxBackgroundLayer = {
  /** Background layer type (e.g., "starfield", "gradient", "nebula", "solid", or custom) */
  type: BackgroundLayerType;
  /** Parallax factor: 0..1 (how much it moves relative to camera) */
  parallax?: number;
  /** Density for particle-based layers (e.g., starfield) */
  density?: number;
  /** Auto-scroll speed in pixels per second */
  speedY?: number;
  /** Custom properties for specific layer types */
  [key: string]: unknown;
};

/**
 * Extended background configuration
 * Supports multiple layers and custom background types
 */
export interface BackgroundConfigExtended {
  layers?: OrdaxBackgroundLayer[];
  type?: BackgroundType;
  color?: string;
  gradient?: { from: string; to: string; direction?: string };
  image?: string;
  /** Custom properties for specific background types */
  [key: string]: unknown;
}

// ============================================================================
// GAME SPECIFICATION - MINIMAL STRUCTURE + GENERIC EXTENSIONS
// ============================================================================

// Base game specification - minimal required fields
export interface BaseGameSpec {
  // Optional metadata (legacy specs use gameType/title/description directly)
  metadata?: {
    title: string;
    description: string;
    genre: GameGenre;
  };
  
  // Scene configuration
  scene: {
    gravity: { x: number; y: number };
    entities: OrdaxEntity[];
  };
  
  // Systems (optional - can be empty for minimal games)
  systems?: SystemId[];
}

/**
 * Extended game specification
 * Complete game definition with all optional configurations
 */
export interface GameSpec extends BaseGameSpec {
  // Gameplay configuration
  gameplay?: GameplayConfig;
  
  // Player configuration
  player?: PlayerConfig;
  
  // Visual configuration
  visual?: {
    theme?: OrdaxVisualTheme;
    background?: BackgroundConfigExtended;
  };
  
  // Audio configuration
  audio?: {
    music?: string;
    sounds?: Record<string, string>;
    volume?: number;
    [key: string]: unknown;
  };
  
  // UI configuration
  ui?: UIConfig;
  
  // Runtime configuration
  runtime?: RuntimeSpec;
  
  // Custom extensions (use with caution, prefer typed properties)
  [key: string]: unknown;
}

// Compatibility alias
export type OrdaxSpec = GameSpec;

// ============================================================================
// CHAT & COMPILER TYPES (used across chat components)
// ============================================================================

export type ChatMsg = {
  role: "user" | "assistant" | "system";
  content: string;
};

/**
 * Compiler phase in the game generation pipeline
 * ✅ SSOT: Definido aqui, re-exportado em constants.ts
 */
export type CompilerPhase = "interpretation" | "plan" | "validation" | "confirmation" | "compilation";

/**
 * Response from compiler operations
 */
export interface CompilerResponse {
  kind: string;
  phase?: CompilerPhase;
  sessionId?: string;
  data?: unknown;
  error?: string;
  [key: string]: unknown;
}

/**
 * Result of game plan generation
 */
export interface GamePlanResult {
  plan: unknown;
  planWarnings?: string[];
  metadata?: {
    genre?: string;
    complexity?: string;
    estimatedTime?: number;
  };
  [key: string]: unknown;
}

// Re-export CodeSemanticPatch from code-mutator for convenience
export type { CodeSemanticPatch } from "./code-mutator/types";

/**
 * Spawn type configuration
 * Defines what can be spawned and with what probability
 */
export type SpawnType = {
  type: string;
  chance: number;
  minCount?: number;
  maxCount?: number;
  [key: string]: unknown;
};

/**
 * Spawn variant configuration
 * Defines variations of spawned entities
 */
export type SpawnVariant = {
  name: string;
  chance: number;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
};

// ============================================================================
// UTILITY TYPES AND HELPERS
// ============================================================================

/**
 * Type guard for checking if an object is a valid GameSpec
 * @param obj - Object to check
 * @returns True if object is a valid GameSpec
 */
export function isGameSpec(obj: unknown): obj is GameSpec {
  if (!obj || typeof obj !== 'object') return false;
  
  const spec = obj as Record<string, unknown>;
  
  // Check metadata
  if (!spec.metadata || typeof spec.metadata !== 'object') return false;
  const metadata = spec.metadata as Record<string, unknown>;
  if (typeof metadata.title !== 'string') return false;
  
  // Check scene
  if (!spec.scene || typeof spec.scene !== 'object') return false;
  const scene = spec.scene as Record<string, unknown>;
  if (!Array.isArray(scene.entities)) return false;
  
  return true;
}

// Helper to create a minimal game spec
export function createMinimalGameSpec(title: string, description: string, genre: string = "custom"): GameSpec {
  return {
    metadata: {
      title,
      description,
      genre
    },
    scene: {
      gravity: { x: 0, y: 0 },
      entities: []
    }
  };
}

// Helper to create a game spec with specific components
export function createGameSpec(config: {
  title: string;
  description: string;
  genre: string;
  systems?: SystemId[];
  entities?: OrdaxEntity[];
  gravity?: { x: number; y: number };
}): GameSpec {
  return {
    metadata: {
      title: config.title,
      description: config.description,
      genre: config.genre
    },
    scene: {
      gravity: config.gravity || { x: 0, y: 0 },
      entities: config.entities || []
    },
    systems: config.systems || []
  };
}

// ============================================================================
// TYPE GUARDS - Canonical entity type guards
// ============================================================================

/**
 * Type guard for checking if a value is a valid OrdaxEntity
 * @param value - Value to check
 * @returns True if value is a valid OrdaxEntity
 */
export function isEntity(value: unknown): value is OrdaxEntity {
  if (!value || typeof value !== "object") return false;
  
  const entity = value as Record<string, unknown>;
  
  return (
    typeof entity.id === "string" &&
    typeof entity.type === "string" &&
    typeof entity.x === "number" &&
    typeof entity.y === "number" &&
    typeof entity.w === "number" &&
    typeof entity.h === "number"
  );
}

/**
 * Type guard for checking if a value is an array of valid OrdaxEntities
 * @param value - Value to check
 * @returns True if value is an array of valid OrdaxEntities
 */
export function isEntityArray(value: unknown): value is OrdaxEntity[] {
  return Array.isArray(value) && (value.length === 0 || value.every(isEntity));
}

// Schema validation for game specs
export interface SchemaValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Type for game spec with validation
export type ValidatedGameSpec = GameSpec & {
  _validated: true;
  validation: SchemaValidation;
};
