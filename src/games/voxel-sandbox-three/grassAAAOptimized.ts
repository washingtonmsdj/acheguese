import * as THREE from "three";
import { hash2i } from "@/lib/ordax/terrain/noise";
// ✅ CORREÇÃO SSOT: Importar configs de rendering
import { BIOME_CONFIGS, LOD_CONFIG } from "./config/rendering.config";
import { VOXEL_WORLD, TERRAIN_NOISE } from "@/lib/ordax/config";

/**
 * Biome configuration interface
 */
interface BiomeConfig {
  baseColor: THREE.Color;
  tipColor: THREE.Color;
  density: number;
  heightMin: number;
  heightMax: number;
  widthMin: number;
  widthMax: number;
  curveMin: number;
  curveMax: number;
  windStrength: number;
}

/**
 * Sistema de Grama AAA OTIMIZADO
 * 
 * Otimizações:
 * - LOD (3 níveis): high (7 seg), medium (3 seg), low (1 seg)
 * - Culling por distância: configurável via LOD_CONFIG
 * - Culling por waterLevel (esconde grama submersa)
 * - Frustum culling (Three.js automático)
 * - Redução de densidade em LOD baixo
 */

// Perlin noise simplificado (2D)
function perlin2D(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  
  const u = fade(xf);
  const v = fade(yf);
  
  const a = hash2i(X, Y, 12345);
  const b = hash2i(X + 1, Y, 12345);
  const c = hash2i(X, Y + 1, 12345);
  const d = hash2i(X + 1, Y + 1, 12345);
  
  return lerp(
    lerp(a, b, u),
    lerp(c, d, u),
    v
  );
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface GrassAAAOptimizedConfig {
  worldSize: number;
  heightAt: (x: number, z: number) => number;
  seed: number;
  biome?: 'mesopotamia' | 'default';
  enableLOD?: boolean; // Ativar LOD (padrão: true)
  enableWaterCulling?: boolean; // Ativar culling por água (padrão: true)
}

interface LODLevel {
  name: string;
  segments: number;
  density: number;
  minDistance: number;
  maxDistance: number;
  count: number;
}

export function createGrassAAAOptimized(config: GrassAAAOptimizedConfig): {
  meshes: THREE.Mesh[];
  animate: (time: number, cameraPos: THREE.Vector3, waterLevel: number) => void;
  dispose: () => void;
  getStats: () => { totalBlades: number; visibleBlades: number; lodLevels: number };
} {
  const { 
    worldSize, 
    heightAt, 
    seed, 
    biome = 'default',
    enableLOD = true,
    enableWaterCulling = true
  } = config;
  
  // ✅ CORREÇÃO SSOT: Usar configurações de bioma do config
  const biomeName = biome === 'mesopotamia' ? 'mesopotamia' : 'mesopotamia'; // Default para mesopotamia
  const bioConfig = BIOME_CONFIGS[biomeName];
  
  const biomeConfig = {
    baseColor: new THREE.Color(`hsl(${bioConfig.baseColor.h}, ${bioConfig.baseColor.s}%, ${bioConfig.baseColor.l}%)`),
    tipColor: new THREE.Color(`hsl(${bioConfig.tipColor.h}, ${bioConfig.tipColor.s}%, ${bioConfig.tipColor.l}%)`),
    density: bioConfig.density,
    heightMin: bioConfig.heightMin,
    heightMax: bioConfig.heightMax,
    widthMin: bioConfig.widthMin,
    widthMax: bioConfig.widthMax,
    curveMin: bioConfig.curveMin,
    curveMax: bioConfig.curveMax,
    windStrength: bioConfig.windStrength,
  };
  
  // ✅ CORREÇÃO SSOT: Definir níveis de LOD usando config
  const lodLevels: LODLevel[] = enableLOD ? LOD_CONFIG.DENSITY_BY_DISTANCE.map((config, index) => ({
    name: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
    segments: index === 0 ? 7 : index === 1 ? 3 : 1,
    density: config.density,
    minDistance: config.minDistance,
    maxDistance: config.maxDistance,
    count: 0,
  })) : [
    {
      name: 'single',
      segments: 7,
      density: 1.0,
      minDistance: 0,
      maxDistance: LOD_CONFIG.MAX_DISTANCE,
      count: 0,
    },
  ];
  
  // Calcular contagem por LOD
  const half = worldSize / 2;
  const cell = 0.12;
  const gx = Math.floor(worldSize / cell);
  const gz = Math.floor(worldSize / cell);
  const totalCells = gx * gz;
  
  for (const lod of lodLevels) {
    lod.count = Math.floor(totalCells * biomeConfig.density * lod.density);
  }
  
  const meshes: THREE.Mesh[] = [];
  const materials: THREE.ShaderMaterial[] = [];
  
  // Criar mesh para cada LOD
  for (const lod of lodLevels) {
    const mesh = createGrassMesh(lod, biomeConfig, worldSize, heightAt, seed);
    meshes.push(mesh);
    materials.push(mesh.material as THREE.ShaderMaterial);
  }
  
  console.log(`✅ Grama AAA Otimizada criada:`);
  console.log(`   LOD: ${enableLOD ? 'Ativado' : 'Desativado'}`);
  console.log(`   Water Culling: ${enableWaterCulling ? 'Ativado' : 'Desativado'}`);
  for (const lod of lodLevels) {
    console.log(`   ${lod.name}: ${lod.count.toLocaleString()} lâminas (${lod.segments} seg)`);
  }
  
  // Função de animação
  const animate = (time: number, cameraPos: THREE.Vector3, waterLevel: number) => {
    const timeValue = time * 0.001;
    
    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i];
      const material = materials[i];
      const lod = lodLevels[i];
      
      // Atualizar uniforms
      material.uniforms.uTime.value = timeValue;
      
      // Water culling (SEMPRE ATIVO - corrige bug de grama atravessando água!)
      material.uniforms.uWaterLevel.value = waterLevel;
      
      // LOD por distância (visibilidade)
      if (enableLOD) {
        const distance = cameraPos.distanceTo(mesh.position);
        mesh.visible = distance >= lod.minDistance && distance < lod.maxDistance;
      } else {
        mesh.visible = true;
      }
    }
  };
  
  // Função de dispose
  const dispose = () => {
    for (const mesh of meshes) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  };
  
  // Função de stats
  const getStats = () => {
    const totalBlades = lodLevels.reduce((sum, lod) => sum + lod.count, 0);
    const visibleBlades = meshes
      .filter(m => m.visible)
      .reduce((sum, m, i) => sum + lodLevels[i].count, 0);
    
    return {
      totalBlades,
      visibleBlades,
      lodLevels: lodLevels.length,
    };
  };
  
  return { meshes, animate, dispose, getStats };
}

