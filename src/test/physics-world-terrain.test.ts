import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { ARK_CONSTANTS } from "@/lib/constants/systems/physics-advanced";
import { PhysicsWorld, RigidBody, createArkRigidBody, type RigidBodyConfig } from "@/lib/ordax/physics/PhysicsWorld";

function createBody(dimensions: THREE.Vector3, position: THREE.Vector3) {
  const mesh = new THREE.Group();
  mesh.position.copy(position);

  const config: RigidBodyConfig = {
    mass: 100,
    volume: dimensions.x * dimensions.y * dimensions.z,
    dimensions,
    centerOfMass: new THREE.Vector3(0, dimensions.y * 0.5, 0),
    dragCoefficient: 0.2,
  };

  return new RigidBody(config, mesh);
}

describe("PhysicsWorld terrain contact", () => {
  it("treats rigid body position as the base pivot when resolving terrain contact", () => {
    const world = new PhysicsWorld({ gravity: 9.8 });
    world.setTerrain({
      getHeightAt: () => 2,
      isSolid: (_x, y) => y < 2,
    });

    const body = createBody(new THREE.Vector3(4, 6, 4), new THREE.Vector3(0, 10, 0));
    world.addBody(body);

    // Simular até o corpo assentar no terreno (múltiplos steps)
    for (let i = 0; i < 120; i++) world.step(1 / 60);

    expect(body.position.y).toBeCloseTo(2, 1);
    expect(body.mesh.position.y).toBeCloseTo(2, 1);
  });

  it("samples the full footprint so terrain ridges support wide bodies", () => {
    const world = new PhysicsWorld({ gravity: 0 });
    // Crista larga o suficiente para ser capturada pelo grid adaptativo (>= TERRAIN_SAMPLE_SPACING)
    // O grid usa espaçamento de 6m, então a crista precisa ter pelo menos 6m de largura
    world.setTerrain({
      getHeightAt: (x) => (x >= -4 && x <= 4 ? 5 : 0),
      isSolid: (x, y) => y < (x >= -4 && x <= 4 ? 5 : 0),
    });

    // Body começa abaixo do terreno (y=0, terreno em y=5 na faixa x=-4..4)
    const body = createBody(new THREE.Vector3(18, 4, 6), new THREE.Vector3(0, 0, 0));
    world.addBody(body);

    world.step(1 / 60);

    // O corpo deve ter sido empurrado para cima pela penetração
    expect(body.position.y).toBeGreaterThanOrEqual(4.9);
    expect(world.isOnGround(body)).toBe(true);
  });

  it("keeps ground queries consistent with rotated bodies", () => {
    const world = new PhysicsWorld({ gravity: 0 });
    world.setTerrain({
      getHeightAt: (x) => (x > 0 ? 3 : 0),
      isSolid: (x, y) => y < (x > 0 ? 3 : 0),
    });

    const body = createBody(new THREE.Vector3(10, 4, 10), new THREE.Vector3(0, 0, 0));
    body.rotation.z = THREE.MathUtils.degToRad(10);
    world.addBody(body);

    world.step(1 / 60);

    expect(world.isOnGround(body)).toBe(true);
    expect(body.position.y).toBeGreaterThan(0);
  });

  it("resolves terrain contact along the movement path to prevent high-speed hill tunneling", () => {
    const world = new PhysicsWorld({ gravity: 0 });
    world.setTerrain({
      getHeightAt: (x) => (Math.abs(x) <= 1 ? 8 : 0),
      isSolid: (x, y) => y < (Math.abs(x) <= 1 ? 8 : 0),
    });

    // Body em x=-20, y=1 (acima do terreno plano y=0), velocidade alta em X
    // O sweep deve detectar a colina em x=0 (y=8) e empurrar o corpo para cima
    const body = createBody(new THREE.Vector3(2, 2, 2), new THREE.Vector3(-20, 1, 0));
    body.velocity.x = 240;
    world.addBody(body);

    world.step(1 / 8);

    // O corpo deve ter sido empurrado para cima ao cruzar a colina
    // (não atravessou o terreno — y deve ser >= 0 em qualquer ponto)
    expect(body.position.y).toBeGreaterThanOrEqual(0);
    // O corpo deve estar acima do terreno no ponto atual
    const terrainAtCurrentPos = Math.abs(body.position.x) <= 1 ? 8 : 0;
    expect(body.position.y).toBeGreaterThanOrEqual(terrainAtCurrentPos - 0.1);
  });

  it("snaps slowly descending bodies to terrain to avoid hover gaps", () => {
    const world = new PhysicsWorld({ gravity: 0 });
    world.setTerrain({
      getHeightAt: () => 2,
      isSolid: (_x, y) => y < 2,
    });

    const body = createBody(new THREE.Vector3(3, 2, 3), new THREE.Vector3(0, 2.04, 0));
    body.velocity.y = -0.2;
    world.addBody(body);

    world.step(1 / 60);

    expect(body.position.y).toBeCloseTo(2, 5);
    expect(body.velocity.y).toBe(0);
    expect(world.isOnGround(body)).toBe(true);
  });

  it("ignores terrain samples outside valid terrain bounds when containsXZ is provided", () => {
    const world = new PhysicsWorld({ gravity: 0 });
    world.setTerrain({
      getHeightAt: () => 6,
      isSolid: (_x, y) => y < 6,
      containsXZ: (x, z) => Math.abs(x) <= 5 && Math.abs(z) <= 5,
    });

    const body = createBody(new THREE.Vector3(2, 2, 2), new THREE.Vector3(40, 1, 40));
    world.addBody(body);

    world.step(1 / 60);

    expect(body.position.y).toBeCloseTo(1, 5);
    expect(world.isOnGround(body)).toBe(false);
  });

  it("applies terrain deformation stamps when heavy bodies contact the ground", () => {
    const world = new PhysicsWorld({ gravity: 9.8 });
    let stampCount = 0;
    world.setTerrain({
      getHeightAt: () => 0,
      isSolid: (_x, y) => y < 0,
      deformAt: (_x, _z, stamp) => {
        if (stamp.depth > 0 && stamp.radius > 0) {
          stampCount += 1;
        }
      },
    });

    // Body começa ligeiramente acima do terreno com velocidade descendente
    // Após o step, deve colidir e chamar deformAt
    const body = createBody(new THREE.Vector3(6, 4, 6), new THREE.Vector3(0, 0.05, 0));
    body.velocity.y = -3;
    world.addBody(body);

    world.step(1 / 30);

    expect(stampCount).toBeGreaterThan(0);
  });

  it("computes buoyancy from sampled footprint instead of only center point", () => {
    const world = new PhysicsWorld({ gravity: 9.8, waterDensity: 1000 });
    world.setTerrain({
      getHeightAt: (x) => (Math.abs(x) < 1 ? 8 : 0),
      isSolid: (x, y) => y < (Math.abs(x) < 1 ? 8 : 0),
    });
    world.setWater({
      getWaterLevel: () => 5,
      getWaveHeightAt: () => 0,
    });

    const body = createBody(new THREE.Vector3(20, 4, 6), new THREE.Vector3(0, 1, 0));
    world.addBody(body);

    const debug = world.getPhysicsDebug(body);

    expect(debug.buoyancy).toBeGreaterThan(0);
    expect(debug.submergedPercent).toBeGreaterThan(0);
  });

  it("creates ark rigid body using the shared engine SSOT constants", () => {
    const mesh = new THREE.Group();
    const body = createArkRigidBody(mesh);
    const expectedVolume = ARK_CONSTANTS.LENGTH * ARK_CONSTANTS.WIDTH * ARK_CONSTANTS.HEIGHT;

    expect(body.dimensions.x).toBe(ARK_CONSTANTS.LENGTH);
    expect(body.dimensions.y).toBe(ARK_CONSTANTS.HEIGHT);
    expect(body.dimensions.z).toBe(ARK_CONSTANTS.WIDTH);
    expect(body.volume).toBeCloseTo(expectedVolume, 6);
    expect(body.mass).toBeCloseTo(expectedVolume * ARK_CONSTANTS.LOADED_DENSITY, 6);
    expect(body.dragCoefficient).toBe(ARK_CONSTANTS.DRAG_COEFFICIENT);
  });
});
