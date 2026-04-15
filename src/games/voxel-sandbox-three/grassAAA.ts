import * as THREE from "three";
import { hash2i } from "@/lib/ordax/terrain/noise";
import { VOXEL_WORLD, TERRAIN_NOISE } from "@/lib/ordax/config";

/**
 * Sistema de Grama AAA inspirado em Ghost of Tsushima
 * 
 * Features:
 * - Geometria com múltiplos segmentos (curvatura)
 * - Vento procedural (Perlin noise)
 * - Gradiente de cor (base → topo)
 * - Ambient Occlusion procedural
 * - Normais arredondadas
 */

// Perlin noise simplificado (2D)
function perlin2D(x: number, y: number): number {
  // Implementação simplificada usando hash
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

export interface GrassAAAConfig {
  count: number;
  worldSize: number;
  heightAt: (x: number, z: number) => number;
  seed: number;
  biome?: 'mesopotamia' | 'default';
}

const MAX_INTERACTION_POINTS = 8;

export function createGrassAAA(config: GrassAAAConfig): {
  mesh: THREE.Mesh;
  animate: (time: number) => void;
  setInteractionPoints: (points: Array<{ x: number; z: number; radius: number; strength: number }>) => void;
  dispose: () => void;
} {
  const { count, worldSize, heightAt, seed, biome = 'default' } = config;
  
  // Configurações por bioma
  const biomeConfig = biome === 'mesopotamia' ? {
    // Éden Pré-Dilúvio: vegetação densa mas com tons mais secos/realistas
    baseColor: new THREE.Color("hsl(75, 35%, 28%)"),   // verde-oliva seco (menos vibrante)
    tipColor: new THREE.Color("hsl(65, 40%, 48%)"),    // amarelo-esverdeado (mais seco)
    density: 0.95,  // densidade EXTREMA (era 0.90) - 95% de cobertura
    heightMin: 0.25,  // MUITO mais alta (era 0.10) - capim alto
    heightMax: 0.65,  // MUITO mais alta (era 0.22) - até 65cm!
    widthMin: 0.04,   // MAIS larga (era 0.03) - mais volume
    widthMax: 0.08,   // MAIS larga (era 0.06) - mais volume
    curveMin: 0.15,   // variação de curvatura
    curveMax: 0.35,   // algumas mais curvadas (selvagem)
    windStrength: 0.35,  // vento MAIS FORTE (era 0.20) - mais movimento
  } : {
    // Default: grama verde exuberante
    baseColor: new THREE.Color("hsl(118, 50%, 22%)"),
    tipColor: new THREE.Color("hsl(75, 60%, 45%)"),
    density: 0.7,
    heightMin: 0.3,
    heightMax: 0.55,
    widthMin: 0.04,
    widthMax: 0.06,
    curveMin: 0.3,
    curveMax: 0.5,
    windStrength: 0.3,
  };
  
  // Criar geometria customizada com múltiplos segmentos
  const segments = 7; // MAIS segmentos (era 5) - mais suave e detalhada
  const vertsPerBlade = (segments + 1) * 2; // 2 vértices por segmento (largura)
  const indicesPerBlade = segments * 6; // 2 triângulos por segmento
  
  const geometry = new THREE.BufferGeometry();
  
  // Buffers
  const positions = new Float32Array(count * vertsPerBlade * 3);
  const normals = new Float32Array(count * vertsPerBlade * 3);
  const uvs = new Float32Array(count * vertsPerBlade * 2);
  const indices = new Uint32Array(count * indicesPerBlade);
  const grassData = new Float32Array(count * vertsPerBlade * 4); // x, y, z, curva
  
  const half = worldSize / 2;
  const cell = 0.12; // densidade EXTREMA (era 0.15) - grama MUITO junta
  const gx = Math.floor(worldSize / cell);
  const gz = Math.floor(worldSize / cell);
  
  // Constantes para cálculo de densidade (SSOT)
  const maxHeight = VOXEL_WORLD.MAX_HEIGHT;
  
  let bladeIndex = 0;
  
  // Gerar lâminas de grama
  for (let ix = 0; ix < gx && bladeIndex < count; ix++) {
    for (let iz = 0; iz < gz && bladeIndex < count; iz++) {
      const x = -half + (ix + 0.5) * cell;
      const z = -half + (iz + 0.5) * cell;
      
      if (Math.abs(x) > half - 2 || Math.abs(z) > half - 2) continue;
      
      // Jitter
      const jx = (hash2i(ix, iz, seed + 999) - 0.5) * cell * 0.8;
      const jz = (hash2i(ix, iz, seed + 1001) - 0.5) * cell * 0.8;
      const px = x + jx;
      const pz = z + jz;
      const py = heightAt(px, pz);
      
      // Verificar slope (evitar encostas muito íngremes)
      const slope = Math.abs(heightAt(px + 0.5, pz) - py) + Math.abs(heightAt(px, pz + 0.5) - py);
      if (slope > 1.2) continue;
      
      // === DENSIDADE BASEADA EM FATORES NATURAIS (ÉDEN PRÉ-DILÚVIO) ===
      // Terra extremamente fértil (Gênesis 2:6) - vegetação exuberante
      
      // 1. Altura: MAIS grama em áreas baixas (mais umidade da névoa)
      const heightFactor = 1.0 - Math.min(py / maxHeight, 1.0);
      const heightDensity = 0.75 + heightFactor * 0.25; // 75-100% (muito fértil)
      
      // 2. Slope: vegetação até em encostas (terra fértil)
      const slopeFactor = 1.0 - Math.min(slope / TERRAIN_NOISE.SLOPE_THRESHOLD, 1.0);
      const slopeDensity = 0.65 + slopeFactor * 0.35; // 65-100% (cresce em encostas)
      
      // 3. Variação de altura (patches): cria áreas com vegetação ALTA e BAIXA
      const heightVariationNoise = hash2i(Math.floor(px * 0.2), Math.floor(pz * 0.2), seed + 999);
      const isHighGrass = heightVariationNoise > 0.4; // 60% grama alta, 40% grama baixa
      
      // 4. Patches de densidade: algumas áreas mais densas (selvagem)
      const patchNoise = hash2i(Math.floor(px * 0.3), Math.floor(pz * 0.3), seed + 888);
      const patchDensity = patchNoise > 0.05 ? 1.0 : 0.3; // 97% áreas densas, 3% clareiras
      
      // Densidade final (ÉDEN = muito fértil)
      const finalDensity = (heightDensity + slopeDensity) * 0.5 * patchDensity * biomeConfig.density;
      
      // Roll de densidade
      const densityRoll = hash2i(ix, iz, seed + 5);
      if (densityRoll > finalDensity) continue;
      
      // Parâmetros da lâmina (VARIAÇÃO DE ALTURA)
      const rotation = hash2i(ix, iz, seed + 10) * Math.PI * 2;
      
      // VARIAÇÃO: grama alta (60%) vs grama baixa (40%)
      let height, width;
      if (isHighGrass) {
        // Grama ALTA (capim alto, selvagem)
        height = biomeConfig.heightMax * 0.8 + hash2i(ix, iz, seed + 20) * biomeConfig.heightMax * 0.2;
        width = biomeConfig.widthMax * 0.8 + hash2i(ix, iz, seed + 30) * biomeConfig.widthMax * 0.2;
      } else {
        // Grama BAIXA (cobertura do solo)
        height = biomeConfig.heightMin + hash2i(ix, iz, seed + 20) * (biomeConfig.heightMax - biomeConfig.heightMin) * 0.4;
        width = biomeConfig.widthMin + hash2i(ix, iz, seed + 30) * (biomeConfig.widthMax - biomeConfig.widthMin) * 0.5;
      }
      
      const curve = biomeConfig.curveMin + hash2i(ix, iz, seed + 40) * (biomeConfig.curveMax - biomeConfig.curveMin);
      
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      
      // Criar vértices da lâmina
      const baseIdx = bladeIndex * vertsPerBlade;
      
      for (let seg = 0; seg <= segments; seg++) {
        const t = seg / segments; // 0 = base, 1 = topo
        const segHeight = t * height;
        
        // Curvatura (mais curvatura no topo, mas SUAVE)
        const bendAmount = t * t * curve * 0.5; // multiplicador 0.5 para menos curvatura
        const bendX = Math.sin(bendAmount) * height * 0.3; // era 0.5, agora 0.3
        const bendY = segHeight - Math.cos(bendAmount) * height * 0.05; // era 0.1, agora 0.05
        
        // Largura diminui no topo (mas mantém volume)
        const segWidth = width * (1.0 - t * 0.3); // era 0.5, agora 0.3 (mais volume no topo)
        
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
        
        // Normais (arredondadas)
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
        
        // Grass data (para shader)
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
      
      // Índices (triângulos)
      const baseTriIdx = bladeIndex * indicesPerBlade;
      for (let seg = 0; seg < segments; seg++) {
        const v0 = baseIdx + seg * 2;
        const v1 = v0 + 1;
        const v2 = v0 + 2;
        const v3 = v0 + 3;
        
        const triIdx = baseTriIdx + seg * 6;
        
        // Triângulo 1
        indices[triIdx + 0] = v0;
        indices[triIdx + 1] = v2;
        indices[triIdx + 2] = v1;
        
        // Triângulo 2
        indices[triIdx + 3] = v1;
        indices[triIdx + 4] = v2;
        indices[triIdx + 5] = v3;
      }
      
      bladeIndex++;
    }
  }
  
  // Truncar arrays para o número real de lâminas
  const actualVerts = bladeIndex * vertsPerBlade;
  const actualIndices = bladeIndex * indicesPerBlade;
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, actualVerts * 3), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals.slice(0, actualVerts * 3), 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs.slice(0, actualVerts * 2), 2));
  geometry.setAttribute('grassData', new THREE.BufferAttribute(grassData.slice(0, actualVerts * 4), 4));
  geometry.setIndex(new THREE.BufferAttribute(indices.slice(0, actualIndices), 1));
  
  // Material com shader customizado
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWindStrength: { value: biomeConfig.windStrength },
      uWindFrequency: { value: 0.02 },
      uBaseColor: { value: biomeConfig.baseColor },
      uTipColor: { value: biomeConfig.tipColor },
      uInteractionPoints: {
        value: Array.from({ length: MAX_INTERACTION_POINTS }, () => new THREE.Vector4(0, 0, 0, 0)),
      },
      uInteractionCount: { value: 0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uWindStrength;
      uniform float uWindFrequency;
      uniform vec4 uInteractionPoints[8];
      uniform int uInteractionCount;
      
      attribute vec4 grassData; // worldPos.xyz, curve
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vHeight;
      varying float vAO;
      varying vec3 vViewDir;
      
      // Perlin noise simplificado
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
        
        // View direction para rim light e specular
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        vViewDir = normalize(-mvPos.xyz);
        
        // Vento procedural (MAIS MOVIMENTO)
        float windNoise = noise(worldPos.xz * uWindFrequency + uTime * 0.15); // era 0.1, agora 0.15 (mais rápido)
        float windStrength = noise(worldPos.xz * uWindFrequency * 0.5 + uTime * 0.2); // era 0.15, agora 0.2
        
        float windAngle = windNoise * 6.28318;
        vec2 windDir = vec2(cos(windAngle), sin(windAngle));
        
        // Aplicar vento (MAIS FORTE - movimento visível)
        float windEffect = windStrength * uWindStrength * vHeight * vHeight * vHeight; // cúbico para mais controle
        pos.x += windDir.x * windEffect;
        pos.z += windDir.y * windEffect;
        
        // Flutter (tremulação MAIS VISÍVEL)
        float flutter = noise(worldPos.xz * 0.5 + uTime * 3.0) * 0.025; // era 2.0 e 0.01, agora 3.0 e 0.025
        pos.x += flutter * vHeight;
        pos.z += flutter * vHeight * 0.5; // adiciona movimento em Z também

        // Interacao com objetos no chao (grama amassando)
        float trample = 0.0;
        for (int i = 0; i < 8; i++) {
          if (i >= uInteractionCount) {
            continue;
          }
          vec4 interaction = uInteractionPoints[i];
          float radius = max(interaction.z, 0.001);
          float distanceToPoint = distance(worldPos.xz, interaction.xy);
          float influence = (1.0 - smoothstep(radius * 0.25, radius, distanceToPoint)) * interaction.w;
          trample = max(trample, influence);
        }
        trample = clamp(trample, 0.0, 1.0);
        pos.y -= trample * vHeight * 0.25;
        
        // AO baseado em altura (mais escuro na base)
        vAO = mix(0.4, 1.0, vHeight * vHeight) * (1.0 - trample * 0.2);
        
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
      
      void main() {
        // Gradiente de cor (base → topo) - TONS MAIS SECOS
        float heightFactor = pow(vHeight, 1.2);
        vec3 grassColor = mix(uBaseColor, uTipColor, heightFactor);
        
        // Variação de cor por lâmina (mais realista)
        float colorVariation = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        grassColor *= 0.85 + colorVariation * 0.3; // 85-115% da cor base
        
        // Iluminação direcional (sol)
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
        float diff = max(dot(vNormal, lightDir), 0.0) * 0.7 + 0.3;
        
        // Rim light (contraluz sutil)
        float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
        rim = pow(rim, 3.0) * 0.15;
        
        // Specular sutil (brilho no topo)
        vec3 halfDir = normalize(lightDir + vViewDir);
        float spec = pow(max(dot(vNormal, halfDir), 0.0), 16.0) * 0.2 * vHeight;
        
        // Aplicar AO e iluminação
        vec3 finalColor = grassColor * diff * vAO;
        finalColor += rim; // contraluz
        finalColor += spec; // specular
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  
  // Função de animação
  const animate = (time: number) => {
    material.uniforms.uTime.value = time * 0.001;
  };

  const setInteractionPoints = (points: Array<{ x: number; z: number; radius: number; strength: number }>) => {
    const interactionUniform = material.uniforms.uInteractionPoints.value as THREE.Vector4[];
    const maxCount = Math.min(MAX_INTERACTION_POINTS, points.length);

    for (let i = 0; i < maxCount; i++) {
      const point = points[i];
      interactionUniform[i].set(
        point.x,
        point.z,
        Math.max(0.01, point.radius),
        THREE.MathUtils.clamp(point.strength, 0, 1),
      );
    }

    for (let i = maxCount; i < MAX_INTERACTION_POINTS; i++) {
      interactionUniform[i].set(0, 0, 0, 0);
    }

    material.uniforms.uInteractionCount.value = maxCount;
  };
  
  // Função de dispose
  const dispose = () => {
    geometry.dispose();
    material.dispose();
  };
  
  console.log(`✅ Grama AAA criada: ${bladeIndex} lâminas com ${segments} segmentos cada`);
  console.log(`🌿 Éden Pré-Dilúvio: vegetação exuberante e selvagem (Gênesis 2:6)`);
  console.log(`📊 Densidade: ${Math.round((bladeIndex / count) * 100)}% do máximo (${count} lâminas)`);
  console.log(`🌾 Variação: 60% grama alta (capim) + 40% grama baixa (cobertura)`);
  console.log(`🎨 Detalhes: ${segments} segmentos, largura 4-8cm, cell ${cell}`);
  
  return { mesh, animate, setInteractionPoints, dispose };
}
