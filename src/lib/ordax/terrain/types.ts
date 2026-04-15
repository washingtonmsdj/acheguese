export type BiomeTextures = {
  base: string; // tex URL (ex: areia, grama)
  mid: string; // tex URL (ex: barro, terra)
  high: string; // tex URL (ex: argila/rocha)
};

export type HeightfieldTerrainConfig = {
  seed: number;
  size: number;
  minHeight: number;
  maxHeight: number;
  seaLevel: number;
  bottomY: number;
  deformation?: {
    enabled?: boolean;
    resolution?: number;
    maxDepth?: number;
    recoveryRate?: number;
  };
};

export type HeightfieldTerrainSample = {
  x: number;
  z: number;
  height: number;
};

export type HeightfieldTerrainQuery = HeightfieldTerrainConfig & {
  halfSize: number;
  containsXZ: (x: number, z: number) => boolean;
  clampXZ: (x: number, z: number) => { x: number; z: number };
  sample: (x: number, z: number) => HeightfieldTerrainSample;
  getBaseHeightAt: (x: number, z: number) => number;
  getDeformationAt: (x: number, z: number) => number;
  getHeightAt: (x: number, z: number) => number;
  deformAt: (x: number, z: number, stamp: { radius: number; depth: number }) => void;
  /**
   * Nivela o terreno para uma altura alvo dentro de um raio.
   * Ao contrário de deformAt (que só escava), flattenAt tanto escava
   * quanto eleva — criando uma base plana para construções (padrão AAA).
   *
   * @param x - Centro X da área a nivelar
   * @param z - Centro Z da área a nivelar
   * @param targetHeight - Altura alvo (metros)
   * @param radius - Raio da área a nivelar
   * @param falloff - Distância de transição suave nas bordas (metros). Default: radius * 0.3
   */
  flattenAt: (
    x: number,
    z: number,
    targetHeight: number,
    radius: number,
    falloff?: number,
  ) => void;
  advance: (deltaTime: number) => void;
  getDeformationVersion: () => number;
  isSolid: (x: number, y: number, z: number) => boolean;
};

export type TerrainConfig = {
  seed: number;
  size: number;
  maxHeight: number;
  segments: number;
  textures: BiomeTextures;
  blend: {
    seaLevel: number;
    rockHeight: number;
    texScale: number;
  };
};
