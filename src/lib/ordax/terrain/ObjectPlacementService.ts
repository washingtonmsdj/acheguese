/**
 * ObjectPlacementService — Posicionamento de objetos no terreno.
 *
 * Modos de operação:
 * 1. `calculate()` — consulta sem modificar nada (preview, validação)
 * 2. `apply()` — snap + alinhamento à normal (objetos que se adaptam ao terreno)
 * 3. `placeWithFlatBase()` — padrão AAA: nivela a área → posiciona plano e reto
 *
 * PRINCÍPIOS:
 * - Terreno é FIXO. Objetos se adaptam ao terreno (apply).
 * - Construções criam uma base plana antes de serem colocadas (placeWithFlatBase).
 * - Nivelamento é cirúrgico: apenas dentro do footprint + falloff suave.
 * - Separação clara: Terrain / Object placement / Gameplay.
 */

import * as THREE from "three";
import type { TerrainQuery } from "@/lib/ordax/physics/PhysicsWorld";

// ============================================================================
// CONSTANTES
// ============================================================================

const DEFAULT_MAX_SLOPE_DEG = 30;
const DEFAULT_MAX_SLOPE_RAD = (DEFAULT_MAX_SLOPE_DEG * Math.PI) / 180;
const MIN_SAMPLE_POINTS = 3;
const DEFAULT_SAMPLE_GRID = 3;

// ============================================================================
// TIPOS
// ============================================================================

export interface PlacementConfig {
  /** Terreno para consulta de altura */
  terrain: TerrainQuery;
  /**
   * Ângulo máximo de inclinação permitido (graus). Default: 30°.
   * Acima deste ângulo, o posicionamento é bloqueado.
   */
  maxSlopeDeg?: number;
  /**
   * Número de amostras por eixo no footprint (N×N). Default: 3.
   * Mínimo: 2. Recomendado: 3–5.
   */
  sampleGrid?: number;
}

export interface PlacementResult {
  /** Se o posicionamento foi aceito */
  accepted: boolean;
  /** Motivo da rejeição (se accepted = false) */
  rejectionReason?: "slope_too_steep" | "out_of_bounds" | "terrain_unavailable";
  /** Altura do terreno no centro do footprint */
  groundHeight: number;
  /** Ângulo de inclinação calculado (radianos) */
  slopeAngle: number;
  /** Normal do terreno calculada por múltiplos pontos */
  terrainNormal: THREE.Vector3;
  /** Rotação calculada para alinhar o objeto ao terreno */
  alignedRotation: THREE.Euler;
  /** Y final da base do objeto */
  baseY: number;
}

export interface PlacementTarget {
  /** Posição central do objeto (x, z) */
  x: number;
  z: number;
  /** Dimensões do footprint (largura × profundidade) */
  footprintWidth: number;
  footprintDepth: number;
}

export interface FlatBaseOptions {
  /**
   * Estratégia de altura alvo para o nivelamento.
   *
   * - "max"  → usa o ponto mais alto do footprint (escava os outros).
   *            Resultado: base elevada, sem aterro visível. Padrão Minecraft/Valheim.
   * - "avg"  → usa a média dos pontos (escava altos, eleva baixos).
   *            Resultado: base intermediária, menor impacto visual.
   * - "min"  → usa o ponto mais baixo (eleva todos os outros).
   *            Resultado: base rebaixada, parece enterrada.
   *
   * Default: "max"
   */
  strategy?: "max" | "avg" | "min";
  /**
   * Distância de transição suave nas bordas (metros).
   * Default: 20% do maior lado do footprint.
   */
  falloff?: number;
  /**
   * Se true, calcula mas não aplica o nivelamento nem move o objeto.
   * Útil para preview ou validação.
   * Default: false
   */
  dryRun?: boolean;
}

// ============================================================================
// SERVIÇO
// ============================================================================

export class ObjectPlacementService {
  private readonly terrain: TerrainQuery;
  private readonly maxSlopeRad: number;
  private readonly sampleGrid: number;

  constructor(config: PlacementConfig) {
    this.terrain = config.terrain;
    this.maxSlopeRad =
      config.maxSlopeDeg !== undefined
        ? (config.maxSlopeDeg * Math.PI) / 180
        : DEFAULT_MAX_SLOPE_RAD;
    this.sampleGrid = Math.max(MIN_SAMPLE_POINTS - 1, config.sampleGrid ?? DEFAULT_SAMPLE_GRID);
  }

  // ==========================================================================
  // API PÚBLICA
  // ==========================================================================

