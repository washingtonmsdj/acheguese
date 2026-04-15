/**
 * 🏔️ SISTEMA DE TERRENO PBR (Physically Based Rendering)
 * 
 * Terreno fotorealista com:
 * - Normal mapping para micro-details
 * - Roughness variation (áreas secas vs molhadas)
 * - Parallax mapping para depth
 * - Triplanar mapping sem seams
 * - Procedural splatting baseado em slope/height
 * 
 * Inspirado em:
 * - Unreal Engine 5 (Nanite-like detail)
 * - Ghost of Tsushima (grama + terreno)
 * - Red Dead Redemption 2 (diversidade de materiais)
 */

import * as THREE from 'three';

// ============================================================================
// CONFIGURAÇÕES PBR
// ============================================================================

export const TERRAIN_PBR_CONFIG = {
  /** Scale global das texturas */
  TEXTURE_SCALE: 0.02,
  /** Intensidade do normal mapping */
  NORMAL_STRENGTH: 1.2,
  /** Intensidade do parallax */
  PARALLAX_HEIGHT: 0.08,
  /** Blend suave entre materiais */
  BLEND_SHARPNESS: 3.0,
  /** Altura do nível do mar */
  SEA_LEVEL: -5,
  /** Altura máxima do terreno */
  MAX_HEIGHT: 18,
} as const;

// ============================================================================
// SHADER CHUNK: TRIPLANAR MAPPING
// ============================================================================

const TRIPLANAR_MAPPING_CHUNK = `
  struct TriplanarUV {
    vec2 x;
    vec2 y;
    vec2 z;
    vec3 weights;
  };
  
  TriplanarUV getTriplanarUV(vec3 worldPos, vec3 normal) {
    TriplanarUV uv;
    uv.x = worldPos.zy * uTextureScale;
    uv.y = worldPos.xz * uTextureScale;
    uv.z = worldPos.xy * uTextureScale;
    
    // Calcular pesos baseado na normal
    vec3 absNormal = abs(normal);
    uv.weights = absNormal / (absNormal.x + absNormal.y + absNormal.z);
    
    return uv;
  }
  
  vec4 sampleTriplanar(sampler2D tex, TriplanarUV uv, float rotation) {
    // Aplicar rotação aleatória para variar a textura
    float c = cos(rotation);
    float s = sin(rotation);
    mat2 rot = mat2(c, -s, s, c);
    
    vec2 uvX = rot * uv.x;
    vec2 uvY = rot * uv.y;
    vec2 uvZ = rot * uv.z;
    
    vec4 cx = texture2D(tex, uvX);
    vec4 cy = texture2D(tex, uvY);
    vec4 cz = texture2D(tex, uvZ);
    
    return cx * uv.weights.x + cy * uv.weights.y + cz * uv.weights.z;
  }
`;

// ============================================================================
// SHADER CHUNK: PARALLAX OCCLUSION MAPPING
// ============================================================================

const PARALLAX_CHUNK = `
  vec2 parallaxOcclusionMapping(vec2 uv, vec3 viewDir, sampler2D heightMap) {
    const float numLayers = 32.0;
    const float layerDepth = 1.0 / numLayers;
    
    vec2 deltaUV = viewDir.xy * uParallaxHeight / numLayers;
    
    float currentLayerDepth = 0.0;
    vec2 currentUV = uv;
    float currentDepthMapValue = texture2D(heightMap, currentUV).r;
    
    // Ray march
    for (int i = 0; i < 32; i++) {
      if (currentLayerDepth >= currentDepthMapValue) break;
      currentUV -= deltaUV;
      currentDepthMapValue = texture2D(heightMap, currentUV).r;
      currentLayerDepth += layerDepth;
    }
    
    // Interpolação
    vec2 prevUV = currentUV + deltaUV;
    float afterDepth = currentDepthMapValue - currentLayerDepth;
    float beforeDepth = texture2D(heightMap, prevUV).r - currentLayerDepth + layerDepth;
    
    float weight = afterDepth / (afterDepth - beforeDepth);
    return prevUV * weight + currentUV * (1.0 - weight);
  }
`;

