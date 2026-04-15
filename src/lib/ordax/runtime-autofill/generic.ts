/**
 * Generic Runtime Autofill
 * 
 * Genre-agnostic autofill that ensures ANY game spec has the minimum
 * required entities and systems to be playable, based on genre contracts.
 * 
 * This replaces genre-specific autofills with a single, scalable solution.
 */

import type { OrdaxSpec, OrdaxEntity } from "../types";

// ============================================================================
// GENRE REQUIREMENTS REGISTRY
// ============================================================================

type GenreRequirements = {
  systems: string[];
  entities: EntityTemplate[];
  playerProps: Record<string, unknown>;
};

type EntityTemplate = {
  type: string;
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props: Record<string, unknown>;
};

/**
 * Registry of minimum requirements per genre.
 * Each genre defines:
 * - Required systems
 * - Required entity templates (with sensible defaults)
 * - Player props that must exist
 */
const GENRE_REQUIREMENTS: Record<string, GenreRequirements> = {
  shooter: {
    systems: ["PhysicsSystem", "CollisionSystem", "AISystem", "GameStateSystem", "SpawnerSystem", "ScoreSystem", "ParticleSystem", "CameraSystem", "TimerSystem", "UISystem", "AnimationSystem", "AudioSystem"],
    entities: [
      { type: "enemy", id: "enemy_default", x: 400, y: 80, w: 24, h: 24, props: { health: 1, speed: 60, damage: 10, aiType: "chase" } },
      { type: "spawner", id: "spawner_default", x: 400, y: -20, w: 720, h: 1, props: { spawnRate: 1.5, spawnType: "enemy", maxSpawned: 8, spawnArea: { xMin: 40, xMax: 760, y: -20 } } },
    ],
    playerProps: { speed: 200, health: 100, maxHealth: 100, fireRate: 0.25, bulletSpeed: 500, damage: 25 },
  },
  topdown: {
    systems: ["PhysicsSystem", "CollisionSystem", "AISystem", "GameStateSystem", "SpawnerSystem", "ScoreSystem", "ParticleSystem", "CameraSystem", "TimerSystem", "UISystem", "AnimationSystem", "AudioSystem"],
    entities: [
      { type: "enemy", id: "enemy_default", x: 400, y: 80, w: 24, h: 24, props: { health: 1, speed: 60, damage: 10, aiType: "chase" } },
      { type: "spawner", id: "spawner_default", x: 400, y: -20, w: 720, h: 1, props: { spawnRate: 1.5, spawnType: "enemy", maxSpawned: 8, spawnArea: { xMin: 40, xMax: 760, y: -20 } } },
    ],
    playerProps: { speed: 200, health: 100, maxHealth: 100, fireRate: 0.25, bulletSpeed: 500, damage: 25 },
  },
  racing: {
    systems: ["PhysicsSystem", "CollisionSystem", "TimerSystem", "GameStateSystem", "SpawnerSystem", "CameraSystem", "UISystem", "ScoreSystem", "AnimationSystem", "AudioSystem"],
    entities: [
      { type: "enemy", id: "npc_car_1", x: 300, y: 100, w: 30, h: 50, props: { speed: 120, aiType: "patrol", variant: "scout" } },
      { type: "spawner", id: "spawner_default", x: 400, y: -40, w: 400, h: 1, props: { spawnRate: 2, spawnType: "enemy", maxSpawned: 5, spawnArea: { xMin: 200, xMax: 600, y: -40 } } },
    ],
    playerProps: { speed: 250, health: 100, maxHealth: 100, acceleration: 300, maxSpeed: 400 },
  },
  platformer: {
    systems: ["PhysicsSystem", "CollisionSystem", "GameStateSystem", "UISystem", "ScoreSystem", "TimerSystem", "AnimationSystem", "AudioSystem"],
    entities: [
      { type: "platform", id: "platform_1", x: 400, y: 500, w: 200, h: 20, props: { solid: true } },
      { type: "platform", id: "platform_2", x: 250, y: 400, w: 120, h: 20, props: { solid: true } },
      { type: "platform", id: "platform_3", x: 550, y: 300, w: 120, h: 20, props: { solid: true } },
    ],
    playerProps: { speed: 180, health: 100, maxHealth: 100, jumpForce: 350, gravity: 800 },
  },
  puzzle: {
    systems: ["TimerSystem", "GameStateSystem", "CollisionSystem", "UISystem", "ScoreSystem", "AnimationSystem", "AudioSystem"],
    entities: [],
    playerProps: { speed: 150, health: 100, maxHealth: 100 },
  },
  sports: {
    systems: ["PhysicsSystem", "CollisionSystem", "GameStateSystem", "ScoreSystem", "UISystem", "TimerSystem", "AnimationSystem", "AudioSystem"],
    entities: [
      { type: "npc", id: "opponent_1", x: 400, y: 100, w: 24, h: 24, props: { speed: 120, aiType: "chase", team: "opponent" } },
    ],
    playerProps: { speed: 200, health: 100, maxHealth: 100 },
  },
};

