/**
 * Constantes de física do jogo
 * 
 * Baseado em física realista com ajustes para gameplay
 */

import type { PhysicsConfig } from '../types';

/**
 * Constantes de física padrão
 * Baseado em física realista com ajustes para gameplay
 */
export const PHYSICS: Readonly<PhysicsConfig> = {
  /** 
   * Gravidade padrão (pixels/s²)
   * Baseado na gravidade terrestre (9.8 m/s²) ajustada para pixels
   */
  gravity: 980, // pixels/s² (equivalente a 9.8 m/s² em escala de pixels)
  
  /** 
   * Velocidade máxima de queda (terminal velocity)
   * Limita a velocidade máxima de queda para evitar valores extremos
   */
  maxVelocity: 1000, // pixels/s
  
  /** 
   * Fricção do chão (0-1)
   * 0 = sem atrito, 1 = atrito máximo
   */
  friction: 0.8,
  
  /** 
   * Densidade do ar (0-1)
   * Afeta a resistência do ar em objetos em movimento
   */
  airDensity: 0.02,
} as const;

/**
 * Constantes de física para platformers
 * Gravidade mais forte para jogos de plataforma
 */
export const PHYSICS_PLATFORMER: Readonly<PhysicsConfig> = {
  gravity: 1200,    // Gravidade mais forte para plataformas
  maxVelocity: 800,  // Velocidade máxima menor para controle preciso
  friction: 0.9,      // Mais atrito para controle preciso
  airDensity: 0.01,   // Menos resistência do ar para pular mais alto
} as const;

/**
 * Constantes de física para corrida
 * Menos gravidade, mais velocidade
 */
export const PHYSICS_RACING: Readonly<PhysicsConfig> = {
  gravity: 980,      // Gravidade padrão
  maxVelocity: 2000,  // Alta velocidade máxima
  friction: 0.95,     // Alta fricção para controle em alta velocidade
  airDensity: 0.05,   // Mais resistência do ar em alta velocidade
} as const;

/**
 * Constantes de física para jogos top-down
 * Sem gravidade, movimento livre
 */
export const PHYSICS_TOPDOWN: Readonly<PhysicsConfig> = {
  gravity: 0,         // Sem gravidade em top-down
  maxVelocity: 500,   // Velocidade controlada
  friction: 0.85,     // Fricção moderada
  airDensity: 0,      // Sem resistência do ar (espaço 2D)
} as const;

/**
 * Mapa de física por gênero de jogo
 * Para backward compatibility com jogos legados
 */
export const PHYSICS_BY_GENRE = {
  platformer: PHYSICS_PLATFORMER,
  racing: PHYSICS_RACING,
  topdown: PHYSICS_TOPDOWN,
  shooter: PHYSICS_TOPDOWN,    // Shooter usa física top-down
  puzzle: PHYSICS,              // Usa física padrão
  sports: PHYSICS,              // Usa física padrão
} as const;

/**
 * Obtém configuração de física por gênero
 */
export function getPhysicsForGenre(genre: string): PhysicsConfig {
  return PHYSICS_BY_GENRE[genre as keyof typeof PHYSICS_BY_GENRE] || PHYSICS;
}