// Configuration for spec-normalizer.ts
// Centralized constants and configuration for spec normalization

import type { OrdaxGameType, OrdaxVisualShape } from "./spec-normalizer-types.ts";

// Default values for normalization
export const DEFAULT_VALUES = {
  // Entity defaults
  ENTITY: {
    POSITION: { x: 400, y: 300 },
    SIZE: { width: 32, height: 32 },
    VISUAL: {
      shape: "rect" as OrdaxVisualShape,
      color: "hsl(0, 0%, 50%)",
      fill: true,
      strokeWidth: 1,
      strokeColor: "hsl(0, 0%, 20%)"
    }
  },
  
  // Scene defaults
  SCENE: {
    GRAVITY: { x: 0, y: 0 },
    BACKGROUND: {
      layers: [
        { type: "solid", parallax: 0 }
      ]
    }
  },
  
  // Game defaults
  GAME: {
    TITLE: "Jogo Ordax",
    DESCRIPTION: "",
    GAME_TYPE: "platformer" as OrdaxGameType,
    SYSTEMS: ["TimeSystem", "FSMSystem", "UISystem", "InputSystem"]
  },
  
  // Visual theme defaults
  THEME: {
    BACKGROUND: "hsl(240, 20%, 10%)",
    PRIMARY: "hsl(200, 80%, 50%)",
    ACCENT: "hsl(40, 90%, 60%)",
    FONT: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  }
} as const;

// Game type specific defaults (gravity, physics, etc)
export const GAME_TYPE_DEFAULTS: Record<OrdaxGameType, {
  gravity: { x: number; y: number };
}> = {
  platformer: { gravity: { x: 0, y: 800 } },
  shooter: { gravity: { x: 0, y: 0 } },
  racer: { gravity: { x: 0, y: 0 } },
  puzzle: { gravity: { x: 0, y: 0 } },
  rpg: { gravity: { x: 0, y: 0 } },
  strategy: { gravity: { x: 0, y: 0 } },
  endless_runner: { gravity: { x: 0, y: 800 } },
  fighting: { gravity: { x: 0, y: 800 } },
  sports: { gravity: { x: 0, y: 600 } },
  simulation: { gravity: { x: 0, y: 0 } },
  custom: { gravity: { x: 0, y: 0 } },
};

