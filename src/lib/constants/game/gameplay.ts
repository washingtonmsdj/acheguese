/**
 * Constantes de gameplay
 * 
 * Configurações de gameplay que afetam a experiência do jogador
 */

import type { GameplayConfig } from '../types';

/**
 * Constantes de gameplay padrão
 * Balanceadas para uma experiência genérica
 */
export const GAMEPLAY: Readonly<GameplayConfig> = {
  /** 
   * Velocidade do jogador (pixels/s)
   * Balanceada para movimento responsivo mas não muito rápido
   */
  playerSpeed: 300, // pixels/s
  
  /** 
   * Velocidade de pulo (pixels/s)
   * Altura de pulo adequada para plataformas padrão
   */
  jumpSpeed: 500, // pixels/s
  
  /** 
   * Vida inicial do jogador
   * Valor padrão para jogos com sistema de vida
   */
  initialHealth: 100,
  
  /** 
   * Pontuação inicial
   * Sempre começa em 0
   */
  initialScore: 0,
} as const;

/**
 * Constantes de gameplay para platformers
 * Velocidade mais lenta, pulo mais alto
 */
export const GAMEPLAY_PLATFORMER: Readonly<GameplayConfig> = {
  playerSpeed: 250,    // Movimento mais lento para precisão
  jumpSpeed: 600,      // Pulo mais alto para plataformas
  initialHealth: 3,    // Vidas limitadas (estilo clássico)
  initialScore: 0,
} as const;

/**
 * Constantes de gameplay para corrida
 * Alta velocidade, sem pulo
 */
export const GAMEPLAY_RACING: Readonly<GameplayConfig> = {
  playerSpeed: 1000,   // Alta velocidade para corrida
  jumpSpeed: 0,        // Sem pulo em jogos de corrida
  initialHealth: 100,  // Vida padrão
  initialScore: 0,
} as const;

/**
 * Mapa de gameplay por gênero
 * Para backward compatibility com jogos legados
 */
export const GAMEPLAY_BY_GENRE = {
  platformer: GAMEPLAY_PLATFORMER,
  racing: GAMEPLAY_RACING,
  topdown: GAMEPLAY,
  shooter: GAMEPLAY,
  puzzle: GAMEPLAY,
  sports: GAMEPLAY,
} as const;

/**
 * Obtém configuração de gameplay por gênero
 */
export function getGameplayForGenre(genre: string): GameplayConfig {
  return GAMEPLAY_BY_GENRE[genre as keyof typeof GAMEPLAY_BY_GENRE] || GAMEPLAY;
}