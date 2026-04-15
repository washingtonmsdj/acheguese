import { describe, expect, it } from "vitest";

import { createHeightfieldTerrainQuery } from "@/lib/ordax/terrain";

describe("Heightfield terrain query SSOT", () => {
  const terrain = createHeightfieldTerrainQuery({
    seed: 1337,
    size: 300,
    minHeight: 0,
    maxHeight: 18,
    seaLevel: -5,
    bottomY: -28,
  });

  it("clamps out-of-bounds samples to terrain limits", () => {
    const sample = terrain.sample(999, -999);

    expect(sample.x).toBe(terrain.halfSize);
    expect(sample.z).toBe(-terrain.halfSize);
    expect(sample.height).toBe(terrain.getHeightAt(sample.x, sample.z));
  });

  it("uses the same height rule for solid checks and surface sampling", () => {
    const sample = terrain.sample(24, -12);

    expect(terrain.isSolid(sample.x, sample.height - 0.01, sample.z)).toBe(true);
    expect(terrain.isSolid(sample.x, sample.height + 0.01, sample.z)).toBe(false);
  });

  it("honors the configured minimum terrain height", () => {
    const raisedTerrain = createHeightfieldTerrainQuery({
      seed: 1337,
      size: 300,
      minHeight: 6,
      maxHeight: 18,
      seaLevel: -5,
      bottomY: -28,
    });

    expect(raisedTerrain.getHeightAt(0, 0)).toBeGreaterThanOrEqual(6);
  });

  it("does not treat out-of-bounds space as solid terrain", () => {
    const outsideX = terrain.halfSize + 50;
    const outsideZ = terrain.halfSize + 10;

    expect(terrain.containsXZ(outsideX, outsideZ)).toBe(false);
    expect(terrain.isSolid(outsideX, -100, outsideZ)).toBe(false);
  });

  it("supports dynamic terrain deformation for ground interaction", () => {
    const deformable = createHeightfieldTerrainQuery({
      seed: 1337,
      size: 300,
      minHeight: 0,
      maxHeight: 18,
      seaLevel: -5,
      bottomY: -28,
    });
    const x = 0;
    const z = 0;
    const before = deformable.getHeightAt(x, z);

    deformable.deformAt(x, z, { radius: 6, depth: 0.2 });
    const after = deformable.getHeightAt(x, z);

    expect(deformable.getDeformationAt(x, z)).toBeLessThan(0);
    expect(after).toBeLessThan(before);
    expect(deformable.getDeformationVersion()).toBeGreaterThan(0);
  });

  it("recovers terrain deformation over time", () => {
    const deformable = createHeightfieldTerrainQuery({
      seed: 1337,
      size: 300,
      minHeight: 0,
      maxHeight: 18,
      seaLevel: -5,
      bottomY: -28,
    });
    const x = 12;
    const z = -8;

    deformable.deformAt(x, z, { radius: 5, depth: 0.25 });
    const depressed = deformable.getHeightAt(x, z);

    deformable.advance(12);
    const recovered = deformable.getHeightAt(x, z);

    expect(recovered).toBeGreaterThan(depressed);
  });
});