// Entity type to visual mapping
export const ENTITY_VISUAL_MAPPING: Record<string, {
  shape: OrdaxVisualShape;
  color: string;
  size?: { width: number; height: number };
}> = {
  // Player entities
  player: {
    shape: "rect",
    color: "hsl(200, 80%, 50%)",
    size: { width: 32, height: 32 }
  },
  
  // Enemy entities
  enemy: {
    shape: "circle",
    color: "hsl(0, 80%, 50%)",
    size: { width: 28, height: 28 }
  },
  
  // Vehicle entities
  vehicle: {
    shape: "car",
    color: "hsl(30, 80%, 50%)",
    size: { width: 40, height: 24 }
  },
  
  // Obstacle entities
  obstacle: {
    shape: "rect",
    color: "hsl(30, 60%, 40%)",
    size: { width: 32, height: 32 }
  },
  
  // Collectible entities
  collectible: {
    shape: "circle",
    color: "hsl(60, 80%, 60%)",
    size: { width: 16, height: 16 }
  },
  
  // Platform entities
  platform: {
    shape: "rect",
    color: "hsl(120, 40%, 40%)",
    size: { width: 64, height: 16 }
  },
  
  // Wall entities
  wall: {
    shape: "rect",
    color: "hsl(0, 0%, 30%)",
    size: { width: 32, height: 128 }
  },
  
  // Goal entities
  goal: {
    shape: "rect",
    color: "hsl(120, 80%, 50%)",
    size: { width: 32, height: 64 }
  },
  
  // Bullet entities
  bullet: {
    shape: "circle",
    color: "hsl(40, 90%, 60%)",
    size: { width: 8, height: 8 }
  },
  
  // Power-up entities
  powerup: {
    shape: "triangle",
    color: "hsl(280, 80%, 60%)",
    size: { width: 24, height: 24 }
  },
  
  // Track entities
  track: {
    shape: "rect",
    color: "hsl(0, 0%, 20%)",
    size: { width: 800, height: 100 }
  },
  
  // Ball entities
  ball: {
    shape: "circle",
    color: "hsl(0, 0%, 80%)",
    size: { width: 24, height: 24 }
  },
  
  // Net entities
  net: {
    shape: "rect",
    color: "hsl(0, 0%, 60%)",
    size: { width: 4, height: 64 }
  },
  
  // Paddle entities
  paddle: {
    shape: "rect",
    color: "hsl(200, 60%, 50%)",
    size: { width: 16, height: 64 }
  },
  
  // Block entities
  block: {
    shape: "rect",
    color: "hsl(30, 50%, 40%)",
    size: { width: 48, height: 24 }
  },
  
  // Coin entities
  coin: {
    shape: "circle",
    color: "hsl(60, 80%, 60%)",
    size: { width: 12, height: 12 }
  },
  
  // Key entities
  key: {
    shape: "triangle",
    color: "hsl(40, 80%, 60%)",
    size: { width: 16, height: 32 }
  },
  
  // Door entities
  door: {
    shape: "rect",
    color: "hsl(20, 40%, 30%)",
    size: { width: 32, height: 64 }
  },
  
  // Checkpoint entities
  checkpoint: {
    shape: "rect",
    color: "hsl(60, 80%, 50%)",
    size: { width: 32, height: 32 }
  },
  
  // Spawn point entities
  spawn_point: {
    shape: "circle",
    color: "hsl(120, 60%, 50%)",
    size: { width: 24, height: 24 }
  },
  
  // Finish line entities
  finish_line: {
    shape: "rect",
    color: "hsl(120, 80%, 50%)",
    size: { width: 10, height: 100 }
  },
  
  // Start line entities
  start_line: {
    shape: "rect",
    color: "hsl(200, 80%, 50%)",
    size: { width: 10, height: 100 }
  }
} as const;

// Game type to default visual shape mapping
// For 100% generic system, we provide defaults for known game types
// but also handle unknown/custom game types gracefully
export const GAME_TYPE_VISUAL_MAPPING: Record<string, OrdaxVisualShape> = {
  platformer: "rect",
  topdown: "rect",
  shooter: "rect",
  puzzle: "rect",
  racing: "car",
  sports: "rect"
} as const;

// Valid system names (from Ordax engine)
export const VALID_SYSTEMS = [
  "PhysicsSystem",
  "CollisionSystem",
  "ParticleSystem",
  "AnimationSystem",
  "AudioSystem",
  "CameraSystem",
  "AISystem",
  "SpawnerSystem",
  "ScoreSystem",
  "UISystem",
  "TimerSystem",
  "DialogueSystem",
  "InventorySystem",
  "SaveSystem",
  "GameStateSystem",  // ✅ Sistema constitucional (FSM)
  "InputSystem",      // ✅ Sistema constitucional (Input)
  "TimeSystem",
  "FSMSystem",
  "VehicleSystem",
  "ViewportSystem",
  "SpawnSystem"
] as const;

export type ValidSystem = typeof VALID_SYSTEMS[number];