  /**
   * Calcula o posicionamento correto sem modificar nada.
   * Use para preview, validação de UI, ou antes de apply/placeWithFlatBase.
   */
  calculate(target: PlacementTarget): PlacementResult {
    const { x, z, footprintWidth, footprintDepth } = target;

    if (this.terrain.containsXZ && !this.terrain.containsXZ(x, z)) {
      return this._rejected("out_of_bounds", x, z);
    }

    const samples = this._sampleFootprint(x, z, footprintWidth, footprintDepth);
    if (samples.length < MIN_SAMPLE_POINTS) {
      return this._rejected("terrain_unavailable", x, z);
    }

    const terrainNormal = this._calculateTerrainNormal(samples);
    const up = new THREE.Vector3(0, 1, 0);
    const slopeAngle = terrainNormal.angleTo(up);

    if (slopeAngle > this.maxSlopeRad) {
      const result = this._rejected("slope_too_steep", x, z);
      result.slopeAngle = slopeAngle;
      result.terrainNormal = terrainNormal;
      return result;
    }

    const groundHeight = this.terrain.getHeightAt(x, z);
    const alignedRotation = this._normalToEuler(terrainNormal);

    return {
      accepted: true,
      groundHeight,
      slopeAngle,
      terrainNormal,
      alignedRotation,
      baseY: groundHeight,
    };
  }

  /**
   * Snap + alinhamento à normal do terreno.
   *
   * O objeto se adapta ao terreno: fica inclinado conforme a superfície.
   * Ideal para objetos naturais (pedras, árvores, NPCs).
   *
   * CONVENÇÃO: object.position.y = base inferior (pivot em y=0).
   */
  apply(object: THREE.Object3D, target: PlacementTarget): PlacementResult {
    const result = this.calculate(target);
    if (!result.accepted) return result;

    object.position.set(target.x, result.baseY, target.z);
    object.rotation.copy(result.alignedRotation);

    return result;
  }

  /**
   * Padrão AAA: cria base plana → posiciona objeto reto.
   *
   * Fluxo:
   * 1. Amostrar footprint e calcular altura alvo (max/avg/min)
   * 2. Nivelar o terreno para essa altura com falloff suave nas bordas
   * 3. Posicionar o objeto com rotation X/Z zero (base plana = sem inclinação)
   *
   * Requer que o terrain implemente `flattenAt`.
   * Se não implementar, cai de volta para `apply()` com aviso no console.
   *
   * @param object - Objeto Three.js a posicionar
   * @param target - Posição e dimensões do footprint
   * @param options - Estratégia de nivelamento e falloff
   */
  placeWithFlatBase(
    object: THREE.Object3D,
    target: PlacementTarget,
    options: FlatBaseOptions = {},
  ): PlacementResult {
    const { x, z, footprintWidth, footprintDepth } = target;
    const { strategy = "max", dryRun = false } = options;

    // 1. Validar bounds
    if (this.terrain.containsXZ && !this.terrain.containsXZ(x, z)) {
      return this._rejected("out_of_bounds", x, z);
    }

    // 2. Amostrar footprint para calcular altura alvo
    const samples = this._sampleFootprint(x, z, footprintWidth, footprintDepth);
    if (samples.length < MIN_SAMPLE_POINTS) {
      return this._rejected("terrain_unavailable", x, z);
    }

    // 3. Calcular altura alvo conforme estratégia
    const targetHeight = this._computeTargetHeight(samples, strategy);

    // 4. Calcular raio e falloff
    const radius = Math.max(footprintWidth, footprintDepth) * 0.5;
    const falloff = options.falloff ?? Math.max(footprintWidth, footprintDepth) * 0.2;

    // 5. Nivelar o terreno (se não for dry run e flattenAt estiver disponível)
    if (!dryRun) {
      if (this.terrain.flattenAt) {
        this.terrain.flattenAt(x, z, targetHeight, radius, falloff);
      } else {
        // Fallback: usar apply() com alinhamento à normal
        console.warn(
          "[ObjectPlacementService] flattenAt não disponível no terrain. " +
          "Usando apply() como fallback. Implemente flattenAt para o padrão AAA completo.",
        );
        return this.apply(object, target);
      }
    }

    // 6. Altura final após nivelamento (re-amostrar o centro)
    const finalHeight = dryRun ? targetHeight : this.terrain.getHeightAt(x, z);

    // 7. Posicionar objeto reto (X/Z zero — base é plana; preserva Y para orientação)
    if (!dryRun) {
      object.position.set(x, finalHeight, z);
      object.rotation.set(0, object.rotation.y, 0);
    }

    return {
      accepted: true,
      groundHeight: finalHeight,
      slopeAngle: 0,
      terrainNormal: new THREE.Vector3(0, 1, 0),
      alignedRotation: new THREE.Euler(0, object.rotation.y, 0),
      baseY: finalHeight,
    };
  }