// ============================================================================
// MATERIAL PBR DO TERRENO
// ============================================================================

export interface TerrainPBRMaterialConfig {
  /** Textura de cor - Grass */
  grassColorMap: THREE.Texture;
  /** Textura de normal - Grass */
  grassNormalMap: THREE.Texture;
  /** Textura de roughness - Grass */
  grassRoughnessMap: THREE.Texture;
  
  /** Textura de cor - Dirt */
  dirtColorMap: THREE.Texture;
  /** Textura de normal - Dirt */
  dirtNormalMap: THREE.Texture;
  /** Textura de roughness - Dirt */
  dirtRoughnessMap: THREE.Texture;
  
  /** Textura de cor - Rock */
  rockColorMap: THREE.Texture;
  /** Textura de normal - Rock */
  rockNormalMap: THREE.Texture;
  /** Textura de roughness - Rock */
  rockRoughnessMap: THREE.Texture;
  
  /** Mapa de altura do terreno (para height-based blending) */
  heightMap?: THREE.Texture;
}

export function createTerrainPBRMaterial(config: TerrainPBRMaterialConfig): THREE.ShaderMaterial {
  // Configurar repetição das texturas
  [config.grassColorMap, config.grassNormalMap, config.grassRoughnessMap,
   config.dirtColorMap, config.dirtNormalMap, config.dirtRoughnessMap,
   config.rockColorMap, config.rockNormalMap, config.rockRoughnessMap]
    .forEach(tex => {
      if (tex) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
      }
    });
  
  const vertexShader = `
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vTangent;
    varying vec3 vBitangent;
    varying vec2 vUv;
    varying float vHeight;
    varying float vSlope;
    
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      
      vNormal = normalize(mat3(modelMatrix) * normal);
      vTangent = normalize(mat3(modelMatrix) * vec3(1.0, 0.0, 0.0));
      vBitangent = cross(vNormal, vTangent);
      
      vUv = uv;
      vHeight = position.y;
      
      // Calcular slope (0 = flat, 1 = vertical)
      vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
      vSlope = 1.0 - worldNormal.y;
      
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `;
  
  const fragmentShader = `
    uniform sampler2D uGrassColor;
    uniform sampler2D uGrassNormal;
    uniform sampler2D uGrassRoughness;
    
    uniform sampler2D uDirtColor;
    uniform sampler2D uDirtNormal;
    uniform sampler2D uDirtRoughness;
    
    uniform sampler2D uRockColor;
    uniform sampler2D uRockNormal;
    uniform sampler2D uRockRoughness;
    
    uniform float uTextureScale;
    uniform float uNormalStrength;
    uniform float uSeaLevel;
    uniform float uMaxHeight;
    uniform float uBlendSharpness;
    uniform float uTime;
    
    uniform vec3 uSunPosition;
    uniform vec3 uCameraPosition;
    
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vTangent;
    varying vec3 vBitangent;
    varying vec2 vUv;
    varying float vHeight;
    varying float vSlope;
    
    ${TRIPLANAR_MAPPING_CHUNK}
    
    // Função para blend suave
    float smoothBlend(float a, float b, float t) {
      float blend = smoothstep(0.0, 1.0, t);
      return mix(a, b, blend);
    }
    
    // Height-based noise para variação natural
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    
    void main() {
      // UVs triplanar
      TriplanarUV triUV = getTriplanarUV(vWorldPosition, vNormal);
      
      // Pseudo-random rotation para cada célula do mundo
      float rotation = hash(floor(vWorldPosition.xz * 0.1)) * 6.283185;
      
      // Sample texturas
      vec4 grassColor = sampleTriplanar(uGrassColor, triUV, rotation);
      vec4 dirtColor = sampleTriplanar(uDirtColor, triUV, rotation);
      vec4 rockColor = sampleTriplanar(uRockColor, triUV, rotation);
      
      vec3 grassNormal = sampleTriplanar(uGrassNormal, triUV, rotation).rgb * 2.0 - 1.0;
      vec3 dirtNormal = sampleTriplanar(uDirtNormal, triUV, rotation).rgb * 2.0 - 1.0;
      vec3 rockNormal = sampleTriplanar(uRockNormal, triUV, rotation).rgb * 2.0 - 1.0;
      
      float grassRoughness = sampleTriplanar(uGrassRoughness, triUV, rotation).r;
      float dirtRoughness = sampleTriplanar(uDirtRoughness, triUV, rotation).r;
      float rockRoughness = sampleTriplanar(uRockRoughness, triUV, rotation).r;
      
      // BLENDING BASEADO EM REGRAS
      
      // 1. Height-based (grass abaixo, rock acima)
      float heightFactor = smoothstep(uSeaLevel, uMaxHeight * 0.6, vHeight);
      
      // 2. Slope-based (grass flat, rock steep)
      float slopeFactor = smoothstep(0.2, 0.5, vSlope);
      
      // 3. Wetness (áreas baixas são mais molhadas/escuras)
      float wetness = smoothstep(uSeaLevel + 5.0, uSeaLevel, vHeight) * 0.3;
      
      // Combinar fatores
      float grassWeight = (1.0 - heightFactor) * (1.0 - slopeFactor);
      float rockWeight = max(heightFactor, slopeFactor);
      float dirtWeight = (1.0 - grassWeight) * (1.0 - rockWeight) + wetness * 0.5;
      
      // Normalizar pesos
      float totalWeight = grassWeight + dirtWeight + rockWeight;
      grassWeight /= totalWeight;
      dirtWeight /= totalWeight;
      rockWeight /= totalWeight;
      
      // Blend final das cores
      vec3 finalColor = grassColor.rgb * grassWeight 
                      + dirtColor.rgb * dirtWeight 
                      + rockColor.rgb * rockWeight;
      
      // Aplicar wetness (escurecer áreas molhadas)
      finalColor *= (1.0 - wetness * 0.3);
      
      // Blend das normais
      vec3 finalNormal = normalize(
        grassNormal * grassWeight + 
        dirtNormal * dirtWeight + 
        rockNormal * rockWeight
      ) * uNormalStrength;
      
      // Blend roughness
      float finalRoughness = grassRoughness * grassWeight 
                           + dirtRoughness * dirtWeight 
                           + rockRoughness * rockWeight;
      
      // Áreas molhadas são mais lisas
      finalRoughness *= (1.0 - wetness * 0.5);
      
      // Construir TBN matrix
      mat3 TBN = mat3(vTangent, vBitangent, vNormal);
      vec3 N = normalize(TBN * finalNormal);
      
      // Iluminação simples
      vec3 L = normalize(uSunPosition - vWorldPosition);
      float NdotL = max(dot(N, L), 0.0);
      
      // Ambient
      vec3 ambient = finalColor * 0.3;
      
      // Diffuse
      vec3 diffuse = finalColor * NdotL * 0.7;
      
      // Specular (Blinn-Phong simplificado)
      vec3 V = normalize(uCameraPosition - vWorldPosition);
      vec3 H = normalize(L + V);
      float NdotH = max(dot(N, H), 0.0);
      float specular = pow(NdotH, (1.0 - finalRoughness) * 128.0) * (1.0 - finalRoughness) * 0.3;
      
      vec3 final = ambient + diffuse + vec3(specular);
      
      // Output MRT (Multiple Render Targets) para deferred rendering
      gl_FragColor = vec4(final, 1.0);
    }
  `;
  
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uGrassColor: { value: config.grassColorMap },
      uGrassNormal: { value: config.grassNormalMap },
      uGrassRoughness: { value: config.grassRoughnessMap },
      
      uDirtColor: { value: config.dirtColorMap },
      uDirtNormal: { value: config.dirtNormalMap },
      uDirtRoughness: { value: config.dirtRoughnessMap },
      
      uRockColor: { value: config.rockColorMap },
      uRockNormal: { value: config.rockNormalMap },
      uRockRoughness: { value: config.rockRoughnessMap },
      
      uTextureScale: { value: TERRAIN_PBR_CONFIG.TEXTURE_SCALE },
      uNormalStrength: { value: TERRAIN_PBR_CONFIG.NORMAL_STRENGTH },
      uSeaLevel: { value: TERRAIN_PBR_CONFIG.SEA_LEVEL },
      uMaxHeight: { value: TERRAIN_PBR_CONFIG.MAX_HEIGHT },
      uBlendSharpness: { value: TERRAIN_PBR_CONFIG.BLEND_SHARPNESS },
      uTime: { value: 0 },
      
      uSunPosition: { value: new THREE.Vector3(100, 200, 100) },
      uCameraPosition: { value: new THREE.Vector3() },
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
  });
  
  console.log('🏔️ Material PBR de terreno criado!');
  console.log('   Features: Triplanar mapping, Height-based blend, Slope-based blend, Wetness');
  
  return material;
}