// Error messages
export const ERROR_MESSAGES = {
  // Validation errors
  INVALID_SPEC: "Spec inválida: não é um objeto",
  INVALID_GAME_TYPE: (gameType: string) => `Tipo de jogo inválido: ${gameType}`,
  INVALID_TITLE: "Título inválido: deve ser uma string não vazia",
  INVALID_DESCRIPTION: "Descrição inválida: deve ser uma string",
  INVALID_SYSTEMS: "Sistemas inválidos: deve ser um array",
  INVALID_SCENE: "Scene inválida: deve ser um objeto",
  INVALID_GRAVITY: "Gravity inválido: deve ser um objeto com x e number",
  INVALID_ENTITIES: "Entities inválido: deve ser um array",
  INVALID_ENTITY: (index: number, reason: string) => `Entidade ${index} inválida: ${reason}`,
  
  // Normalization warnings
  MISSING_GAME_TYPE: "gameType ausente, usando padrão: platformer",
  MISSING_TITLE: "title ausente, usando padrão: Jogo Ordax",
  MISSING_DESCRIPTION: "description ausente, usando string vazia",
  MISSING_SYSTEMS: "systems ausente, criando array vazio",
  MISSING_SCENE: "scene ausente, criando scene padrão",
  MISSING_GRAVITY: "gravity ausente, usando padrão: {x: 0, y: 0}",
  MISSING_ENTITIES: "entities ausente, criando array vazio",
  
  // Entity warnings
  ADDING_MISSING_ENTITY: (entityType: string) => `Adicionando entidade ausente: ${entityType}`,
  ENTITY_MISSING_ID: (index: number) => `Entidade ${index} sem ID, gerando ID automático`,
  ENTITY_MISSING_POSITION: (id: string) => `Entidade ${id} sem position, usando padrão`,
  ENTITY_MISSING_SIZE: (id: string) => `Entidade ${id} sem size, usando padrão`,
  ENTITY_MISSING_VISUAL: (id: string) => `Entidade ${id} sem visual, criando visual padrão`,
  
  // System warnings
  INVALID_SYSTEM_NAME: (system: string) => `Nome de sistema inválido: ${system}`,
  DUPLICATE_SYSTEM: (system: string) => `Sistema duplicado removido: ${system}`,
  
  // Success messages
  NORMALIZATION_COMPLETE: (changes: number, warnings: number) => 
    `Normalização completa: ${changes} alterações, ${warnings} avisos`
} as const;

// Validation rules
export const VALIDATION_RULES = {
  // Required fields
  REQUIRED_FIELDS: ["gameType", "title", "description", "systems", "scene"] as const,
  
  // Field type requirements
  FIELD_TYPES: {
    gameType: "string",
    title: "string",
    description: "string",
    systems: "array",
    scene: "object"
  } as const,
  
  // Scene field requirements
  SCENE_FIELDS: ["gravity", "entities"] as const,
  
  // Gravity field requirements
  GRAVITY_FIELDS: ["x", "y"] as const,
  
  // Entity field requirements
  ENTITY_REQUIRED_FIELDS: ["id", "type", "x", "y", "w", "h"] as const,
  
  // Entity field types
  ENTITY_FIELD_TYPES: {
    id: "string",
    type: "string",
    x: "number",
    y: "number",
    w: "number",
    h: "number"
  } as const
} as const;

