import { describe, it, expect } from "vitest";
import { resolveCanonicalGenre } from "./normalize-config";

describe("resolveCanonicalGenre", () => {
  // ── Direct canonical types ──
  it.each([
    "shooter", "platformer", "racing", "topdown", "puzzle", "sports",
  ])("returns canonical type '%s' as-is", (genre) => {
    expect(resolveCanonicalGenre(genre)).toBe(genre);
  });

  // ── Shooter aliases ──
  it.each([
    "space_shooter", "shmup", "shoot-em-up", "shootemup", "bullet_hell",
    "bullet-hell", "spaceshooter", "space-shooter", "twin-stick",
    "twin_stick", "arcade_shooter", "arcade-shooter", "scrolling_shooter",
    "scrolling-shooter", "vertical_shooter", "horizontal_shooter",
    "galaga", "asteroids", "invaders", "schmup", "stg",
  ])("maps shooter alias '%s' → 'shooter'", (alias) => {
    expect(resolveCanonicalGenre(alias)).toBe("shooter");
  });

  // ── Platformer aliases ──
  it.each([
    "platform", "sidescroller", "side-scroller", "side_scroller",
    "metroidvania", "run-and-jump", "run_and_jump", "2d-platformer",
    "2d_platformer", "runner", "endless_runner", "endless-runner",
    "jump_and_run", "jump-and-run",
  ])("maps platformer alias '%s' → 'platformer'", (alias) => {
    expect(resolveCanonicalGenre(alias)).toBe("platformer");
  });

  // ── Racing aliases ──
  it.each([
    "race", "driving", "racer", "kart", "kart-racing", "kart_racing",
    "car_game", "car-game", "drift", "corrida", "velocidade",
  ])("maps racing alias '%s' → 'racing'", (alias) => {
    expect(resolveCanonicalGenre(alias)).toBe("racing");
  });

  // ── Top-down aliases ──
  it.each([
    "top-down", "top_down", "overhead", "top-down-shooter",
    "top_down_shooter", "birds_eye", "birds-eye", "birdseye",
    "isometric", "top-view", "top_view", "dungeon_crawler",
    "dungeon-crawler", "rpg_topdown", "zelda",
  ])("maps topdown alias '%s' → 'topdown'", (alias) => {
    expect(resolveCanonicalGenre(alias)).toBe("topdown");
  });

  // ── Puzzle aliases ──
  it.each([
    "logic", "brain", "match3", "match-3", "match_3", "tetris",
    "sokoban", "word_game", "word-game", "brain_teaser", "brain-teaser",
    "quebra_cabeca", "logica",
  ])("maps puzzle alias '%s' → 'puzzle'", (alias) => {
    expect(resolveCanonicalGenre(alias)).toBe("puzzle");
  });

  // ── Sports aliases ──
  it.each([
    "sport", "football", "soccer", "basketball", "tennis", "baseball",
    "golf", "volleyball", "hockey", "futebol", "basquete", "esporte",
  ])("maps sports alias '%s' → 'sports'", (alias) => {
    expect(resolveCanonicalGenre(alias)).toBe("sports");
  });

  // ── Case insensitivity ──
  it("is case-insensitive", () => {
    expect(resolveCanonicalGenre("SPACE_SHOOTER")).toBe("shooter");
    expect(resolveCanonicalGenre("Platformer")).toBe("platformer");
    expect(resolveCanonicalGenre("RACING")).toBe("racing");
  });

  // ── Edge cases ──
  it("returns 'unknown' for undefined", () => {
    expect(resolveCanonicalGenre(undefined)).toBe("unknown");
  });

  it("returns input unchanged for truly unknown genres", () => {
    expect(resolveCanonicalGenre("mmorpg")).toBe("mmorpg");
    expect(resolveCanonicalGenre("visual_novel")).toBe("visual_novel");
  });

  it("handles whitespace", () => {
    expect(resolveCanonicalGenre("  shooter  ")).toBe("shooter");
    expect(resolveCanonicalGenre(" space_shooter ")).toBe("shooter");
  });
});
