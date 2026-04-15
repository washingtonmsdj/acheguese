/**
 * Generic Autofill - Unit Tests
 * Covers all supported genres and edge cases.
 */

import { describe, it, expect } from "vitest";
import { autofillGeneric } from "./generic";
import type { OrdaxSpec } from "../types";

function makeMinimalSpec(gameType: string): OrdaxSpec {
  return {
    gameType,
    title: `Test ${gameType}`,
    scene: { gravity: { x: 0, y: 0 }, entities: [] },
  } as OrdaxSpec;
}

function makeSpecWithPlayer(gameType: string): OrdaxSpec {
  return {
    gameType,
    title: `Test ${gameType}`,
    scene: {
      gravity: { x: 0, y: 0 },
      entities: [
        { id: "player", type: "player", x: 400, y: 500, w: 32, h: 32, props: {} },
      ],
    },
  } as OrdaxSpec;
}

// ============================================================================
// SHOOTER
// ============================================================================

describe("autofillGeneric – shooter", () => {
  it("adds all required systems", () => {
    const { spec, wasModified } = autofillGeneric(makeMinimalSpec("shooter"));
    expect(wasModified).toBe(true);
    expect(spec.systems).toContain("PhysicsSystem");
    expect(spec.systems).toContain("CollisionSystem");
    expect(spec.systems).toContain("AISystem");
    expect(spec.systems).toContain("GameStateSystem");
    expect(spec.systems).toContain("SpawnerSystem");
    expect(spec.systems).toContain("CameraSystem");
    expect(spec.systems).toContain("TimerSystem");
    expect(spec.systems).toContain("UISystem");
  });

  it("adds player with shooter props", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("shooter"));
    const player = spec.scene.entities.find((e) => e.type === "player");
    expect(player).toBeDefined();
    expect(player!.props?.fireRate).toBeDefined();
    expect(player!.props?.bulletSpeed).toBeDefined();
    expect(player!.props?.health).toBe(100);
  });

  it("adds enemy and spawner", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("shooter"));
    expect(spec.scene.entities.some((e) => e.type === "enemy")).toBe(true);
    expect(spec.scene.entities.some((e) => e.type === "spawner")).toBe(true);
  });

  it("spawner has positive width for spawn area calculation", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("shooter"));
    const spawner = spec.scene.entities.find((e) => e.type === "spawner");
    expect(spawner).toBeDefined();
    expect(spawner!.w).toBeGreaterThan(0);
  });

  it("fills missing player props without replacing existing ones", () => {
    const input = makeSpecWithPlayer("shooter");
    input.scene.entities[0].props = { speed: 999, health: 50 };
    const { spec } = autofillGeneric(input);
    const player = spec.scene.entities.find((e) => e.type === "player")!;
    expect(player.props?.speed).toBe(999); // kept
    expect(player.props?.health).toBe(50); // kept
    expect(player.props?.fireRate).toBeDefined(); // added
    expect(player.props?.bulletSpeed).toBeDefined(); // added
  });

  it("does not duplicate systems already present", () => {
    const input = makeMinimalSpec("shooter");
    input.systems = ["PhysicsSystem", "CollisionSystem"];
    const { spec } = autofillGeneric(input);
    const physicsCount = spec.systems!.filter((s) => s === "PhysicsSystem").length;
    expect(physicsCount).toBe(1);
  });
});

// ============================================================================
// TOPDOWN
// ============================================================================

describe("autofillGeneric – topdown", () => {
  it("adds enemy and AI system", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("topdown"));
    expect(spec.systems).toContain("AISystem");
    expect(spec.scene.entities.some((e) => e.type === "enemy")).toBe(true);
  });

  it("adds spawner for enemies", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("topdown"));
    expect(spec.scene.entities.some((e) => e.type === "spawner")).toBe(true);
  });
});

// ============================================================================
// RACING
// ============================================================================

describe("autofillGeneric – racing", () => {
  it("adds TimerSystem and SpawnerSystem", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("racing"));
    expect(spec.systems).toContain("TimerSystem");
    expect(spec.systems).toContain("SpawnerSystem");
  });

  it("adds NPC car entity", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("racing"));
    expect(spec.scene.entities.some((e) => e.type === "enemy")).toBe(true);
  });

  it("adds racing-specific player props", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("racing"));
    const player = spec.scene.entities.find((e) => e.type === "player")!;
    expect(player.props?.acceleration).toBeDefined();
    expect(player.props?.maxSpeed).toBeDefined();
  });
});

