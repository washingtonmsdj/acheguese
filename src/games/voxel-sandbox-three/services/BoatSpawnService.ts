/**
 * BoatSpawnService — Serviço de spawn autoritativo para embarcações.
 *
 * Responsabilidades:
 * 1. Encontrar o ponto mais baixo do terreno (onde a água chegará primeiro).
 * 2. Nivelar o terreno sob o footprint da arca (padrão AAA).
 * 3. Posicionar o RigidBody com body.position.y = groundHeight nivelado.
 * 4. Zerar velocidades para garantir estado inicial limpo.
 *
 * CONVENÇÃO: body.position.y = base inferior do casco (pivot em y=0).
 */

import type { RigidBody, TerrainQuery } from "@/lib/ordax/physics/PhysicsWorld";

// ============================================================================
// TIPOS
// ============================================================================

export interface BoatSpawnPoint {
  x: number;
  z: number;
}

export interface BoatSpawnResult {
  spawnPoint: BoatSpawnPoint;
  /** Altura do terreno após nivelamento */
  groundHeight: number;
  bodyBaseY: number;
  bodyTopY: number;
  /** Se o terreno foi nivelado antes do spawn */
  terrainFlattened: boolean;
}

export interface BoatSpawnConfig {
  terrain: TerrainQuery;
  worldSize: number;
  searchRadiusFraction?: number;
  searchStep?: number;
  /**
   * Dimensões do footprint da embarcação (largura × profundidade).
   * Usadas para nivelar a área correta.
   * Se não fornecidas, o nivelamento é pulado.
   */
  footprint?: { width: number; depth: number };
  /**
   * Falloff do nivelamento nas bordas (metros).
   * Default: 20% do maior lado do footprint.
   */
  flattenFalloff?: number;
}

// ============================================================================
// SERVIÇO
// ============================================================================

export class BoatSpawnService {
  private readonly terrain: TerrainQuery;
  private readonly worldSize: number;
  private readonly searchRadiusFraction: number;
  private readonly searchStep: number;
  private readonly footprint: { width: number; depth: number } | undefined;
  private readonly flattenFalloff: number | undefined;

  constructor(config: BoatSpawnConfig) {
    this.terrain = config.terrain;
    this.worldSize = config.worldSize;
    this.searchRadiusFraction = config.searchRadiusFraction ?? 0.35;
    this.searchStep = config.searchStep ?? 15;
    this.footprint = config.footprint;
    this.flattenFalloff = config.flattenFalloff;
  }

  findLowestPoint(): BoatSpawnPoint {
    const half = this.worldSize * this.searchRadiusFraction;
    const step = this.searchStep;

    let bestX = 0;
    let bestZ = 0;
    let bestHeight = Infinity;

    for (let x = -half; x <= half; x += step) {
      for (let z = -half; z <= half; z += step) {
        const h = this.terrain.getHeightAt(x, z);
        if (h < bestHeight) {
          bestHeight = h;
          bestX = x;
          bestZ = z;
        }
      }
    }

    return { x: bestX, z: bestZ };
  }

  /**
   * Nivela o terreno sob o footprint e posiciona o body.
   *
   * Fluxo:
   * 1. Amostrar footprint → calcular altura máxima (estratégia "max")
   * 2. flattenAt → terreno plano sob a arca
   * 3. Re-amostrar centro → altura final
   * 4. Posicionar body.position.y = altura final
   */
  spawnOnGround(body: RigidBody, spawnPoint: BoatSpawnPoint): BoatSpawnResult {
    const { x, z } = spawnPoint;
    let terrainFlattened = false;

    if (this.footprint && this.terrain.flattenAt) {
      const { width, depth } = this.footprint;
      const radius = Math.max(width, depth) * 0.5;
      const falloff = this.flattenFalloff ?? Math.max(width, depth) * 0.2;

      // Calcular altura máxima do footprint (estratégia "max" = escava os altos)
      const targetHeight = this._sampleMaxHeight(x, z, width, depth);

      this.terrain.flattenAt(x, z, targetHeight, radius, falloff);
      terrainFlattened = true;
    }

    // Re-amostrar após nivelamento (ou usar diretamente se não nivelou)
    const groundHeight = this.terrain.getHeightAt(x, z);

    body.position.set(x, groundHeight, z);
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    body.rotation.set(0, 0, 0);

    body.mesh.position.copy(body.position);
    body.mesh.rotation.copy(body.rotation);

    return {
      spawnPoint,
      groundHeight,
      bodyBaseY: body.position.y,
      bodyTopY: body.position.y + body.dimensions.y,
      terrainFlattened,
    };
  }

  spawnAtLowestPoint(body: RigidBody): BoatSpawnResult {
    const spawnPoint = this.findLowestPoint();
    return this.spawnOnGround(body, spawnPoint);
  }

  // Amostra N×N pontos no footprint e retorna o máximo
  private _sampleMaxHeight(cx: number, cz: number, width: number, depth: number): number {
    const halfW = width * 0.5;
    const halfD = depth * 0.5;
    const n = 5; // 5×5 = 25 pontos — suficiente para 137×23m
    let max = -Infinity;

    for (let ix = 0; ix < n; ix++) {
      const wx = cx - halfW + (ix / (n - 1)) * width;
      for (let iz = 0; iz < n; iz++) {
        const wz = cz - halfD + (iz / (n - 1)) * depth;
        const h = this.terrain.getHeightAt(wx, wz);
        if (h > max) max = h;
      }
    }

    return max;
  }
}
