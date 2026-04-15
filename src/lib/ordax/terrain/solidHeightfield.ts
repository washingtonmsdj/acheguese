import * as THREE from "three";

export type SolidHeightfieldOptions = {
  size: number;
  segments: number;
  /** Height function in world-space XZ. */
  heightAt: (x: number, z: number) => number;
  /** Bottom plane Y (e.g. -20). */
  bottomY: number;
};

/**
 * Build a CLOSED solid heightfield (top + sides + bottom) as a single BufferGeometry.
 * This prevents the terrain from looking hollow/broken when the camera gets close.
 */
export function createSolidHeightfieldGeometry(opts: SolidHeightfieldOptions): THREE.BufferGeometry {
  const { size, segments, heightAt, bottomY } = opts;
  const half = size / 2;
  const step = size / segments;

  const gridN = segments + 1;
  const topCount = gridN * gridN;
  const totalVerts = topCount * 2;

  const positions = new Float32Array(totalVerts * 3);

  // --- vertices (top + bottom)
  for (let iz = 0; iz < gridN; iz++) {
    const z = -half + iz * step;
    for (let ix = 0; ix < gridN; ix++) {
      const x = -half + ix * step;
      const i = iz * gridN + ix;

      const yTop = heightAt(x, z);
      // top
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = yTop;
      positions[i * 3 + 2] = z;
      // bottom (same xz)
      const bi = topCount + i;
      positions[bi * 3 + 0] = x;
      positions[bi * 3 + 1] = bottomY;
      positions[bi * 3 + 2] = z;
    }
  }

  // --- indices
  const topTris = segments * segments * 2;
  const bottomTris = segments * segments * 2;
  const sideTris = segments * 4 * 2;
  const indexCount = (topTris + bottomTris + sideTris) * 3;

  const indices = new Uint32Array(indexCount);
  let o = 0;

  const v = (ix: number, iz: number) => iz * gridN + ix;
  const vb = (ix: number, iz: number) => topCount + v(ix, iz);

  // TOP (winding CCW when viewed from +Y)
  for (let iz = 0; iz < segments; iz++) {
    for (let ix = 0; ix < segments; ix++) {
      const a = v(ix, iz);
      const b = v(ix + 1, iz);
      const c = v(ix, iz + 1);
      const d = v(ix + 1, iz + 1);

      // a-c-b
      indices[o++] = a;
      indices[o++] = c;
      indices[o++] = b;
      // b-c-d
      indices[o++] = b;
      indices[o++] = c;
      indices[o++] = d;
    }
  }

  // BOTTOM (flip winding so normals point DOWN/outside)
  for (let iz = 0; iz < segments; iz++) {
    for (let ix = 0; ix < segments; ix++) {
      const a = vb(ix, iz);
      const b = vb(ix + 1, iz);
      const c = vb(ix, iz + 1);
      const d = vb(ix + 1, iz + 1);

      // a-b-c
      indices[o++] = a;
      indices[o++] = b;
      indices[o++] = c;
      // b-d-c
      indices[o++] = b;
      indices[o++] = d;
      indices[o++] = c;
    }
  }

  // SIDES (perimeter): each segment becomes 2 tris connecting top edge to bottom edge.
  const addQuad = (t0: number, t1: number, b0: number, b1: number) => {
    // Winding such that the outside normal points outward.
    indices[o++] = t0;
    indices[o++] = b0;
    indices[o++] = t1;

    indices[o++] = t1;
    indices[o++] = b0;
    indices[o++] = b1;
  };

  // z = -half (south edge): iz = 0
  for (let ix = 0; ix < segments; ix++) {
    addQuad(v(ix, 0), v(ix + 1, 0), vb(ix, 0), vb(ix + 1, 0));
  }
  // z = +half (north edge): iz = segments (flip order)
  for (let ix = 0; ix < segments; ix++) {
    addQuad(v(ix + 1, segments), v(ix, segments), vb(ix + 1, segments), vb(ix, segments));
  }
  // x = -half (west edge): ix = 0
  for (let iz = 0; iz < segments; iz++) {
    addQuad(v(0, iz + 1), v(0, iz), vb(0, iz + 1), vb(0, iz));
  }
  // x = +half (east edge): ix = segments
  for (let iz = 0; iz < segments; iz++) {
    addQuad(v(segments, iz), v(segments, iz + 1), vb(segments, iz), vb(segments, iz + 1));
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}