// ============================================================================
// PLATFORMER
// ============================================================================

describe("autofillGeneric – platformer", () => {
  it("adds PhysicsSystem and CollisionSystem", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("platformer"));
    expect(spec.systems).toContain("PhysicsSystem");
    expect(spec.systems).toContain("CollisionSystem");
  });

  it("adds platform entities", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("platformer"));
    const platforms = spec.scene.entities.filter((e) => e.type === "platform");
    expect(platforms.length).toBeGreaterThanOrEqual(1);
  });

  it("adds jumpForce to player", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("platformer"));
    const player = spec.scene.entities.find((e) => e.type === "player")!;
    expect(player.props?.jumpForce).toBeDefined();
  });

  it("does not add enemies or spawners", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("platformer"));
    expect(spec.scene.entities.some((e) => e.type === "enemy")).toBe(false);
    expect(spec.scene.entities.some((e) => e.type === "spawner")).toBe(false);
  });
});

// ============================================================================
// PUZZLE
// ============================================================================

describe("autofillGeneric – puzzle", () => {
  it("adds TimerSystem", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("puzzle"));
    expect(spec.systems).toContain("TimerSystem");
    expect(spec.systems).toContain("GameStateSystem");
  });

  it("adds player with basic props", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("puzzle"));
    const player = spec.scene.entities.find((e) => e.type === "player");
    expect(player).toBeDefined();
    expect(player!.props?.speed).toBeDefined();
  });

  it("does not add enemies", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("puzzle"));
    expect(spec.scene.entities.some((e) => e.type === "enemy")).toBe(false);
  });
});

// ============================================================================
// SPORTS
// ============================================================================

describe("autofillGeneric – sports", () => {
  it("adds ScoreSystem and opponent NPC", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("sports"));
    expect(spec.systems).toContain("ScoreSystem");
    expect(spec.scene.entities.some((e) => e.type === "npc")).toBe(true);
  });
});

// ============================================================================
// UNKNOWN GENRE (fallback)
// ============================================================================

describe("autofillGeneric – unknown genre", () => {
  it("uses default requirements for unknown genres", () => {
    const { spec, wasModified } = autofillGeneric(makeMinimalSpec("custom_rpg"));
    expect(wasModified).toBe(true);
    expect(spec.systems).toContain("PhysicsSystem");
    expect(spec.systems).toContain("CollisionSystem");
    expect(spec.systems).toContain("GameStateSystem");
  });

  it("adds player with basic props", () => {
    const { spec } = autofillGeneric(makeMinimalSpec("my_new_genre"));
    const player = spec.scene.entities.find((e) => e.type === "player");
    expect(player).toBeDefined();
    expect(player!.props?.health).toBe(100);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe("autofillGeneric – edge cases", () => {
  it("handles spec with no scene", () => {
    const input = { gameType: "shooter", title: "No Scene" } as Record<string, unknown>;
    const { spec } = autofillGeneric(input);
    expect(spec.scene).toBeDefined();
    expect(spec.scene.entities.length).toBeGreaterThan(0);
  });

  it("handles spec with no systems array", () => {
    const input = makeMinimalSpec("shooter");
    delete input.systems;
    const { spec } = autofillGeneric(input);
    expect(spec.systems!.length).toBeGreaterThan(0);
  });

  it("returns wasModified=false when spec is already complete", () => {
    const { spec: filled } = autofillGeneric(makeMinimalSpec("puzzle"));
    const { wasModified } = autofillGeneric(filled);
    expect(wasModified).toBe(false);
  });

  it("does not mutate original spec", () => {
    const input = makeMinimalSpec("shooter");
    const entitiesBefore = input.scene.entities.length;
    autofillGeneric(input);
    expect(input.scene.entities.length).toBe(entitiesBefore);
  });

  it("uses metadata.genre as fallback when gameType is missing", () => {
    const input = {
      title: "Metadata Genre",
      metadata: { genre: "shooter", title: "X", description: "Y" },
      scene: { gravity: { x: 0, y: 0 }, entities: [] },
    } as OrdaxSpec;
    const { spec } = autofillGeneric(input);
    expect(spec.systems).toContain("AISystem");
    expect(spec.scene.entities.some((e) => e.type === "enemy")).toBe(true);
  });

  it("handles empty string gameType gracefully", () => {
    const { spec } = autofillGeneric(makeMinimalSpec(""));
    expect(spec.systems).toContain("PhysicsSystem"); // default fallback
  });
});
