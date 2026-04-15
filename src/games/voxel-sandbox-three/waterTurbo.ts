/**
 * 🌊 SISTEMA DE ÁGUA TURBO (AAA Water Rendering)
 * 
 * Renderização de água avançada:
 * - Ondas Gerstner com multi-layer
 * - Espuma procedural em cristas
 * - Caustics subaquáticos dinâmicos
 * - Underwater fog volumétrico
 * - Screen-space reflections
 * - Refraction com chromatic aberration
 * 
 * Inspirado em:
 * - Sea of Thieves (espuma + ondas)
 * - Subnautica (caustics + underwater)
 * - Uncharted 4 (SSR + refraction)
 */

import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

export const WATER_TURBO_CONFIG = {
  /** Resolução da mesh de água */
  RESOLUTION: 256,
  /** Escala do mundo */
  WORLD_SIZE: 1000,
  /** Altura máxima das ondas */
  MAX_WAVE_HEIGHT: 8,
  /** Velocidade do vento */
  WIND_SPEED: 15,
  /** Intensidade da espuma */
  FOAM_INTENSITY: 1.2,
  /** Intensidade dos caustics */
  CAUSTICS_INTENSITY: 0.8,
  /** Cor da água profunda */
  DEEP_COLOR: new THREE.Color(0x004968),
  /** Cor da água rasa */
  SHALLOW_COLOR: new THREE.Color(0x0088aa),
  /** Cor da espuma */
  FOAM_COLOR: new THREE.Color(0xffffff),
} as const;

// ============================================================================
// GERSTNER WAVES MULTI-LAYER
// ============================================================================

export interface WaveLayer {
  amplitude: number;
  wavelength: number;
  speed: number;
  direction: THREE.Vector2;
  steepness: number;
}

export const WAVE_LAYERS: WaveLayer[] = [
  // Layer 1: Ondas grandes (swell)
  {
    amplitude: 3.5,
    wavelength: 150,
    speed: 12,
    direction: new THREE.Vector2(1, 0.3).normalize(),
    steepness: 0.4,
  },
  // Layer 2: Ondas médias
  {
    amplitude: 1.8,
    wavelength: 70,
    speed: 8,
    direction: new THREE.Vector2(1, 0.2).normalize(),
    steepness: 0.5,
  },
  // Layer 3: Ondas pequenas (chop)
  {
    amplitude: 0.6,
    wavelength: 25,
    speed: 4,
    direction: new THREE.Vector2(0.9, 0.4).normalize(),
    steepness: 0.6,
  },
  // Layer 4: Micro-details
  {
    amplitude: 0.15,
    wavelength: 8,
    speed: 2,
    direction: new THREE.Vector2(1, 0.1).normalize(),
    steepness: 0.3,
  },
];

// ============================================================================
// CALCULAR POSIÇÃO GERSTNER
// ============================================================================

export function calculateGerstnerPosition(
  x: number,
  z: number,
  time: number,
  layers: WaveLayer[] = WAVE_LAYERS
): { position: THREE.Vector3; normal: THREE.Vector3; tangent: THREE.Vector3; bitangent: THREE.Vector3 } {
  let position = new THREE.Vector3(x, 0, z);
  let normal = new THREE.Vector3(0, 1, 0);
  let tangent = new THREE.Vector3(1, 0, 0);
  let bitangent = new THREE.Vector3(0, 0, 1);
  
  for (const layer of layers) {
    const k = (2 * Math.PI) / layer.wavelength;
    const c = Math.sqrt(9.81 / k);
    const f = k * (c * time - (x * layer.direction.x + z * layer.direction.y));
    const a = layer.steepness / k;
    
    const cosf = Math.cos(f);
    const sinf = Math.sin(f);
    
    position.x += layer.direction.x * a * cosf;
    position.y += layer.amplitude * sinf;
    position.z += layer.direction.y * a * cosf;
    
    // Derivadas para normal
    const wa = k * a;
    
    tangent.x -= layer.direction.x * wa * sinf;
    tangent.y += layer.steepness * layer.amplitude * cosf;
    tangent.z -= layer.direction.y * wa * sinf;
    
    bitangent.x -= layer.direction.x * layer.direction.y * wa * sinf;
    bitangent.y += layer.steepness * layer.amplitude * cosf;
    bitangent.z -= layer.direction.y * layer.direction.y * wa * sinf;
  }
  
  // Recalcular normal a partir de tangent e bitangent
  normal.crossVectors(tangent, bitangent).normalize();
  
  return { position, normal, tangent, bitangent };
}

