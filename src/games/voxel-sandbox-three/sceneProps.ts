import * as THREE from "three";
import { hash2i } from "@/lib/ordax/terrain/noise";
// ✅ CORREÇÃO SSOT: Importar configs procedurais
import { NOISE_CONFIG, PROP_DISTRIBUTION, NOISE_SEEDS } from "./config/procedural.config";

type HeightAt = (x: number, z: number) => number;

export type AlluvialPropsConfig = {
  seed: number;
  worldSize: number;
  heightAt: HeightAt;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pickByHash(x: number, z: number, seed: number) {
  // Stable random 0..1 per cell
  return hash2i(x, z, seed);
}

function makeNoiseColorTexture(size = 128, seed = 1) {
  // Subtle monochrome noise for rock texture harmonization.
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = hash2i(x, y, seed);
      // ✅ CORREÇÃO SSOT: Usar NOISE_CONFIG para brightness
      const v = Math.floor(255 * clamp(NOISE_CONFIG.BRIGHTNESS.base + (n - 0.5) * NOISE_CONFIG.BRIGHTNESS.variation, 0, 1));
      data[i + 0] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRockInstanced(count: number) {
  const geo = new THREE.IcosahedronGeometry(0.22, 0);
  const rockMap = makeNoiseColorTexture(128, 4242);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("hsl(35, 28%, 62%)"), // tom mais claro e suave (bege/areia)
    map: rockMap,
    roughness: 0.85, // menos áspero para parecer mais suave
    metalness: 0,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  (mesh as unknown as { disposeTexture?: () => void }).disposeTexture = () => rockMap.dispose();
  return mesh;
}

export function createAlluvialInstancedProps(config: AlluvialPropsConfig): {
  group: THREE.Group;
  animate: (t: number) => void;
  dispose: () => void;
} {
  const { seed, worldSize, heightAt } = config;
  const group = new THREE.Group();
  group.name = "alluvial-props";

  // Distribution via grid sampling (stable + cheap): choose placements per cell using hash.
  const half = worldSize / 2;
  const cell = 0.7; // dense, “colado”
  const gx = Math.floor(worldSize / cell);
  const gz = Math.floor(worldSize / cell);

  // Target counts (exuberant but not absurd). We allocate upper-bounds and only fill used.
  const maxRocks = Math.floor(gx * gz * 0.006);
  // Grama antiga removida - agora usando sistema AAA (grassAAA.ts)

  const rocks = createRockInstanced(maxRocks);

  const tmpObj = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);

  let r = 0;

  // Helper to avoid steep slopes: approximate slope by sampling height differences.
  const slopeAt = (x: number, z: number) => {
    const s = 0.6;
    const h0 = heightAt(x, z);
    const hx = heightAt(x + s, z);
    const hz = heightAt(x, z + s);
    const dx = Math.abs(hx - h0);
    const dz = Math.abs(hz - h0);
    return Math.max(dx, dz);
  };

  for (let ix = 0; ix < gx; ix++) {
    for (let iz = 0; iz < gz; iz++) {
      const x = -half + (ix + PROP_DISTRIBUTION.CENTER_OFFSET) * cell;
      const z = -half + (iz + PROP_DISTRIBUTION.CENTER_OFFSET) * cell;
      if (Math.abs(x) > half - NOISE_CONFIG.EDGE_MARGIN.meters || Math.abs(z) > half - NOISE_CONFIG.EDGE_MARGIN.meters) continue;

      const h = heightAt(x, z);
      const slope = slopeAt(x, z);
      const stable = slope < 0.9; // keep plants mostly on flatter ground

      const n0 = pickByHash(ix, iz, seed + 10);
      const n1 = pickByHash(ix, iz, seed + 20);
      const n2 = pickByHash(ix, iz, seed + 30);
      const nJ = pickByHash(ix, iz, seed + NOISE_SEEDS.JITTER_X);

      // ✅ CORREÇÃO SSOT: Usar NOISE_CONFIG para jitter
      const jx = (nJ - 0.5) * cell * NOISE_CONFIG.JITTER.factor;
      const jz = (pickByHash(ix, iz, seed + NOISE_SEEDS.JITTER_Z) - 0.5) * cell * NOISE_CONFIG.JITTER.factor;
      const px = x + jx;
      const pz = z + jz;
      const py = heightAt(px, pz);

      // Rocks: prefer steeper/upper-ish spots.
      const rockBias = clamp(0.35 + slope * 0.55 + (py / 18) * 0.25, 0, 1);
      if (n2 < 0.05 * rockBias && r < maxRocks) {
        tmpObj.position.set(px, py + 0.12, pz);
        tmpObj.quaternion.setFromAxisAngle(up, n0 * Math.PI * 2);
        const s = 0.75 + n1 * 1.05;
        tmpObj.scale.set(s * (1.2 + slope * 0.6), s * (0.9 + slope * 0.6), s);
        tmpObj.updateMatrix();
        rocks.setMatrixAt(r++, tmpObj.matrix);
      }
    }
  }

  rocks.count = r;
  rocks.instanceMatrix.needsUpdate = true;

  group.add(rocks);
  // Grama antiga removida - agora usando sistema AAA (grassAAA.ts)

  // Mild wind sway (CPU-cheap): rotate instances by updating group only.
  // We keep per-instance matrices static (cheap), and sway the entire vegetation layers subtly.
  // No vegetation movement (user feedback).
  const animate = (_t: number) => {};

  const dispose = () => {
    (rocks.geometry as THREE.BufferGeometry).dispose();
    (rocks.material as THREE.Material).dispose();
    (rocks as unknown as { disposeTexture?: () => void }).disposeTexture?.();
  };

  return { group, animate, dispose };
}

function makeNoiseAlphaTexture(size = 128, seed = 1) {
  // Simple procedural alpha texture (no external assets).
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = hash2i(x, y, seed);
      const a = Math.floor(255 * clamp((n * 1.15), 0, 1));
      data[i + 0] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = a;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

export function createGroundDewMist(opts: {
  seed: number;
  worldSize: number;
  heightAt: HeightAt;
}): {
  points: THREE.Points;
  animate: (t: number) => void;
  dispose: () => void;
} {
  const { seed, worldSize, heightAt } = opts;
  const half = worldSize / 2;

  // Particle “dew” hugging the ground (more visible than a single plane).
  const count = 2400;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const rx = (hash2i(i, 11, seed + NOISE_SEEDS.PROP_DISTRIBUTION) - 0.5) * worldSize * NOISE_CONFIG.EDGE_MARGIN.distributionFactor;
    const rz = (hash2i(i, 19, seed + NOISE_SEEDS.PROP_DISTRIBUTION + 1) - 0.5) * worldSize * NOISE_CONFIG.EDGE_MARGIN.distributionFactor;
    const x = clamp(rx, -half + NOISE_CONFIG.EDGE_MARGIN.meters, half - NOISE_CONFIG.EDGE_MARGIN.meters);
    const z = clamp(rz, -half + NOISE_CONFIG.EDGE_MARGIN.meters, half - NOISE_CONFIG.EDGE_MARGIN.meters);
    const y = heightAt(x, z) + 0.12 + hash2i(i, 23, seed + NOISE_SEEDS.PROP_DISTRIBUTION + 2) * 0.35;
    positions[i * 3 + 0] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    sizes[i] = 0.8 + hash2i(i, 29, seed + NOISE_SEEDS.PROP_DISTRIBUTION + 3) * 1.6;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  const sprite = makeNoiseAlphaTexture(64, seed + 2024);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: sprite },
      uColor: { value: new THREE.Color("hsl(115, 30%, 82%)") },
      uOpacity: { value: 0.55 },
    },
    vertexShader: `
      uniform float uTime;
      attribute float aSize;
      varying float vFade;
      void main() {
        vec3 p = position;
        // subtle vertical shimmer
        p.y += sin(uTime * 0.7 + p.x * 0.08 + p.z * 0.08) * 0.06;
        vFade = 0.65 + 0.35 * sin(uTime * 0.5 + p.x * 0.05);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * (260.0 / -mv.z);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vFade;
      void main() {
        vec2 uv = gl_PointCoord;
        float a = texture2D(uMap, uv).a;
        // soft edges
        float d = distance(uv, vec2(0.5));
        float soft = smoothstep(0.5, 0.2, d);
        float alpha = a * soft * uOpacity * vFade;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });

  const points = new THREE.Points(geo, mat);
  points.renderOrder = 3;

  const animate = (t: number) => {
    (mat.uniforms.uTime.value as number) = t * 0.001;
    (mat.uniforms.uOpacity.value as number) = 0.45 + (Math.sin(t * 0.0012) * 0.08 + 0.08);
  };

  const dispose = () => {
    (points.geometry as THREE.BufferGeometry).dispose();
    (points.material as THREE.Material).dispose();
    sprite.dispose();
  };

  return { points, animate, dispose };
}
