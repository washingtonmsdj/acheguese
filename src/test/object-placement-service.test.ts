import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { ObjectPlacementService } from "@/lib/ordax/terrain/ObjectPlacementService";
import { createHeightfieldTerrainQuery } from "@/lib/ordax/terrain";
import type { TerrainQuery } from "@/lib/ordax/physics/PhysicsWorld";

// ── Helpers ──────────────────────────────────────────────────────────────────

function flatTerrain(height: number): TerrainQuery {
  return {
    getHeightAt: () => height,
    isSolid: (_x, y) => y < height,
    containsXZ: () => true,
  };
}

function slopedTerrain(slopePerMeter: number): TerrainQuery {
  return {
    getHeightAt: (x) => x * slopePerMeter,
    isSolid: () => false,
    containsXZ: () => true,
  };
}

function boundedTerrain(halfSize: number): TerrainQuery {
  return {
    getHeightAt: () => 0,
    isSolid: () => false,
    containsXZ: (x, z) => Math.abs(x) <= halfSize && Math.abs(z) <= halfSize,
  };
}

// ── Snap to Ground ────────────────────────────────────────────────────────────

describe("ObjectPlacementService — snap to ground", () => {
  it("posiciona objeto exatamente na altura do terreno plano", () => {
    const svc = new ObjectPlacementService({ terrain: flatTerrain(5) });
    const result = svc.calculate({ x: 0, z: 0, footprintWidth: 4, footprintDepth: 4 });

    expect(result.accepted).toBe(true);
    expect(result.groundHeight).toBeCloseTo(5, 5);
    expect(result.baseY).toBeCloseTo(5, 5);
  });

  it("aplica posição ao Object3D corretamente", () => {
    const svc = new ObjectPlacementService({ terrain: flatTerrain(3) });
    const obj = new THREE.Group();
    svc.apply(obj, { x: 10, z: -5, footprintWidth: 2, footprintDepth: 2 });

    expect(obj.position.x).toBeCloseTo(10, 5);
    expect(obj.position.y).toBeCloseTo(3, 5);
    expect(obj.position.z).toBeCloseTo(-5, 5);
  });
});

// ── Alinhamento por múltiplos pontos ─────────────────────────────────────────

describe("ObjectPlacementService — alinhamento por múltiplos pontos", () => {
  it("terreno plano produz normal (0,1,0) e rotação zero", () => {
    const svc = new ObjectPlacementService({ terrain: flatTerrain(0) });
    const result = svc.calculate({ x: 0, z: 0, footprintWidth: 6, footprintDepth: 6 });

    expect(result.accepted).toBe(true);
    expect(result.terrainNormal.y).toBeCloseTo(1, 3);
    expect(result.terrainNormal.x).toBeCloseTo(0, 3);
    expect(result.terrainNormal.z).toBeCloseTo(0, 3);
    expect(result.alignedRotation.x).toBeCloseTo(0, 3);
    expect(result.alignedRotation.z).toBeCloseTo(0, 3);
  });

  it("terreno inclinado produz normal inclinada", () => {
    const svc = new ObjectPlacementService({ terrain: slopedTerrain(0.1), maxSlopeDeg: 45 });
    const result = svc.calculate({ x: 0, z: 0, footprintWidth: 10, footprintDepth: 10 });

    expect(result.accepted).toBe(true);
    expect(result.terrainNormal.x).toBeLessThan(0);
    expect(result.terrainNormal.y).toBeGreaterThan(0.9);
    expect(result.slopeAngle).toBeGreaterThan(0);
  });
});

// ── Limite de inclinação ──────────────────────────────────────────────────────

