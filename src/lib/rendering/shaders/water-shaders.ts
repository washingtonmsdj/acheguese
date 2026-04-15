/**
 * Shaders de Água - Engine SSOT
 * 
 * Shaders reutilizáveis para efeitos de água AAA:
 * - Espuma (foam) nas cristas
 * - Caustics (cáusticas subaquáticas)
 * - Reflexões e refrações
 * - Partículas de água
 * 
 * Baseado em:
 * - Sea of Thieves (espuma procedural)
 * - Subnautica (caustics)
 * - Unreal Engine (water shaders)
 */

import * as THREE from "three";

/**
 * Shader de espuma (foam) nas cristas das ondas
 * 
 * Características:
 * - Círculos suaves com textura procedural
 * - Fade baseado em lifetime
 * - Blending aditivo para brilho
 */
export const FOAM_SHADER = {
  uniforms: {
    color: { value: new THREE.Color(0xffffff) },
    time: { value: 0 },
  },
  
  vertexShader: `
    attribute float size;
    attribute float lifetime;
    attribute vec3 velocity;
    varying float vLifetime;
    varying vec2 vUv;
    
    void main() {
      vLifetime = lifetime;
      vUv = uv;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * 150.0 / -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  
  fragmentShader: `
    uniform vec3 color;
    varying float vLifetime;
    
    void main() {
      // Círculo suave (espuma)
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      
      // Círculo com borda suave + textura procedural
      float circle = smoothstep(0.5, 0.2, dist);
      float noise = fract(sin(dot(coord, vec2(12.9898, 78.233))) * 43758.5453);
      float foam = circle * (0.7 + 0.3 * noise);
      
      // Fade baseado em lifetime
      float alpha = foam * (0.5 + 0.5 * sin(vLifetime * 3.14159)) * 0.8;
      
      if (alpha < 0.05) discard;
      
      gl_FragColor = vec4(color, alpha);
    }
  `,
} as const;

/**
 * Shader de splash (impacto de chuva na água)
 * 
 * Características:
 * - Anel expansivo (círculo oco)
 * - Fade rápido
 * - Blending aditivo
 */
export const SPLASH_SHADER = {
  uniforms: {
    color: { value: new THREE.Color(0xffffff) },
  },
  
  vertexShader: `
    attribute float size;
    attribute float lifetime;
    varying float vLifetime;
    
    void main() {
      vLifetime = lifetime;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * 250.0 / -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  
  fragmentShader: `
    uniform vec3 color;
    varying float vLifetime;
    
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      
      // Anel de splash (círculo oco)
      float ring = smoothstep(0.5, 0.3, dist) * smoothstep(0.1, 0.3, dist);
      float alpha = ring * (1.0 - vLifetime) * 0.8;
      
      if (alpha < 0.05) discard;
      
      gl_FragColor = vec4(color, alpha);
    }
  `,
} as const;

/**
 * Shader de névoa (mist) sobre a água
 * 
 * Características:
 * - Círculos muito suaves (difusos)
 * - Opacidade baixa
 * - Movimento lento
 */
export const MIST_SHADER = {
  uniforms: {
    color: { value: new THREE.Color(0xffffff) },
  },
  
  vertexShader: `
    attribute float size;
    attribute float lifetime;
    varying float vLifetime;
    
    void main() {
      vLifetime = lifetime;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * 100.0 / -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  
  fragmentShader: `
    uniform vec3 color;
    varying float vLifetime;
    
    void main() {
      // Névoa suave e difusa
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      
      // Círculo muito suave (névoa)
      float mist = smoothstep(0.5, 0.0, dist);
      float alpha = mist * 0.1 * (0.5 + 0.5 * sin(vLifetime * 3.14159));
      
      if (alpha < 0.01) discard;
      
      gl_FragColor = vec4(color, alpha);
    }
  `,
} as const;

/**
 * Shader de respingos (rain splash)
 * 
 * Características:
 * - Círculos suaves (não quadrados)
 * - Fade rápido
 * - Tamanho pequeno
 */
export const RAIN_SPLASH_SHADER = {
  uniforms: {
    color: { value: new THREE.Color(0xffffff) },
  },
  
  vertexShader: `
    attribute float size;
    attribute float lifetime;
    varying float vLifetime;
    
    void main() {
      vLifetime = lifetime;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * 300.0 / -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  
  fragmentShader: `
    uniform vec3 color;
    varying float vLifetime;
    
    void main() {
      // Criar círculo suave (não quadrado!)
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      
      // Círculo com borda suave
      float circle = smoothstep(0.5, 0.3, dist);
      float alpha = circle * (1.0 - vLifetime) * 0.6;
      
      if (alpha < 0.05) discard;
      
      gl_FragColor = vec4(color, alpha);
    }
  `,
} as const;

/**
 * Shader de caustics (cáusticas subaquáticas)
 * 
 * Características:
 * - Padrão procedural de luz refratada
 * - Animação baseada em tempo
 * - Projetado no fundo do oceano
 * 
 * Baseado em: Subnautica
 */
export const CAUSTICS_SHADER = {
  uniforms: {
    time: { value: 0 },
    waterLevel: { value: 0 },
    intensity: { value: 1.0 },
    scale: { value: 10.0 },
  },
  
  vertexShader: `
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    
    void main() {
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  
  fragmentShader: `
    uniform float time;
    uniform float waterLevel;
    uniform float intensity;
    uniform float scale;
    
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    
    // Função de ruído procedural
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
    
    // Caustics procedurais
    float caustics(vec2 uv, float time) {
      vec2 p = uv * scale;
      
      // Duas camadas de ruído animado
      float c1 = noise(p + time * 0.5);
      float c2 = noise(p * 1.3 - time * 0.7);
      
      // Combinar e criar padrão de caustics
      float c = c1 * c2;
      c = pow(c, 3.0) * 2.0;
      
      return c;
    }
    
    void main() {
      // Apenas aplicar caustics abaixo da água
      if (vWorldPosition.y > waterLevel) {
        discard;
      }
      
      // Profundidade abaixo da água
      float depth = waterLevel - vWorldPosition.y;
      
      // Fade com profundidade (caustics mais fracas em águas profundas)
      float depthFade = smoothstep(20.0, 0.0, depth);
      
      // Calcular caustics
      vec2 uv = vWorldPosition.xz;
      float c = caustics(uv, time);
      
      // Aplicar intensidade e fade
      c *= intensity * depthFade;
      
      // Cor azulada da água
      vec3 waterTint = vec3(0.2, 0.4, 0.6);
      vec3 color = mix(waterTint, vec3(1.0), c);
      
      gl_FragColor = vec4(color, c * 0.5);
    }
  `,
} as const;

/**
 * Criar material de espuma
 * 
 * @returns Material configurado para espuma
 */
export function createFoamMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(FOAM_SHADER.uniforms),
    vertexShader: FOAM_SHADER.vertexShader,
    fragmentShader: FOAM_SHADER.fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * Criar material de splash
 * 
 * @returns Material configurado para splash
 */
export function createSplashMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(SPLASH_SHADER.uniforms),
    vertexShader: SPLASH_SHADER.vertexShader,
    fragmentShader: SPLASH_SHADER.fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * Criar material de névoa
 * 
 * @returns Material configurado para névoa
 */
export function createMistMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(MIST_SHADER.uniforms),
    vertexShader: MIST_SHADER.vertexShader,
    fragmentShader: MIST_SHADER.fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * Criar material de respingos de chuva
 * 
 * @returns Material configurado para respingos
 */
export function createRainSplashMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(RAIN_SPLASH_SHADER.uniforms),
    vertexShader: RAIN_SPLASH_SHADER.vertexShader,
    fragmentShader: RAIN_SPLASH_SHADER.fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * Criar material de caustics
 * 
 * @param waterLevel - Nível da água
 * @param intensity - Intensidade das caustics (0-1)
 * @returns Material configurado para caustics
 */
export function createCausticsMaterial(
  waterLevel: number = 0,
  intensity: number = 1.0
): THREE.ShaderMaterial {
  const uniforms = JSON.parse(JSON.stringify(CAUSTICS_SHADER.uniforms));
  uniforms.waterLevel = { value: waterLevel };
  uniforms.intensity = { value: intensity };
  
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: CAUSTICS_SHADER.vertexShader,
    fragmentShader: CAUSTICS_SHADER.fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

/**
 * Atualizar uniforms de tempo em materiais de água
 * 
 * @param materials - Array de materiais para atualizar
 * @param time - Tempo em segundos
 */
export function updateWaterShaderTime(
  materials: THREE.ShaderMaterial[],
  time: number
): void {
  for (const material of materials) {
    if (material.uniforms.time) {
      material.uniforms.time.value = time;
    }
  }
}

/**
 * Atualizar nível de água em materiais
 * 
 * @param materials - Array de materiais para atualizar
 * @param waterLevel - Novo nível da água
 */
export function updateWaterLevel(
  materials: THREE.ShaderMaterial[],
  waterLevel: number
): void {
  for (const material of materials) {
    if (material.uniforms.waterLevel) {
      material.uniforms.waterLevel.value = waterLevel;
    }
  }
}
