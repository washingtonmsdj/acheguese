/**
 * Helpers para Atualização de Partículas
 * 
 * Funções genéricas para evitar duplicação de código
 * na atualização de sistemas de partículas.
 */

import * as THREE from "three";

// ✅ CORREÇÃO SSOT: Tamanhos padrão de partículas
export const FLOOD_PARTICLE_SIZES = {
  /** Tamanho inicial padrão para splashes */
  DEFAULT_INITIAL: 0.1,
  /** Offset vertical para splashes */
  SPLASH_OFFSET: 0.1,
} as const;

/**
 * Atualizar sistema de partículas genérico
 * 
 * @param geo - Geometria das partículas
 * @param count - Número de partículas
 * @param deltaTime - Tempo desde último frame (segundos)
 * @param lifetimeSpeed - Velocidade de incremento do lifetime (0-1 por segundo)
 * @param updateFn - Função customizada para atualizar cada partícula (opcional)
 */
export function updateParticleSystem(
  geo: THREE.BufferGeometry,
  count: number,
  deltaTime: number,
  lifetimeSpeed: number,
  updateFn?: (i: number, lifetime: number, positions: THREE.BufferAttribute, sizes: THREE.BufferAttribute) => void
): void {
  const positions = geo.attributes.position as THREE.BufferAttribute;
  const lifetimes = geo.attributes.lifetime as THREE.BufferAttribute;
  const sizes = geo.attributes.size as THREE.BufferAttribute;
  
  for (let i = 0; i < count; i++) {
    let lifetime = lifetimes.getX(i);
    
    // Atualizar lifetime
    lifetime += deltaTime * lifetimeSpeed;
    
    // Resetar se expirou
    if (lifetime > 1.0) {
      lifetime = 0;
      if (sizes) {
        sizes.setX(i, 0);
      }
    }
    
    // Atualização customizada (se fornecida)
    if (updateFn && lifetime > 0) {
      updateFn(i, lifetime, positions, sizes);
    }
    
    lifetimes.setX(i, lifetime);
  }
  
  // Marcar para atualização
  lifetimes.needsUpdate = true;
  if (sizes) {
    sizes.needsUpdate = true;
  }
}

/**
 * Atualizar splash (expansão circular)
 * 
 * @param geo - Geometria do splash
 * @param count - Número de splashes
 * @param deltaTime - Tempo desde último frame
 * @param speed - Velocidade de expansão (padrão: 3.0)
 * @param maxSize - Tamanho máximo (padrão: 2.0)
 */
export function updateSplashSystem(
  geo: THREE.BufferGeometry,
  count: number,
  deltaTime: number,
  speed: number = 3.0,
  maxSize: number = 2.0
): void {
  updateParticleSystem(geo, count, deltaTime, speed, (i, lifetime, positions, sizes) => {
    // Expandir splash
    const size = lifetime * maxSize;
    sizes.setX(i, size);
  });
}

/**
 * Atualizar névoa (movimento lento + reposicionamento)
 * 
 * @param geo - Geometria da névoa
 * @param count - Número de partículas de névoa
 * @param deltaTime - Tempo desde último frame
 * @param waterLevel - Nível da água
 * @param worldSize - Tamanho do mundo
 * @param speed - Velocidade de fade (padrão: 0.3)
 */
export function updateMistSystem(
  geo: THREE.BufferGeometry,
  count: number,
  deltaTime: number,
  waterLevel: number,
  worldSize: number,
  speed: number = 0.3
): void {
  updateParticleSystem(geo, count, deltaTime, speed, (i, lifetime, positions) => {
    // Reposicionar quando lifetime reseta
    if (lifetime < deltaTime * speed) {
      positions.setXYZ(
        i,
        (Math.random() - 0.5) * worldSize * 2,
        waterLevel + Math.random() * 2,
        (Math.random() - 0.5) * worldSize * 2
      );
      positions.needsUpdate = true;
    }
  });
}

/**
 * Atualizar respingos de chuva (fade rápido)
 * 
 * @param geo - Geometria dos respingos
 * @param count - Número de respingos
 * @param deltaTime - Tempo desde último frame
 * @param speed - Velocidade de fade (padrão: 5.0)
 * @param maxSize - Tamanho máximo (padrão: 0.8)
 */
export function updateRainSplashSystem(
  geo: THREE.BufferGeometry,
  count: number,
  deltaTime: number,
  speed: number = 5.0,
  maxSize: number = 0.8
): void {
  updateParticleSystem(geo, count, deltaTime, speed, (i, lifetime, positions, sizes) => {
    // Expandir e fade
    const size = (1.0 - lifetime) * maxSize;
    sizes.setX(i, size);
  });
}

/**
 * Criar splash em posição específica
 * 
 * @param geo - Geometria do splash
 * @param count - Número total de splashes
 * @param nextIndex - Próximo índice disponível (será incrementado)
 * @param x - Posição X
 * @param y - Posição Y
 * @param z - Posição Z
 * @param initialSize - Tamanho inicial (padrão: FLOOD_PARTICLE_SIZES.DEFAULT_INITIAL)
 * @returns Novo índice
 */
export function createSplashAt(
  geo: THREE.BufferGeometry,
  count: number,
  nextIndex: number,
  x: number,
  y: number,
  z: number,
  initialSize: number = FLOOD_PARTICLE_SIZES.DEFAULT_INITIAL
): number {
  const positions = geo.attributes.position as THREE.BufferAttribute;
  const sizes = geo.attributes.size as THREE.BufferAttribute;
  const lifetimes = geo.attributes.lifetime as THREE.BufferAttribute;
  
  positions.setXYZ(nextIndex, x, y + FLOOD_PARTICLE_SIZES.SPLASH_OFFSET, z);
  sizes.setX(nextIndex, initialSize);
  lifetimes.setX(nextIndex, 0.01); // Iniciar animação
  
  positions.needsUpdate = true;
  sizes.needsUpdate = true;
  lifetimes.needsUpdate = true;
  
  return (nextIndex + 1) % count;
}

/**
 * Constantes para velocidades de lifetime
 */
export const LIFETIME_SPEEDS = {
  /** Muito lento (névoa) */
  VERY_SLOW: 0.3,
  /** Lento (espuma) */
  SLOW: 0.5,
  /** Normal */
  NORMAL: 1.0,
  /** Rápido (splash) */
  FAST: 3.0,
  /** Muito rápido (respingos) */
  VERY_FAST: 5.0,
} as const;