describe("ObjectPlacementService — limite de inclinação", () => {
  it("rejeita terreno muito inclinado (acima do maxSlopeDeg)", () => {
    const svc = new ObjectPlacementService({ terrain: slopedTerrain(1), maxSlopeDeg: 30 });
    const result = svc.calculate({ x: 0, z: 0, footprintWidth: 10, footprintDepth: 10 });

    expect(result.accepted).toBe(false);
    expect(result.rejectionReason).toBe("slope_too_steep");
  });

  it("aceita terreno dentro do limite de inclinação", () => {
    const svc = new ObjectPlacementService({ terrain: slopedTerrain(0.2), maxSlopeDeg: 30 });
    const result = svc.calculate({ x: 0, z: 0, footprintWidth: 10, footprintDepth: 10 });

    expect(result.accepted).toBe(true);
  });

  it("rejeita posição fora dos bounds do terreno", () => {
    const svc = new ObjectPlacementService({ terrain: boundedTerrain(50) });
    const result = svc.calculate({ x: 200, z: 0, footprintWidth: 4, footprintDepth: 4 });

    expect(result.accepted).toBe(false);
    expect(result.rejectionReason).toBe("out_of_bounds");
  });

  it("isValidPlacement retorna false para inclinação excessiva", () => {
    const svc = new ObjectPlacementService({ terrain: slopedTerrain(1), maxSlopeDeg: 20 });
    expect(svc.isValidPlacement({ x: 0, z: 0, footprintWidth: 8, footprintDepth: 8 })).toBe(false);
  });

  it("getSlopeDeg retorna ângulo em graus", () => {
    const svc = new ObjectPlacementService({ terrain: slopedTerrain(1), maxSlopeDeg: 90 });
    const deg = svc.getSlopeDeg(0, 0, 10, 10);
    expect(deg).toBeGreaterThan(30);
    expect(deg).toBeLessThan(60);
  });
});

// ── flattenAt no terrain ──────────────────────────────────────────────────────

describe("HeightfieldTerrainQuery — flattenAt", () => {
  it("nivela terreno inclinado para a altura alvo dentro do raio", () => {
    const terrain = createHeightfieldTerrainQuery({
      seed: 42,
      size: 200,
      minHeight: 0,
      maxHeight: 20,
      seaLevel: -5,
      bottomY: -30,
    });

    const cx = 0, cz = 0;
    const radius = 10;
    const targetHeight = 5;

    terrain.flattenAt(cx, cz, targetHeight, radius);

    // Centro deve estar próximo da altura alvo
    expect(terrain.getHeightAt(cx, cz)).toBeCloseTo(targetHeight, 0);
  });

  it("aplica falloff suave: borda externa não é afetada", () => {
    const terrain = createHeightfieldTerrainQuery({
      seed: 42,
      size: 200,
      minHeight: 0,
      maxHeight: 20,
      seaLevel: -5,
      bottomY: -30,
    });

    const cx = 0, cz = 0;
    const radius = 5;
    const falloff = 2;
    const targetHeight = 3;

    const farBefore = terrain.getHeightAt(cx + radius + falloff + 5, cz);
    terrain.flattenAt(cx, cz, targetHeight, radius, falloff);
    const farAfter = terrain.getHeightAt(cx + radius + falloff + 5, cz);

    // Ponto fora do raio + falloff não deve ser alterado
    expect(farAfter).toBeCloseTo(farBefore, 2);
  });

  it("incrementa deformationVersion após nivelar", () => {
    const terrain = createHeightfieldTerrainQuery({
      seed: 42,
      size: 200,
      minHeight: 0,
      maxHeight: 20,
      seaLevel: -5,
      bottomY: -30,
    });

    const vBefore = terrain.getDeformationVersion();
    terrain.flattenAt(0, 0, 5, 10);
    expect(terrain.getDeformationVersion()).toBeGreaterThan(vBefore);
  });
});

// ── placeWithFlatBase — padrão AAA ────────────────────────────────────────────

