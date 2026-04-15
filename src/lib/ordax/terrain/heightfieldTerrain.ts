import { heightAt as sampleHeightNoise } from "./noise";
import type { HeightfieldTerrainConfig, HeightfieldTerrainQuery } from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampInt(value: number, min: number, max: number) {
  return Math.floor(clamp(value, min, max));
}

/** smoothstep: transição suave 0→1 para t em [0,1] */
function smoothstep(t: number): number {
  const tc = clamp(t, 0, 1);
  return tc * tc * (3 - 2 * tc);
}

export function createHeightfieldTerrainQuery(config: HeightfieldTerrainConfig): HeightfieldTerrainQuery {
  const halfSize = config.size * 0.5;

  const deformationEnabled = config.deformation?.enabled ?? true;
  const deformationResolution = clampInt(config.deformation?.resolution ?? 160, 32, 512);
  const deformationMaxDepth = Math.max(0.05, config.deformation?.maxDepth ?? 0.45);
  const deformationRecoveryRate = Math.max(0, config.deformation?.recoveryRate ?? 0.04);
  const deformationField = new Float32Array(deformationResolution * deformationResolution);
  let deformationVersion = 0;

  // Conjunto de células "congeladas" pelo flattenAt — imunes ao advance (recovery)
  const frozenCells = new Set<number>();

  const cellWorldSize = (halfSize * 2) / (deformationResolution - 1);

  const clampXZ = (x: number, z: number) => ({
    x: clamp(x, -halfSize, halfSize),
    z: clamp(z, -halfSize, halfSize),
  });

  const containsXZ = (x: number, z: number) =>
    x >= -halfSize && x <= halfSize && z >= -halfSize && z <= halfSize;

  const getBaseHeightAt = (x: number, z: number) => {
    const clamped = clampXZ(x, z);
    return Math.max(
      config.minHeight,
      sampleHeightNoise(clamped.x, clamped.z, config.seed, config.maxHeight),
    );
  };

  const worldToGrid = (x: number, z: number) => {
    const clamped = clampXZ(x, z);
    const nx = (clamped.x + halfSize) / (halfSize * 2);
    const nz = (clamped.z + halfSize) / (halfSize * 2);
    return {
      gx: nx * (deformationResolution - 1),
      gz: nz * (deformationResolution - 1),
    };
  };

  const sampleDeformationBilinear = (x: number, z: number) => {
    if (!deformationEnabled) return 0;
    if (!containsXZ(x, z)) return 0;

    const { gx, gz } = worldToGrid(x, z);
    const x0 = clampInt(Math.floor(gx), 0, deformationResolution - 1);
    const z0 = clampInt(Math.floor(gz), 0, deformationResolution - 1);
    const x1 = clampInt(x0 + 1, 0, deformationResolution - 1);
    const z1 = clampInt(z0 + 1, 0, deformationResolution - 1);
    const tx = gx - x0;
    const tz = gz - z0;

    const i00 = z0 * deformationResolution + x0;
    const i10 = z0 * deformationResolution + x1;
    const i01 = z1 * deformationResolution + x0;
    const i11 = z1 * deformationResolution + x1;

    const a = deformationField[i00] * (1 - tx) + deformationField[i10] * tx;
    const b = deformationField[i01] * (1 - tx) + deformationField[i11] * tx;
    return a * (1 - tz) + b * tz;
  };

  const getDeformationAt = (x: number, z: number) => sampleDeformationBilinear(x, z);

  const getHeightAt = (x: number, z: number) => getBaseHeightAt(x, z) + getDeformationAt(x, z);

  const deformAt: HeightfieldTerrainQuery["deformAt"] = (x, z, stamp) => {
    if (!deformationEnabled) return;
    if (!containsXZ(x, z)) return;

    const radius = Math.max(cellWorldSize * 0.5, stamp.radius);
    const depth = Math.max(0, stamp.depth);
    if (depth <= 0.000001) return;

    const minX = clampInt(Math.floor((x - radius + halfSize) / cellWorldSize), 0, deformationResolution - 1);
    const maxX = clampInt(Math.ceil((x + radius + halfSize) / cellWorldSize), 0, deformationResolution - 1);
    const minZ = clampInt(Math.floor((z - radius + halfSize) / cellWorldSize), 0, deformationResolution - 1);
    const maxZ = clampInt(Math.ceil((z + radius + halfSize) / cellWorldSize), 0, deformationResolution - 1);

    const radiusSq = radius * radius;
    const sigmaSq = Math.max(0.0001, radiusSq * 0.22);
    let changed = false;

    for (let gz = minZ; gz <= maxZ; gz++) {
      const worldZ = -halfSize + gz * cellWorldSize;
      for (let gx = minX; gx <= maxX; gx++) {
        const worldX = -halfSize + gx * cellWorldSize;
        const dx = worldX - x;
        const dz = worldZ - z;
        const distSq = dx * dx + dz * dz;
        if (distSq > radiusSq) continue;

        const index = gz * deformationResolution + gx;
        // Células congeladas pelo flattenAt não são afetadas por deformAt
        if (frozenCells.has(index)) continue;

        const influence = Math.exp(-distSq / sigmaSq);
        const current = deformationField[index];
        const next = Math.max(-deformationMaxDepth, current - depth * influence);

        if (Math.abs(next - current) > 0.000001) {
          deformationField[index] = next;
          changed = true;
        }
      }
    }

    if (changed) {
      deformationVersion += 1;
    }
  };

  /**
   * Nivela o terreno para uma altura alvo dentro de um raio.
   *
   * Diferente de deformAt (que só escava com limite de profundidade),
   * flattenAt opera SEM limite de profundidade — é uma operação de
   * posicionamento de construção, não deformação dinâmica.
   *
   * Correções em relação à versão anterior:
   * - Sem clamp de profundidade (deformationMaxDepth não se aplica aqui)
   * - Células niveladas são "congeladas" — imunes ao advance (recovery)
   * - Falloff via smoothstep para transição visual suave
   * - Calcula requiredDeform = targetHeight - baseHeight diretamente
   */
  const flattenAt: HeightfieldTerrainQuery["flattenAt"] = (x, z, targetHeight, radius, falloff) => {
    if (!containsXZ(x, z)) return;
    if (radius <= 0) return;

    const effectiveRadius = Math.max(cellWorldSize * 0.5, radius);
    const effectiveFalloff = Math.max(cellWorldSize, falloff ?? effectiveRadius * 0.3);
    const outerRadius = effectiveRadius + effectiveFalloff;

    const minX = clampInt(Math.floor((x - outerRadius + halfSize) / cellWorldSize), 0, deformationResolution - 1);
    const maxX = clampInt(Math.ceil((x + outerRadius + halfSize) / cellWorldSize), 0, deformationResolution - 1);
    const minZ = clampInt(Math.floor((z - outerRadius + halfSize) / cellWorldSize), 0, deformationResolution - 1);
    const maxZ = clampInt(Math.ceil((z + outerRadius + halfSize) / cellWorldSize), 0, deformationResolution - 1);

    let changed = false;

    for (let gz = minZ; gz <= maxZ; gz++) {
      const worldZ = -halfSize + gz * cellWorldSize;
      for (let gx = minX; gx <= maxX; gx++) {
        const worldX = -halfSize + gx * cellWorldSize;
        const dx = worldX - x;
        const dz = worldZ - z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > outerRadius) continue;

        // Peso via smoothstep: 1.0 dentro do raio, transição suave no falloff
        let weight: number;
        if (dist <= effectiveRadius) {
          weight = 1;
        } else {
          // t = 0 na borda do raio, t = 1 na borda externa do falloff
          const t = (dist - effectiveRadius) / effectiveFalloff;
          weight = 1 - smoothstep(t);
        }

        if (weight < 0.0001) continue;

        const index = gz * deformationResolution + gx;
        const currentDeform = deformationField[index];
        const baseHeight = getBaseHeightAt(worldX, worldZ);

        // Deformação necessária para que baseHeight + deform = targetHeight
        const requiredDeform = targetHeight - baseHeight;

        // Interpolar entre deform atual e o alvo pelo peso
        // weight=1 → deform = requiredDeform (exato)
        // weight<1 → deform = interpolação (transição suave)
        const newDeform = currentDeform + (requiredDeform - currentDeform) * weight;

        if (Math.abs(newDeform - currentDeform) > 0.0001) {
          deformationField[index] = newDeform;
          // Congelar células dentro do raio plano (não no falloff)
          if (dist <= effectiveRadius) {
            frozenCells.add(index);
          }
          changed = true;
        }
      }
    }

    if (changed) {
      deformationVersion += 1;
    }
  };

  const advance: HeightfieldTerrainQuery["advance"] = (deltaTime) => {
    if (!deformationEnabled) return;
    if (!Number.isFinite(deltaTime) || deltaTime <= 0) return;
    if (deformationRecoveryRate <= 0) return;

    const recoveryStep = deformationRecoveryRate * deltaTime;
    let changed = false;

    for (let i = 0; i < deformationField.length; i++) {
      // Células congeladas pelo flattenAt não se recuperam
      if (frozenCells.has(i)) continue;

      const value = deformationField[i];
      if (value >= -0.000001) continue;
      const next = Math.min(0, value + recoveryStep);
      if (Math.abs(next - value) > 0.000001) {
        deformationField[i] = next;
        changed = true;
      }
    }

    if (changed) {
      deformationVersion += 1;
    }
  };

  return {
    ...config,
    halfSize,
    containsXZ,
    clampXZ,
    sample: (x: number, z: number) => {
      const clamped = clampXZ(x, z);
      return {
        ...clamped,
        height: getHeightAt(clamped.x, clamped.z),
      };
    },
    getBaseHeightAt,
    getDeformationAt,
    getHeightAt,
    deformAt,
    flattenAt,
    advance,
    getDeformationVersion: () => deformationVersion,
    isSolid: (x: number, y: number, z: number) =>
      containsXZ(x, z) && y < getHeightAt(x, z),
  };
}
