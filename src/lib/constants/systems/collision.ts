/**
 * Constantes de sistema de colisão
 * 
 * Configurações para otimização e performance do sistema de colisão
 */

import type { CollisionConfig } from '../types';

/**
 * Constantes de colisão padrão
 * Otimizadas para performance e precisão
 */
export const COLLISION: Readonly<CollisionConfig> = {
  /** 
   * Tamanho do grid de colisão (pixels)
   * Grid spatial partitioning para otimização
   */
  gridSize: 64, // pixels
  
  /** 
   * Máximo de entidades por célula do grid
   * Previne sobrecarga em áreas densas
   */
  maxEntitiesPerCell: 10,
  
  /** 
   * Raio de busca para colisões (pixels)
   * Limita a distância de busca para otimização
   */
  searchRadius: 128, // pixels
} as const;

/**
 * Tipos de colisão
 * Usados para determinar como as entidades interagem
 */
export const COLLISION_TYPES = {
  NONE: 0,        // Sem colisão
  STATIC: 1,      // Objeto estático (não se move)
  DYNAMIC: 2,     // Objeto dinâmico (se move, afetado por física)
  KINEMATIC: 3,   // Objeto cinemático (se move, não afetado por física)
} as const;

/**
 * Layers de colisão
 * Bitmask para otimizar detecção de colisão
 */
export const COLLISION_LAYERS = {
  DEFAULT: 1 << 0,    // Layer padrão (0b0001)
  PLAYER: 1 << 1,     // Layer do jogador (0b0010)
  ENEMY: 1 << 2,      // Layer de inimigos (0b0100)
  PROJECTILE: 1 << 3, // Layer de projéteis (0b1000)
  TERRAIN: 1 << 4,    // Layer de terreno (0b10000)
  TRIGGER: 1 << 5,    // Layer de triggers (0b100000)
} as const;

/**
 * Máscaras de colisão
 * Define quais layers colidem entre si
 */
export const COLLISION_MASKS = {
  PLAYER: COLLISION_LAYERS.ENEMY | COLLISION_LAYERS.TERRAIN | COLLISION_LAYERS.TRIGGER,
  ENEMY: COLLISION_LAYERS.PLAYER | COLLISION_LAYERS.TERRAIN | COLLISION_LAYERS.PROJECTILE,
  PROJECTILE: COLLISION_LAYERS.ENEMY | COLLISION_LAYERS.TERRAIN,
  TERRAIN: COLLISION_LAYERS.PLAYER | COLLISION_LAYERS.ENEMY | COLLISION_LAYERS.PROJECTILE,
  TRIGGER: COLLISION_LAYERS.PLAYER,
} as const;

/**
 * Configurações de colisão por gênero
 * Otimizações específicas por tipo de jogo
 */
export const COLLISION_BY_GENRE = {
  platformer: {
    gridSize: 32,           // Grid menor para precisão em plataformas
    maxEntitiesPerCell: 8,  // Menos entidades por célula (níveis menos densos)
    searchRadius: 96,       // Raio menor (colisões mais próximas)
  },
  racing: {
    gridSize: 128,          // Grid maior para alta velocidade
    maxEntitiesPerCell: 15, // Mais entidades (muitos carros)
    searchRadius: 256,      // Raio maior (colisões em alta velocidade)
  },
  topdown: {
    gridSize: 64,           // Grid padrão
    maxEntitiesPerCell: 12, // Mais entidades (jogos top-down densos)
    searchRadius: 160,      // Raio médio
  },
} as const;

/**
 * Obtém configuração de colisão por gênero
 */
export function getCollisionForGenre(genre: string): CollisionConfig {
  const genreConfig = COLLISION_BY_GENRE[genre as keyof typeof COLLISION_BY_GENRE];
  
  if (genreConfig) {
    return {
      ...COLLISION,
      ...genreConfig,
    };
  }
  
  return COLLISION;
}