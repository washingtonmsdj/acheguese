import { describe, it, expect } from "vitest";
import { normalizeOrdaxSpec } from "./normalize";

describe("normalizeOrdaxSpec – genre-to-background integration", () => {
  // Helper: build a minimal AI-like spec with a given gameType
  const makeRawSpec = (gameType: string) => ({
    gameType,
    title: "Test Game",
    description: "A test",
    systems: ["InputSystem"],
    scene: { gravity: { x: 0, y: 0 }, entities: [] },
  });

  // ── Shooter aliases → starfield + nebula ──
  it.each([
    "shooter",
    "space_shooter",
    "shmup",
    "bullet_hell",
    "spaceshooter",
  ])("gameType '%s' produces starfield+nebula layers", (gt) => {
    const result = normalizeOrdaxSpec(makeRawSpec(gt), { gameType: "shooter" });
    const layers = result.visual?.background?.layers ?? [];
    const types = layers.map((l: { type: string }) => l.type);

    expect(types).toContain("starfield");
    expect(types).toContain("nebula");
  });

  it("gameType 'space_shooter' without hint still resolves via extractBackground", () => {
    // Even without the gameType hint, the normalize-generic extractBackground
    // should resolve 'space_shooter' → 'shooter' layers via resolveCanonicalGenre
    const result = normalizeOrdaxSpec(makeRawSpec("space_shooter"));
    const layers = result.visual?.background?.layers ?? [];
    const types = layers.map((l: { type: string }) => l.type);

    // Should have rich layers, not just 'solid'
    const hasRich = types.some((t: string) => t === "starfield" || t === "nebula" || t === "gradient");
    expect(hasRich).toBe(true);
  });

  // ── Racing → gradient ──
  it("gameType 'racing' produces gradient layer", () => {
    const result = normalizeOrdaxSpec(makeRawSpec("racing"));
    const layers = result.visual?.background?.layers ?? [];
    const types = layers.map((l: { type: string }) => l.type);

    expect(types).toContain("gradient");
  });

  it("gameType 'kart' with hint 'racing' produces gradient layer", () => {
    const result = normalizeOrdaxSpec(makeRawSpec("kart"), { gameType: "racing" });
    const layers = result.visual?.background?.layers ?? [];
    const types = layers.map((l: { type: string }) => l.type);

    expect(types).toContain("gradient");
  });

  // ── Platformer → gradient ──
  it("gameType 'platformer' produces gradient layer", () => {
    const result = normalizeOrdaxSpec(makeRawSpec("platformer"));
    const layers = result.visual?.background?.layers ?? [];
    const types = layers.map((l: { type: string }) => l.type);

    expect(types).toContain("gradient");
  });

  // ── Existing rich layers are preserved ──
  it("preserves existing starfield layers and does not duplicate", () => {
    const spec = {
      ...makeRawSpec("shooter"),
      visual: {
        background: {
          layers: [
            { type: "starfield", density: 500, speedY: 50, parallax: 0.4 },
          ],
        },
      },
    };
    const result = normalizeOrdaxSpec(spec);
    const layers = result.visual?.background?.layers ?? [];
    const starfields = layers.filter((l: { type: string }) => l.type === "starfield");

    expect(starfields.length).toBe(1);
    expect((starfields[0] as { density: number }).density).toBe(500); // preserved original
  });

  // ── Unknown genre gets solid fallback ──
  it("unknown genre gets at least a solid layer", () => {
    const result = normalizeOrdaxSpec(makeRawSpec("totally_unknown_genre"));
    const layers = result.visual?.background?.layers ?? [];

    expect(layers.length).toBeGreaterThan(0);
  });

  // ── gameType is canonicalized on output ──
  it("non-canonical gameType is resolved in output", () => {
    const result = normalizeOrdaxSpec(makeRawSpec("space_shooter"));
    // Should be resolved to canonical 'shooter'
    expect(result.gameType).toBe("shooter");
  });

  it("alias 'kart' is resolved to 'racing' in output", () => {
    const result = normalizeOrdaxSpec(makeRawSpec("kart"));
    expect(result.gameType).toBe("racing");
  });
});
