/**
 * Constantes de rendering e canvas
 * 
 * Configurações de performance e qualidade visual
 * 
 * SSOT: Valores fundamentais vêm de @/lib/ordax/config
 * Este arquivo adiciona apenas constantes específicas de rendering
 */

import type { RenderingConfig } from '../types';
import { ENGINE_PERFORMANCE } from '@/lib/ordax/config';

/**
 * Constantes de rendering padrão
 * Balanceadas entre performance e qualidade
 * 
 * ✅ targetFPS vem do config central (SSOT)
 */
export const RENDERING: Readonly<RenderingConfig> = {
  /** 
   * FPS alvo (SSOT: config.ts)
   * 60 FPS para animações suaves
   */
  targetFPS: ENGINE_PERFORMANCE.TARGET_FPS,
  
  /** 
   * Habilitar VSync
   * Previne screen tearing
   */
  vsync: true,
  
  /** 
   * Qualidade de anti-aliasing
   * Balance entre performance e qualidade
   */
  antialiasing: 'medium' as const,
  
  /** 
   * Habilitar sombras
   * Adiciona profundidade visual
   */
  shadows: true,
} as const;

/**
 * Cores padrão do sistema
 * Palette consistente e acessível
 */
export const COLORS = {
  // Cores neutras
  background: '#1a1a1a',    // Fundo escuro
  foreground: '#ffffff',    // Texto branco
  surface: '#2a2a2a',       // Superfícies
  
  // Cores primárias
  primary: '#3b82f6',       // Azul
  primaryDark: '#1d4ed8',   // Azul escuro
  primaryLight: '#60a5fa',  // Azul claro
  
  // Cores secundárias
  secondary: '#8b5cf6',     // Roxo
  secondaryDark: '#7c3aed', // Roxo escuro
  secondaryLight: '#a78bfa', // Roxo claro
  
  // Cores de estado
  success: '#10b981',       // Verde
  warning: '#f59e0b',       // Amarelo
  error: '#ef4444',         // Vermelho
  info: '#06b6d4',          // Ciano
  
  // Cores de UI
  border: '#4b5563',        // Bordas
  divider: '#374151',       // Divisores
  disabled: '#6b7280',      // Desabilitado
} as const;

/**
 * Configurações de rendering por gênero
 * Otimizações específicas por tipo de jogo
 */
export const RENDERING_BY_GENRE = {
  platformer: {
    targetFPS: 60,
    vsync: true,
    antialiasing: 'medium' as const,
    shadows: true,
  },
  racing: {
    targetFPS: 120,          // Alta FPS para corrida
    vsync: true,
    antialiasing: 'high' as const, // Alta qualidade
    shadows: true,
  },
  puzzle: {
    targetFPS: 30,           // FPS mais baixo (jogos estáticos)
    vsync: false,            // VSync desnecessário
    antialiasing: 'low' as const, // Baixa qualidade (performance)
    shadows: false,          // Sem sombras (simplicidade)
  },
} as const;

/**
 * Obtém configuração de rendering por gênero
 */
export function getRenderingForGenre(genre: string): RenderingConfig {
  const genreConfig = RENDERING_BY_GENRE[genre as keyof typeof RENDERING_BY_GENRE];
  
  if (genreConfig) {
    return {
      ...RENDERING,
      ...genreConfig,
    };
  }
  
  return RENDERING;
}

/**
 * Configurações de performance
 * Limites para prevenir sobrecarga
 */
export const PERFORMANCE_LIMITS = {
  MAX_ENTITIES: 1000,        // Máximo de entidades simultâneas
  MAX_PARTICLES: 500,        // Máximo de partículas
  MAX_LIGHTS: 10,            // Máximo de luzes
  MAX_TEXTURES: 50,          // Máximo de texturas carregadas
  MAX_AUDIO_SOURCES: 20,     // Máximo de fontes de áudio
} as const;

/**
 * Qualidades de rendering
 * Presets para diferentes níveis de hardware
 */
export const RENDERING_QUALITY = {
  LOW: {
    targetFPS: 30,
    vsync: false,
    antialiasing: 'none' as const,
    shadows: false,
  },
  MEDIUM: {
    targetFPS: 60,
    vsync: true,
    antialiasing: 'medium' as const,
    shadows: true,
  },
  HIGH: {
    targetFPS: 120,
    vsync: true,
    antialiasing: 'high' as const,
    shadows: true,
  },
  ULTRA: {
    targetFPS: 144,
    vsync: true,
    antialiasing: 'high' as const,
    shadows: true,
  },
} as const;