function createGrassMesh(
  lod: LODLevel,
  biomeConfig: BiomeConfig,
  worldSize: number,
  heightAt: (x: number, z: number) => number,
  seed: number
): THREE.Mesh {
  const { segments, count } = lod;
  const vertsPerBlade = (segments + 1) * 2;
  const indicesPerBlade = segments * 6;
  
  const geometry = new THREE.BufferGeometry();
  
  // Buffers
  const positions = new Float32Array(count * vertsPerBlade * 3);
  const normals = new Float32Array(count * vertsPerBlade * 3);
  const uvs = new Float32Array(count * vertsPerBlade * 2);
  const indices = new Uint32Array(count * indicesPerBlade);
  const grassData = new Float32Array(count * vertsPerBlade * 4);
  
  const half = worldSize / 2;
  const cell = 0.12 / lod.density; // Ajustar cell por densidade
  const gx = Math.floor(worldSize / cell);
  const gz = Math.floor(worldSize / cell);
  
  const maxHeight = VOXEL_WORLD.MAX_HEIGHT;
  
  let bladeIndex = 0;
  const tmpObj = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  
  // Gerar lâminas
  for (let ix = 0; ix < gx && bladeIndex < count; ix++) {
    for (let iz = 0; iz < gz && bladeIndex < count; iz++) {
      const x = -half + (ix + 0.5) * cell;
      const z = -half + (iz + 0.5) * cell;
      
      if (Math.abs(x) > half - 2 || Math.abs(z) > half - 2) continue;
      
      // Jitter
      const jx = (hash2i(ix, iz, seed + 999) - 0.5) * cell * biomeConfig.widthMax;
      const jz = (hash2i(ix, iz, seed + 1001) - 0.5) * cell * biomeConfig.widthMax;
      const px = x + jx;
      const pz = z + jz;
      const py = heightAt(px, pz);
      
      // Verificar slope
      const slope = Math.abs(heightAt(px + 0.5, pz) - py) + Math.abs(heightAt(px, pz + 0.5) - py);
      if (slope > biomeConfig.heightMax) continue;
      
      // Densidade
      const heightFactor = 1.0 - Math.min(py / maxHeight, 1.0);
      const heightDensity = biomeConfig.density * 0.75 + heightFactor * biomeConfig.density * 0.25;
      const slopeFactor = 1.0 - Math.min(slope / biomeConfig.heightMax, 1.0);
      const slopeDensity = biomeConfig.density * 0.65 + slopeFactor * biomeConfig.density * 0.35;
      const heightVariationNoise = hash2i(Math.floor(px * 0.2), Math.floor(pz * 0.2), seed + 999);
      const isHighGrass = heightVariationNoise > (1.0 - biomeConfig.density * 0.6);
      const patchNoise = hash2i(Math.floor(px * 0.3), Math.floor(pz * 0.3), seed + 888);
      const patchDensity = patchNoise > (1.0 - biomeConfig.density) ? 1.0 : biomeConfig.density * 0.5;
      const finalDensity = (heightDensity + slopeDensity) * 0.5 * patchDensity * lod.density;
      const densityRoll = hash2i(ix, iz, seed + 5);
      if (densityRoll > finalDensity) continue;
      
      // Parâmetros da lâmina
      const rotation = hash2i(ix, iz, seed + 10) * Math.PI * 2;
      let height, width;
      if (isHighGrass) {
        height = biomeConfig.heightMax * (1.0 - biomeConfig.density * 0.2) + hash2i(ix, iz, seed + 20) * biomeConfig.heightMax * biomeConfig.density * 0.2;
        width = biomeConfig.widthMax * (1.0 - biomeConfig.density * 0.2) + hash2i(ix, iz, seed + 30) * biomeConfig.widthMax * biomeConfig.density * 0.2;
      } else {
        height = biomeConfig.heightMin + hash2i(ix, iz, seed + 20) * (biomeConfig.heightMax - biomeConfig.heightMin) * (1.0 - biomeConfig.density * 0.6);
        width = biomeConfig.widthMin + hash2i(ix, iz, seed + 30) * (biomeConfig.widthMax - biomeConfig.widthMin) * (1.0 - biomeConfig.density * 0.5);
      }
      const curve = biomeConfig.curveMin + hash2i(ix, iz, seed + 40) * (biomeConfig.curveMax - biomeConfig.curveMin);
      
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      
      // Criar vértices
      const baseIdx = bladeIndex * vertsPerBlade;
      
      for (let seg = 0; seg <= segments; seg++) {
        const t = seg / segments;
        const segHeight = t * height;
        const bendAmount = t * t * curve * biomeConfig.windStrength;
        const bendX = Math.sin(bendAmount) * height * biomeConfig.curveMin;
        const bendY = segHeight - Math.cos(bendAmount) * height * (1.0 - biomeConfig.density * 0.95);
        const segWidth = width * (1.0 - t * biomeConfig.curveMin);
        
        // Vértice esquerdo
        const leftIdx = (baseIdx + seg * 2) * 3;
        positions[leftIdx + 0] = px + (bendX - segWidth * 0.5) * cos;
        positions[leftIdx + 1] = py + bendY;
        positions[leftIdx + 2] = pz + (bendX - segWidth * 0.5) * sin;
        
        // Vértice direito
        const rightIdx = (baseIdx + seg * 2 + 1) * 3;
        positions[rightIdx + 0] = px + (bendX + segWidth * 0.5) * cos;
        positions[rightIdx + 1] = py + bendY;
        positions[rightIdx + 2] = pz + (bendX + segWidth * 0.5) * sin;
        
        // Normais
        const leftNormalAngle = rotation - Math.PI * 0.25;
        const rightNormalAngle = rotation + Math.PI * 0.25;
        normals[leftIdx + 0] = Math.cos(leftNormalAngle);
        normals[leftIdx + 1] = 0.3;
        normals[leftIdx + 2] = Math.sin(leftNormalAngle);
        normals[rightIdx + 0] = Math.cos(rightNormalAngle);
        normals[rightIdx + 1] = 0.3;
        normals[rightIdx + 2] = Math.sin(rightNormalAngle);
        
        // UVs
        const uvIdx = (baseIdx + seg * 2) * 2;
        uvs[uvIdx + 0] = 0;
        uvs[uvIdx + 1] = t;
        uvs[uvIdx + 2] = 1;
        uvs[uvIdx + 3] = t;
        
        // Grass data
        const dataIdx = (baseIdx + seg * 2) * 4;
        grassData[dataIdx + 0] = px;
        grassData[dataIdx + 1] = py;
        grassData[dataIdx + 2] = pz;
        grassData[dataIdx + 3] = curve;
        grassData[dataIdx + 4] = px;
        grassData[dataIdx + 5] = py;
        grassData[dataIdx + 6] = pz;
        grassData[dataIdx + 7] = curve;
      }
      
      // Índices
      const baseTriIdx = bladeIndex * indicesPerBlade;
      for (let seg = 0; seg < segments; seg++) {
        const v0 = baseIdx + seg * 2;
        const v1 = v0 + 1;
        const v2 = v0 + 2;
        const v3 = v0 + 3;
        const triIdx = baseTriIdx + seg * 6;
        indices[triIdx + 0] = v0;
        indices[triIdx + 1] = v2;
        indices[triIdx + 2] = v1;
        indices[triIdx + 3] = v1;
        indices[triIdx + 4] = v2;
        indices[triIdx + 5] = v3;
      }
      
      bladeIndex++;
    }
  }
  
  // Truncar arrays
  const actualVerts = bladeIndex * vertsPerBlade;
  const actualIndices = bladeIndex * indicesPerBlade;
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, actualVerts * 3), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals.slice(0, actualVerts * 3), 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs.slice(0, actualVerts * 2), 2));
  geometry.setAttribute('grassData', new THREE.BufferAttribute(grassData.slice(0, actualVerts * 4), 4));
  geometry.setIndex(new THREE.BufferAttribute(indices.slice(0, actualIndices), 1));
  
  // Material com shader
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWindStrength: { value: biomeConfig.windStrength },
      uWindFrequency: { value: 0.02 },
      uBaseColor: { value: biomeConfig.baseColor },
      uTipColor: { value: biomeConfig.tipColor },
      uWaterLevel: { value: -999 }, // Muito abaixo (sem culling inicial)
    },
    vertexShader: `
      uniform float uTime;
      uniform float uWindStrength;
      uniform float uWindFrequency;
      uniform float uWaterLevel;
      
      attribute vec4 grassData;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vHeight;
      varying float vAO;
      varying vec3 vViewDir;
      varying float vCulled;
      
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        vHeight = uv.y;
        
        vec3 pos = position;
        vec3 worldPos = grassData.xyz;
        
        // Water culling: esconder grama submersa
        vCulled = 0.0;
        if (worldPos.y < uWaterLevel) {
          vCulled = 1.0;
          // Mover para fora da tela (culling)
          pos.y = -9999.0;
        }
        
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        vViewDir = normalize(-mvPos.xyz);
        
        // Vento procedural
        float windNoise = noise(worldPos.xz * uWindFrequency + uTime * 0.15);
        float windStrength = noise(worldPos.xz * uWindFrequency * 0.5 + uTime * 0.2);
        float windAngle = windNoise * 6.28318;
        vec2 windDir = vec2(cos(windAngle), sin(windAngle));
        float windEffect = windStrength * uWindStrength * vHeight * vHeight * vHeight;
        pos.x += windDir.x * windEffect;
        pos.z += windDir.y * windEffect;
        
        // Flutter
        float flutter = noise(worldPos.xz * 0.5 + uTime * 3.0) * 0.025;
        pos.x += flutter * vHeight;
        pos.z += flutter * vHeight * 0.5;
        
        // AO
        vAO = mix(0.4, 1.0, vHeight * vHeight);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uBaseColor;
      uniform vec3 uTipColor;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vHeight;
      varying float vAO;
      varying vec3 vViewDir;
      varying float vCulled;
      
      void main() {
        // Culling: descartar fragmento se submerso
        if (vCulled > 0.5) discard;
        
        // Gradiente de cor
        float heightFactor = pow(vHeight, 1.2);
        vec3 grassColor = mix(uBaseColor, uTipColor, heightFactor);
        
        // Variação de cor
        float colorVariation = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        grassColor *= 0.85 + colorVariation * 0.3;
        
        // Iluminação
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
        float diff = max(dot(vNormal, lightDir), 0.0) * 0.7 + 0.3;
        
        // Rim light
        float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
        rim = pow(rim, 3.0) * 0.15;
        
        // Specular
        vec3 halfDir = normalize(lightDir + vViewDir);
        float spec = pow(max(dot(vNormal, halfDir), 0.0), 16.0) * 0.2 * vHeight;
        
        // Final
        vec3 finalColor = grassColor * diff * vAO;
        finalColor += rim;
        finalColor += spec;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.name = `grass_${lod.name}`;
  
  return mesh;
}