describe("ObjectPlacementService — placeWithFlatBase (padrão AAA)", () => {
  it("nivela o terreno e posiciona objeto com rotation X/Z zero", () => {
    const terrain = createHeightfieldTerrainQuery({
      seed: 99,
      size: 200,
      minHeight: 0,
      maxHeight: 20,
      seaLevel: -5,
      bottomY: -30,
    });

    const svc = new ObjectPlacementService({ terrain, maxSlopeDeg: 90 });
    const obj = new THREE.Group();
    obj.rotation.y = Math.PI / 4; // Orientação Y preservada

    const result = svc.placeWithFlatBase(obj, {
      x: 0, z: 0,
      footprintWidth: 10,
      footprintDepth: 10,
    });

    expect(result.accepted).toBe(true);
    // Objeto posicionado no terreno
    expect(obj.position.x).toBeCloseTo(0, 5);
    expect(obj.position.z).toBeCloseTo(0, 5);
    // Base plana: rotação X e Z devem ser zero
    expect(obj.rotation.x).toBeCloseTo(0, 5);
    expect(obj.rotation.z).toBeCloseTo(0, 5);
    // Rotação Y preservada
    expect(obj.rotation.y).toBeCloseTo(Math.PI / 4, 5);
    // slopeAngle = 0 (base nivelada)
    expect(result.slopeAngle).toBe(0);
  });

  it("estratégia max: base fica na altura do ponto mais alto", () => {
    // Terreno com protuberância: x > 0 tem altura 8, x <= 0 tem altura 2
    const heights: Record<string, number> = {};
    const terrain: TerrainQuery = {
      getHeightAt: (x) => (x > 0 ? 8 : 2),
      isSolid: () => false,
      containsXZ: () => true,
      flattenAt: (x, z, targetHeight) => {
        heights[`${x},${z}`] = targetHeight;
      },
    };

    const svc = new ObjectPlacementService({ terrain, maxSlopeDeg: 90 });
    const obj = new THREE.Group();

    svc.placeWithFlatBase(obj, { x: 0, z: 0, footprintWidth: 10, footprintDepth: 4 }, { strategy: "max" });

    // flattenAt deve ter sido chamado com targetHeight = 8 (máximo)
    expect(heights["0,0"]).toBeCloseTo(8, 1);
  });

  it("estratégia min: base fica na altura do ponto mais baixo", () => {
    const heights: Record<string, number> = {};
    const terrain: TerrainQuery = {
      getHeightAt: (x) => (x > 0 ? 8 : 2),
      isSolid: () => false,
      containsXZ: () => true,
      flattenAt: (x, z, targetHeight) => {
        heights[`${x},${z}`] = targetHeight;
      },
    };

    const svc = new ObjectPlacementService({ terrain, maxSlopeDeg: 90 });
    const obj = new THREE.Group();

    svc.placeWithFlatBase(obj, { x: 0, z: 0, footprintWidth: 10, footprintDepth: 4 }, { strategy: "min" });

    expect(heights["0,0"]).toBeCloseTo(2, 1);
  });

  it("estratégia avg: base fica na altura média", () => {
    const heights: Record<string, number> = {};
    const terrain: TerrainQuery = {
      getHeightAt: (x) => (x > 0 ? 8 : 2),
      isSolid: () => false,
      containsXZ: () => true,
      flattenAt: (x, z, targetHeight) => {
        heights[`${x},${z}`] = targetHeight;
      },
    };

    const svc = new ObjectPlacementService({ terrain, maxSlopeDeg: 90 });
    const obj = new THREE.Group();

    svc.placeWithFlatBase(obj, { x: 0, z: 0, footprintWidth: 10, footprintDepth: 4 }, { strategy: "avg" });

    // Média entre 2 e 8 = 5 (aproximado, depende da amostragem)
    expect(heights["0,0"]).toBeGreaterThan(2);
    expect(heights["0,0"]).toBeLessThan(8);
  });

  it("dryRun não move o objeto nem chama flattenAt", () => {
    let flattenCalled = false;
    const terrain: TerrainQuery = {
      getHeightAt: () => 5,
      isSolid: () => false,
      containsXZ: () => true,
      flattenAt: () => { flattenCalled = true; },
    };

    const svc = new ObjectPlacementService({ terrain, maxSlopeDeg: 90 });
    const obj = new THREE.Group();
    obj.position.set(99, 99, 99);

    const result = svc.placeWithFlatBase(
      obj,
      { x: 0, z: 0, footprintWidth: 6, footprintDepth: 6 },
      { dryRun: true },
    );

    expect(result.accepted).toBe(true);
    expect(flattenCalled).toBe(false);
    // Objeto não foi movido
    expect(obj.position.x).toBe(99);
    expect(obj.position.y).toBe(99);
  });

  it("rejeita posição fora dos bounds mesmo com placeWithFlatBase", () => {
    const svc = new ObjectPlacementService({ terrain: boundedTerrain(50) });
    const obj = new THREE.Group();
    const result = svc.placeWithFlatBase(obj, { x: 200, z: 0, footprintWidth: 4, footprintDepth: 4 });

    expect(result.accepted).toBe(false);
    expect(result.rejectionReason).toBe("out_of_bounds");
  });

  it("fallback para apply() quando flattenAt não está disponível", () => {
    // Terrain sem flattenAt
    const terrain: TerrainQuery = {
      getHeightAt: () => 3,
      isSolid: () => false,
      containsXZ: () => true,
    };

    const svc = new ObjectPlacementService({ terrain, maxSlopeDeg: 90 });
    const obj = new THREE.Group();
    const result = svc.placeWithFlatBase(obj, { x: 0, z: 0, footprintWidth: 4, footprintDepth: 4 });

    // Deve aceitar e posicionar via apply()
    expect(result.accepted).toBe(true);
    expect(obj.position.y).toBeCloseTo(3, 5);
  });
});