  /**
   * Verifica se uma posição é válida para construção (sem modificar nada).
   */
  isValidPlacement(target: PlacementTarget): boolean {
    return this.calculate(target).accepted;
  }

  /**
   * Retorna o ângulo de inclinação em graus para uma posição.
   * Útil para feedback de UI (mostrar se pode construir aqui).
   */
  getSlopeDeg(x: number, z: number, footprintWidth: number, footprintDepth: number): number {
    const result = this.calculate({ x, z, footprintWidth, footprintDepth });
    return (result.slopeAngle * 180) / Math.PI;
  }

  // ==========================================================================
  // IMPLEMENTAÇÃO INTERNA
  // ==========================================================================

  private _sampleFootprint(
    cx: number,
    cz: number,
    width: number,
    depth: number,
  ): THREE.Vector3[] {
    const halfW = width * 0.5;
    const halfD = depth * 0.5;
    const n = this.sampleGrid;
    const points: THREE.Vector3[] = [];

    for (let ix = 0; ix < n; ix++) {
      const t = n === 1 ? 0.5 : ix / (n - 1);
      const wx = THREE.MathUtils.lerp(cx - halfW, cx + halfW, t);

      for (let iz = 0; iz < n; iz++) {
        const s = n === 1 ? 0.5 : iz / (n - 1);
        const wz = THREE.MathUtils.lerp(cz - halfD, cz + halfD, s);

        if (this.terrain.containsXZ && !this.terrain.containsXZ(wx, wz)) continue;

        const wy = this.terrain.getHeightAt(wx, wz);
        points.push(new THREE.Vector3(wx, wy, wz));
      }
    }

    return points;
  }

  private _computeTargetHeight(
    samples: THREE.Vector3[],
    strategy: FlatBaseOptions["strategy"],
  ): number {
    let result = samples[0].y;
    for (let i = 1; i < samples.length; i++) {
      const y = samples[i].y;
      if (strategy === "max") result = Math.max(result, y);
      else if (strategy === "min") result = Math.min(result, y);
      else result += y; // avg: acumula
    }
    return strategy === "avg" ? result / samples.length : result;
  }

  /**
   * Calcula a normal do terreno por regressão de plano (covariância).
   * Robusto para N >= 3 pontos.
   */
  private _calculateTerrainNormal(points: THREE.Vector3[]): THREE.Vector3 {
    if (points.length < 3) return new THREE.Vector3(0, 1, 0);

    const centroid = new THREE.Vector3();
    for (const p of points) centroid.add(p);
    centroid.divideScalar(points.length);

    let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
    for (const p of points) {
      const dx = p.x - centroid.x;
      const dy = p.y - centroid.y;
      const dz = p.z - centroid.z;
      xx += dx * dx; xy += dx * dy; xz += dx * dz;
      yy += dy * dy; yz += dy * dz; zz += dz * dz;
    }

    const det_x = yy * zz - yz * yz;
    const det_y = xx * zz - xz * xz;
    const det_z = xx * yy - xy * xy;

    let normal: THREE.Vector3;
    if (det_x >= det_y && det_x >= det_z) {
      normal = new THREE.Vector3(det_x, xz * yz - xy * zz, xy * yz - xz * yy);
    } else if (det_y >= det_x && det_y >= det_z) {
      normal = new THREE.Vector3(xz * yz - xy * zz, det_y, xy * xz - yz * xx);
    } else {
      normal = new THREE.Vector3(xy * yz - xz * yy, xy * xz - yz * xx, det_z);
    }

    if (normal.y < 0) normal.negate();
    const len = normal.length();
    if (len < 1e-10) return new THREE.Vector3(0, 1, 0);
    return normal.divideScalar(len);
  }

  private _normalToEuler(normal: THREE.Vector3): THREE.Euler {
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, normal);
    return new THREE.Euler().setFromQuaternion(quat, "XYZ");
  }

  private _rejected(
    reason: PlacementResult["rejectionReason"],
    x: number,
    z: number,
  ): PlacementResult {
    const groundHeight = this.terrain.containsXZ?.(x, z)
      ? this.terrain.getHeightAt(x, z)
      : 0;
    return {
      accepted: false,
      rejectionReason: reason,
      groundHeight,
      slopeAngle: 0,
      terrainNormal: new THREE.Vector3(0, 1, 0),
      alignedRotation: new THREE.Euler(),
      baseY: groundHeight,
    };
  }
}