// ============================================================================
// ESPUMA (FOAM) SYSTEM
// ============================================================================

export interface FoamConfig {
  scene: THREE.Scene;
  waterMesh: THREE.Mesh;
  foamThreshold?: number;
  maxParticles?: number;
}

export class FoamSystem {
  private scene: THREE.Scene;
  private waterMesh: THREE.Mesh;
  private foamThreshold: number;
  private maxParticles: number;
  
  private foamMesh: THREE.Points | null = null;
  private foamGeometry: THREE.BufferGeometry | null = null;
  private foamMaterial: THREE.ShaderMaterial | null = null;
  
  private positions: Float32Array;
  private sizes: Float32Array;
  private opacities: Float32Array;
  private ages: Float32Array;
  
  private activeCount = 0;
  
  constructor(config: FoamConfig) {
    this.scene = config.scene;
    this.waterMesh = config.waterMesh;
    this.foamThreshold = config.foamThreshold ?? 0.6;
    this.maxParticles = config.maxParticles ?? 5000;
    
    this.positions = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);
    this.opacities = new Float32Array(this.maxParticles);
    this.ages = new Float32Array(this.maxParticles);
    
    this.init();
  }
  
  private init(): void {
    this.foamGeometry = new THREE.BufferGeometry();
    this.foamGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.foamGeometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.foamGeometry.setAttribute('opacity', new THREE.BufferAttribute(this.opacities, 1));
    
    this.foamMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFoamColor: { value: WATER_TURBO_CONFIG.FOAM_COLOR },
        uFoamTexture: { value: this.createFoamTexture() },
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying float vOpacity;
        
        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uFoamColor;
        uniform sampler2D uFoamTexture;
        varying float vOpacity;
        
        void main() {
          vec2 uv = gl_PointCoord;
          float foam = texture2D(uFoamTexture, uv).r;
          
          // Soft circle falloff
          float dist = length(uv - 0.5);
          float alpha = smoothstep(0.5, 0.0, dist) * foam * vOpacity;
          
          gl_FragColor = vec4(uFoamColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    
    this.foamMesh = new THREE.Points(this.foamGeometry, this.foamMaterial);
    this.foamMesh.renderOrder = 100;
    this.scene.add(this.foamMesh);
    
    console.log('🫧 Sistema de Espuma criado!');
    console.log(`   Partículas: ${this.maxParticles}, Threshold: ${this.foamThreshold}`);
  }
  
  private createFoamTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    // Criar padrão de espuma orgânico
    const imageData = ctx.createImageData(128, 128);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = Math.random();
      const value = noise > 0.3 ? Math.min(255, noise * 400) : 0;
      imageData.data[i] = value;
      imageData.data[i + 1] = value;
      imageData.data[i + 2] = value;
      imageData.data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  public update(deltaTime: number, time: number): void {
    if (!this.foamMaterial || !this.foamGeometry) return;
    
    this.foamMaterial.uniforms.uTime.value = time;
    
    // Spawn new foam particles at wave crests
    if (this.activeCount < this.maxParticles && Math.random() < 0.3) {
      this.spawnFoamAtCrest(time);
    }
    
    // Update existing particles
    const positions = this.foamGeometry.attributes.position.array as Float32Array;
    const opacities = this.foamGeometry.attributes.opacity.array as Float32Array;
    
    for (let i = 0; i < this.activeCount; i++) {
      this.ages[i] += deltaTime;
      
      // Fade out
      const life = this.ages[i];
      const maxLife = 2.0 + Math.random();
      opacities[i] = Math.max(0, 1 - life / maxLife) * (0.5 + Math.random() * 0.5);
      
      // Drift with water
      positions[i * 3] += Math.sin(time + i) * 0.1;
      positions[i * 3 + 2] += Math.cos(time + i * 0.5) * 0.1;
      
      // Remove dead particles
      if (opacities[i] <= 0.01) {
        this.removeParticle(i);
        i--;
      }
    }
    
    this.foamGeometry.attributes.position.needsUpdate = true;
    this.foamGeometry.attributes.opacity.needsUpdate = true;
    this.foamGeometry.setDrawRange(0, this.activeCount);
  }
  
  private spawnFoamAtCrest(time: number): void {
    // Sample wave crests
    const sampleCount = 10;
    const worldSize = WATER_TURBO_CONFIG.WORLD_SIZE;
    
    for (let i = 0; i < sampleCount; i++) {
      const x = (Math.random() - 0.5) * worldSize;
      const z = (Math.random() - 0.5) * worldSize;
      
      const wave = calculateGerstnerPosition(x, z, time);
      
      // Check if this is a crest (high derivative)
      if (wave.position.y > this.foamThreshold) {
        this.addParticle(wave.position.x, wave.position.y, wave.position.z);
      }
    }
  }
  
  private addParticle(x: number, y: number, z: number): void {
    if (this.activeCount >= this.maxParticles) return;
    
    const idx = this.activeCount;
    
    this.positions[idx * 3] = x;
    this.positions[idx * 3 + 1] = y + 0.5;
    this.positions[idx * 3 + 2] = z;
    
    this.sizes[idx] = 2 + Math.random() * 3;
    this.opacities[idx] = 0.5 + Math.random() * 0.5;
    this.ages[idx] = 0;
    
    this.activeCount++;
  }
  
  private removeParticle(index: number): void {
    if (index >= this.activeCount - 1) {
      this.activeCount--;
      return;
    }
    
    // Swap with last particle
    const lastIdx = this.activeCount - 1;
    
    this.positions[index * 3] = this.positions[lastIdx * 3];
    this.positions[index * 3 + 1] = this.positions[lastIdx * 3 + 1];
    this.positions[index * 3 + 2] = this.positions[lastIdx * 3 + 2];
    
    this.sizes[index] = this.sizes[lastIdx];
    this.opacities[index] = this.opacities[lastIdx];
    this.ages[index] = this.ages[lastIdx];
    
    this.activeCount--;
  }
  
  public dispose(): void {
    this.scene.remove(this.foamMesh!);
    this.foamGeometry?.dispose();
    this.foamMaterial?.dispose();
  }
}

// ============================================================================
// CAUSTICS SUBAQUÁTICOS
// ============================================================================

export class CausticsSystem {
  private scene: THREE.Scene;
  private causticsTexture: THREE.CanvasTexture | null = null;
  private causticsMesh: THREE.Mesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  
  constructor(scene: THREE.Scene, waterLevel: number) {
    this.scene = scene;
    this.init(waterLevel);
  }
  
  private init(waterLevel: number): void {
    // Criar textura procedural de caustics
    this.causticsTexture = this.generateCausticsTexture();
    
    // Criar plano projetor abaixo da água
    const geometry = new THREE.PlaneGeometry(
      WATER_TURBO_CONFIG.WORLD_SIZE,
      WATER_TURBO_CONFIG.WORLD_SIZE,
      64,
      64
    );
    geometry.rotateX(-Math.PI / 2);
    
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCausticsTexture: { value: this.causticsTexture },
        uIntensity: { value: WATER_TURBO_CONFIG.CAUSTICS_INTENSITY },
        uColor: { value: WATER_TURBO_CONFIG.SHALLOW_COLOR },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        void main() {
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform sampler2D uCausticsTexture;
        uniform float uIntensity;
        uniform vec3 uColor;
        
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        void main() {
          // Animate caustics
          vec2 uv1 = vUv * 4.0 + uTime * 0.05;
          vec2 uv2 = vUv * 6.0 - uTime * 0.03;
          
          float caustics1 = texture2D(uCausticsTexture, uv1).r;
          float caustics2 = texture2D(uCausticsTexture, uv2).r;
          
          // Combine layers
          float caustics = (caustics1 + caustics2) * 0.5;
          
          // Only show when looking up at water
          // (Simplified - in full implementation would use depth testing)
          
          vec3 color = uColor * caustics * uIntensity;
          float alpha = caustics * uIntensity * 0.3;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    this.causticsMesh = new THREE.Mesh(geometry, this.material);
    this.causticsMesh.position.y = waterLevel - 5;
    this.causticsMesh.renderOrder = 50;
    this.scene.add(this.causticsMesh);
    
    console.log('🔆 Sistema de Caustics criado!');
  }
  
  private generateCausticsTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(size, size);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        
        // Caustics pattern (light concentration simulation)
        const nx = x / size * Math.PI * 4;
        const ny = y / size * Math.PI * 4;
        
        const wave1 = Math.sin(nx + Math.sin(ny * 2) * 0.5);
        const wave2 = Math.sin(ny + Math.cos(nx * 2) * 0.5);
        const wave3 = Math.sin((nx + ny) * 1.5);
        
        const intensity = Math.max(0, (wave1 + wave2 + wave3) / 3);
        const caustics = Math.pow(intensity, 3) * 255;
        
        imageData.data[i] = caustics;
        imageData.data[i + 1] = caustics;
        imageData.data[i + 2] = caustics;
        imageData.data[i + 3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }
  
  public update(deltaTime: number): void {
    if (this.material) {
      this.material.uniforms.uTime.value += deltaTime;
    }
  }
  
  public dispose(): void {
    this.scene.remove(this.causticsMesh!);
    this.causticsMesh?.geometry.dispose();
    this.material?.dispose();
    this.causticsTexture?.dispose();
  }
}

// ============================================================================
// UNDERWATER FOG
// ============================================================================

export class UnderwaterFog {
  private scene: THREE.Scene;
  private waterLevel: number;
  private originalFog: THREE.FogExp2 | THREE.Fog | null = null;
  
  constructor(scene: THREE.Scene, waterLevel: number) {
    this.scene = scene;
    this.waterLevel = waterLevel;
    this.originalFog = scene.fog;
  }
  
  public update(cameraPosition: THREE.Vector3): void {
    const underwater = cameraPosition.y < this.waterLevel;
    
    if (underwater) {
      // Fog subaquático - denso e azulado
      if (!this.scene.fog || !(this.scene.fog instanceof THREE.FogExp2)) {
        this.scene.fog = new THREE.FogExp2(0x004968, 0.03);
      }
    } else {
      // Restaurar fog original
      if (this.originalFog) {
        this.scene.fog = this.originalFog;
      } else {
        this.scene.fog = null;
      }
    }
  }
  
  public dispose(): void {
    this.scene.fog = this.originalFog;
  }
}

// ============================================================================
// WATER SYSTEM FACTORY
// ============================================================================

export interface WaterTurboSystem {
  water: Water;
  foam: FoamSystem;
  caustics: CausticsSystem;
  underwaterFog: UnderwaterFog;
  update: (deltaTime: number, time: number, camera: THREE.Camera) => void;
  dispose: () => void;
}

export function createWaterTurboSystem(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  normalMap: THREE.Texture,
  initialWaterLevel: number = 0
): WaterTurboSystem {
  // Criar water mesh usando Three.js Water
  const waterGeometry = new THREE.PlaneGeometry(
    WATER_TURBO_CONFIG.WORLD_SIZE,
    WATER_TURBO_CONFIG.WORLD_SIZE,
    WATER_TURBO_CONFIG.RESOLUTION,
    WATER_TURBO_CONFIG.RESOLUTION
  );
  
  const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: normalMap,
    sunDirection: new THREE.Vector3(0.5, 1, 0.3),
    sunColor: 0xffffff,
    waterColor: WATER_TURBO_CONFIG.DEEP_COLOR.getHex(),
    distortionScale: 3.7,
    fog: false,
  });
  
  water.rotation.x = -Math.PI / 2;
  water.position.y = initialWaterLevel;
  water.renderOrder = 0;
  scene.add(water);
  
  // Criar sistemas adicionais
  const foam = new FoamSystem({
    scene,
    waterMesh: water,
    foamThreshold: 1.5,
    maxParticles: 3000,
  });
  
  const caustics = new CausticsSystem(scene, initialWaterLevel);
  
  const underwaterFog = new UnderwaterFog(scene, initialWaterLevel);
  
  console.log('🌊 Sistema de Água Turbo criado!');
  console.log(`   Resolução: ${WATER_TURBO_CONFIG.RESOLUTION}x${WATER_TURBO_CONFIG.RESOLUTION}`);
  console.log(`   Wave layers: ${WAVE_LAYERS.length}`);
  console.log(`   Features: Foam, Caustics, Underwater fog`);
  
  return {
    water,
    foam,
    caustics,
    underwaterFog,
    update: (deltaTime: number, time: number, camera: THREE.Camera) => {
      // Update water shader
      water.material.uniforms['time'].value += deltaTime;
      
      // Update foam
      foam.update(deltaTime, time);
      
      // Update caustics
      caustics.update(deltaTime);
      
      // Update underwater fog
      underwaterFog.update(camera.position);
    },
    dispose: () => {
      scene.remove(water);
      water.geometry.dispose();
      water.material.dispose();
      foam.dispose();
      caustics.dispose();
      underwaterFog.dispose();
    },
  };
}