/** Fallback requirements for unknown genres */
const DEFAULT_REQUIREMENTS: GenreRequirements = {
  systems: ["PhysicsSystem", "CollisionSystem", "GameStateSystem"],
  entities: [],
  playerProps: { speed: 200, health: 100, maxHealth: 100 },
};

// ============================================================================
// AUTOFILL RESULT
// ============================================================================

export interface GenericAutofillResult {
  spec: OrdaxSpec;
  changes: string[];
  wasModified: boolean;
}

// ============================================================================
// GENERIC AUTOFILL
// ============================================================================

/**
 * Genre-agnostic autofill.
 * Inspects the spec's gameType and fills in missing systems, entities,
 * and player props using the genre requirements registry.
 * 
 * Works for ANY genre — known genres get specific defaults,
 * unknown genres get a minimal playable baseline.
 */
export function autofillGeneric(spec: OrdaxSpec): GenericAutofillResult {
  const changes: string[] = [];
  const result = structuredClone(spec);

  const genre = (result.gameType ?? result.metadata?.genre ?? "").toLowerCase();
  const requirements = GENRE_REQUIREMENTS[genre] ?? DEFAULT_REQUIREMENTS;

  // 1. Ensure scene exists
  if (!result.scene) {
    result.scene = { gravity: { x: 0, y: 0 }, entities: [] };
    changes.push("✅ Scene criada");
  }
  if (!result.scene.entities) {
    result.scene.entities = [];
  }

  // 2. Ensure systems
  if (!result.systems) result.systems = [];
  for (const sys of requirements.systems) {
    if (!result.systems.includes(sys)) {
      result.systems.push(sys);
      changes.push(`✅ Sistema adicionado: ${sys}`);
    }
  }

  // 3. Ensure player exists with required props
  const existingPlayer = result.scene.entities.find(
    (e) => e.type === "player" || e.id === "player"
  );
  if (!existingPlayer) {
    const player: OrdaxEntity = {
      id: "player",
      type: "player",
      x: 400,
      y: 500,
      w: 32,
      h: 32,
      props: { ...requirements.playerProps },
    };
    result.scene.entities.push(player);
    changes.push("✅ Player adicionado");
  } else {
    // Fill missing player props
    if (!existingPlayer.props) existingPlayer.props = {};
    let added = 0;
    for (const [key, value] of Object.entries(requirements.playerProps)) {
      if (!(key in existingPlayer.props)) {
        existingPlayer.props[key] = value;
        added++;
      }
    }
    if (added > 0) changes.push(`✅ ${added} props adicionadas ao player`);
  }

  // 4. Ensure required entity types exist
  const existingTypes = new Set(result.scene.entities.map((e) => e.type));
  for (const template of requirements.entities) {
    if (!existingTypes.has(template.type)) {
      const entity: OrdaxEntity = {
        id: template.id,
        type: template.type,
        x: template.x,
        y: template.y,
        w: template.w,
        h: template.h,
        props: { ...template.props },
      };
      result.scene.entities.push(entity);
      existingTypes.add(template.type);
      changes.push(`✅ Entidade adicionada: ${template.type} (${template.id})`);
    }
  }

  // 5. Ensure visual exists
  if (!result.visual) {
    result.visual = {
      theme: {
        background: "hsl(0, 0%, 4%)",
        primary: "hsl(180, 80%, 50%)",
        accent: "hsl(300, 70%, 50%)",
      },
    };
    changes.push("✅ Visual theme adicionado");
  }

  // 6. Ensure spawner config exists for genres that need enemies
  const hasEnemyRequirement = requirements.entities.some((e) => e.type === "enemy");
  const hasSpawner = result.scene.entities.some((e) => e.type === "spawner");
  if (hasEnemyRequirement && !hasSpawner) {
    const spawnerReq = requirements.entities.find((e) => e.type === "spawner");
    if (spawnerReq) {
      result.scene.entities.push({
        id: spawnerReq.id,
        type: "spawner",
        x: spawnerReq.x,
        y: spawnerReq.y,
        w: spawnerReq.w,
        h: spawnerReq.h,
        props: { ...spawnerReq.props },
      });
      changes.push("✅ Spawner adicionado para gerar inimigos");
    }
  }

  return {
    spec: result,
    changes,
    wasModified: changes.length > 0,
  };
}