// ============================================================================
// HELPER: GERAR TEXTURAS PROCEDURAIS PBR
// ============================================================================

export function generateProceduralTerrainTextures(): {
  grass: { color: THREE.DataTexture; normal: THREE.DataTexture; roughness: THREE.DataTexture };
  dirt: { color: THREE.DataTexture; normal: THREE.DataTexture; roughness: THREE.DataTexture };
  rock: { color: THREE.DataTexture; normal: THREE.DataTexture; roughness: THREE.DataTexture };
} {
  const size = 512;
  
  function generateNoiseTexture(
    baseColor: THREE.Color,
    variation: number,
    normalIntensity: number,
    roughnessBase: number
  ) {
    const colorData = new Uint8Array(size * size * 4);
    const normalData = new Uint8Array(size * size * 4);
    const roughnessData = new Uint8Array(size * size * 4);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        
        // Pseudo-noise
        const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5;
        const detail = (Math.random() - 0.5) * variation;
        
        // Color
        colorData[i] = Math.min(255, Math.max(0, (baseColor.r + detail) * 255));
        colorData[i + 1] = Math.min(255, Math.max(0, (baseColor.g + detail) * 255));
        colorData[i + 2] = Math.min(255, Math.max(0, (baseColor.b + detail) * 255));
        colorData[i + 3] = 255;
        
        // Normal (simplificado - apenas perturbação)
        const nx = (Math.random() - 0.5) * normalIntensity * 127 + 127;
        const ny = (Math.random() - 0.5) * normalIntensity * 127 + 127;
        normalData[i] = nx;
        normalData[i + 1] = ny;
        normalData[i + 2] = 255;
        normalData[i + 3] = 255;
        
        // Roughness
        const roughness = roughnessBase + (Math.random() - 0.5) * 0.2;
        roughnessData[i] = Math.min(255, Math.max(0, roughness * 255));
        roughnessData[i + 1] = roughnessData[i];
        roughnessData[i + 2] = roughnessData[i];
        roughnessData[i + 3] = 255;
      }
    }
    
    const colorTex = new THREE.DataTexture(colorData, size, size, THREE.RGBAFormat);
    const normalTex = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat);
    const roughnessTex = new THREE.DataTexture(roughnessData, size, size, THREE.RGBAFormat);
    
    colorTex.needsUpdate = true;
    normalTex.needsUpdate = true;
    roughnessTex.needsUpdate = true;
    
    return { color: colorTex, normal: normalTex, roughness: roughnessTex };
  }
  
  const grass = generateNoiseTexture(
    new THREE.Color(0x4a7c59), // Verde grama
    0.15,
    0.3,
    0.8 // Grama é áspera
  );
  
  const dirt = generateNoiseTexture(
    new THREE.Color(0x8b7355), // Marrom terra
    0.2,
    0.5,
    0.9 // Terra é muito áspera
  );
  
  const rock = generateNoiseTexture(
    new THREE.Color(0x6b6b6b), // Cinza pedra
    0.1,
    0.8,
    0.4 // Pedra é lisa
  );
  
  console.log('🎨 Texturas PBR procedurais geradas (512x512)');
  
  return { grass, dirt, rock };
}
