/**
 * Constantes de dimensões e UI
 * 
 * Dimensões padrão do canvas e configurações de UI
 * 
 * SSOT: Valores fundamentais vêm de @/lib/ordax/config
 * Este arquivo adiciona apenas constantes específicas de UI
 */

import type { DimensionsConfig, UIConfig } from '../types';
import { WORLD } from '@/lib/ordax/config';

/**
 * Dimensões padrão do canvas (SSOT: config.ts)
 * Balanceadas para compatibilidade e performance
 */
export const CANVAS_DIMENSIONS: Readonly<DimensionsConfig> = {
  /** 
   * Largura padrão do canvas (SSOT: config.ts)
   * Balanceada para compatibilidade com monitores antigos
   */
  width: WORLD.W, // pixels
  
  /** 
   * Altura padrão do canvas (SSOT: config.ts)
   * Proporção 4:3 clássica
   */
  height: WORLD.H, // pixels
  
  /** 
   * Aspect ratio padrão (4:3)
   * Proporção clássica de jogos
   */
  aspectRatio: WORLD.W / WORLD.H,
} as const;

/**
 * Configurações de UI padrão
 * Baseadas em design systems modernos
 */
export const UI: Readonly<UIConfig> = {
  /** 
   * Padding padrão (pixels)
   * Espaçamento interno consistente
   */
  padding: 16, // pixels
  
  /** 
   * Margin padrão (pixels)
   * Espaçamento externo consistente
   */
  margin: 8, // pixels
  
  /** 
   * Border radius padrão (pixels)
   * Cantos arredondados modernos
   */
  borderRadius: 4, // pixels
  
  /** 
   * Duração de animação padrão (ms)
   * Animações suaves mas responsivas
   */
  animationDuration: 200, // ms
} as const;

/**
 * Tamanhos de fonte responsivos
 * Escala baseada em 16px (1rem)
 */
export const FONT_SIZES = {
  xs: 12,   // Extra small
  sm: 14,   // Small
  md: 16,   // Medium (base)
  lg: 18,   // Large
  xl: 20,   // Extra large
  '2xl': 24, // 2x large
  '3xl': 30, // 3x large
  '4xl': 36, // 4x large
} as const;

/**
 * Z-indexes organizados
 * Previne conflitos de sobreposição
 */
export const Z_INDEX = {
  background: 0,      // Fundo
  content: 1,         // Conteúdo principal
  ui: 10,             // Elementos de UI
  overlay: 100,       // Overlays
  modal: 1000,        // Modais
  tooltip: 10000,     // Tooltips (sempre no topo)
} as const;

/**
 * Breakpoints responsivos
 * Baseados em larguras comuns
 */
export const BREAKPOINTS = {
  xs: 320,   // Mobile pequeno
  sm: 480,   // Mobile grande
  md: 768,   // Tablet
  lg: 1024,  // Desktop pequeno
  xl: 1280,  // Desktop médio
  '2xl': 1536, // Desktop grande
} as const;

/**
 * Dimensões por gênero
 * Otimizações específicas por tipo de jogo
 * 
 * ✅ Usa WORLD do config central como base
 */
export const DIMENSIONS_BY_GENRE = {
  platformer: {
    width: WORLD.W,
    height: WORLD.H,
    aspectRatio: WORLD.W / WORLD.H,
  },
  racing: {
    width: 1024,
    height: 768,
    aspectRatio: 4 / 3,
  },
  topdown: {
    width: WORLD.W,
    height: WORLD.H,
    aspectRatio: WORLD.W / WORLD.H,
  },
} as const;

/**
 * Obtém dimensões por gênero
 */
export function getDimensionsForGenre(genre: string): DimensionsConfig {
  const genreConfig = DIMENSIONS_BY_GENRE[genre as keyof typeof DIMENSIONS_BY_GENRE];
  
  if (genreConfig) {
    return {
      ...CANVAS_DIMENSIONS,
      ...genreConfig,
    };
  }
  
  return CANVAS_DIMENSIONS;
}