// Mapping from snake_case/lowercase aliases to canonical PascalCase system names.
// The AI often generates systems in snake_case (e.g. "physics_arcade", "input_system").
// This map normalizes them to the canonical name before validation.
export const SYSTEM_NAME_ALIASES: Record<string, ValidSystem> = {
  // PhysicsSystem
  physics: "PhysicsSystem",
  physics_system: "PhysicsSystem",
  physics_arcade: "PhysicsSystem",
  physics_2d: "PhysicsSystem",
  physicssystem: "PhysicsSystem",

  // CollisionSystem
  collision: "CollisionSystem",
  collision_system: "CollisionSystem",
  collisionsystem: "CollisionSystem",

  // AnimationSystem
  animation: "AnimationSystem",
  animation_system: "AnimationSystem",
  animationsystem: "AnimationSystem",

  // AudioSystem
  audio: "AudioSystem",
  audio_system: "AudioSystem",
  audiosystem: "AudioSystem",
  sound: "AudioSystem",
  sound_system: "AudioSystem",

  // CameraSystem
  camera: "CameraSystem",
  camera_system: "CameraSystem",
  camera_sideview: "CameraSystem",
  camera_2d: "CameraSystem",
  camerasystem: "CameraSystem",

  // InputSystem
  input: "InputSystem",
  input_system: "InputSystem",
  inputsystem: "InputSystem",

  // UISystem
  ui: "UISystem",
  ui_system: "UISystem",
  hud: "UISystem",
  hud_system: "UISystem",
  uisystem: "UISystem",

  // ScoreSystem
  score: "ScoreSystem",
  score_system: "ScoreSystem",
  scoresystem: "ScoreSystem",

  // TimerSystem
  timer: "TimerSystem",
  timer_system: "TimerSystem",
  timersystem: "TimerSystem",

  // SpawnerSystem
  spawner: "SpawnerSystem",
  spawner_system: "SpawnerSystem",
  spawn: "SpawnerSystem",
  spawn_system: "SpawnerSystem",
  spawnersystem: "SpawnerSystem",

  // ParticleSystem
  particle: "ParticleSystem",
  particle_system: "ParticleSystem",
  particlesystem: "ParticleSystem",

  // AISystem
  ai: "AISystem",
  ai_system: "AISystem",
  aisystem: "AISystem",

  // SaveSystem
  save: "SaveSystem",
  save_system: "SaveSystem",
  savesystem: "SaveSystem",

  // TimeSystem
  time: "TimeSystem",
  time_system: "TimeSystem",
  timesystem: "TimeSystem",

  // FSMSystem
  fsm: "FSMSystem",
  fsm_system: "FSMSystem",
  fsmsystem: "FSMSystem",
  game_state: "FSMSystem",
  game_state_system: "FSMSystem",
  gamestate: "FSMSystem",
  gamestatesystem: "FSMSystem",

  // VehicleSystem
  vehicle: "VehicleSystem",
  vehicle_system: "VehicleSystem",
  vehiclesystem: "VehicleSystem",

  // ViewportSystem
  viewport: "ViewportSystem",
  viewport_system: "ViewportSystem",
  viewportsystem: "ViewportSystem",

  // DialogueSystem
  dialogue: "DialogueSystem",
  dialogue_system: "DialogueSystem",
  dialog: "DialogueSystem",
  dialog_system: "DialogueSystem",
  dialoguesystem: "DialogueSystem",

  // InventorySystem
  inventory: "InventorySystem",
  inventory_system: "InventorySystem",
  inventorysystem: "InventorySystem",

  // CameraSystem (render aliases)
  render: "CameraSystem",
  render_2d: "CameraSystem",
  renderer: "CameraSystem",
} as const;

// Helper functions
export function isValidSystem(system: string): system is ValidSystem {
  return VALID_SYSTEMS.includes(system as ValidSystem);
}

/**
 * Normalizes a system name to its canonical PascalCase form.
 * Handles snake_case, lowercase, and common aliases generated by the AI.
 * Returns the original string if no mapping is found (to preserve unknown custom systems).
 */
export function normalizeSystemName(system: string): string {
  const trimmed = system.trim();

  // Already valid PascalCase — return as-is
  if (isValidSystem(trimmed)) {
    return trimmed;
  }

  // Try alias lookup (case-insensitive)
  const alias = SYSTEM_NAME_ALIASES[trimmed.toLowerCase()];
  if (alias) {
    return alias;
  }

  return trimmed;
}

export function getEntityVisualConfig(entityType: string): typeof ENTITY_VISUAL_MAPPING[keyof typeof ENTITY_VISUAL_MAPPING] {
  const type = entityType.toLowerCase();
  return ENTITY_VISUAL_MAPPING[type] || {
    shape: "rect" as OrdaxVisualShape,
    color: "hsl(0, 0%, 50%)",
    size: { width: 32, height: 32 }
  };
}

export function getDefaultVisualShapeForGameType(gameType: string): OrdaxVisualShape {
  return GAME_TYPE_VISUAL_MAPPING[gameType] || "rect";
}

export function generateEntityId(entityType: string, index: number = 1): string {
  const normalizedType = entityType.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${normalizedType}_${index}`;
}

export function getDefaultPositionForIndex(index: number): { x: number; y: number } {
  const row = Math.floor(index / 5);
  const col = index % 5;
  return {
    x: 100 + col * 150,
    y: 100 + row * 150
  };
}