/**
 * Constantes do sistema de tempo
 * 
 * Configurações de FPS, delta time e limites de performance
 * 
 * SSOT: Valores fundamentais vêm de @/lib/ordax/config
 * Este arquivo adiciona apenas constantes específicas do sistema de tempo
 */

import { ENGINE_PERFORMANCE } from '@/lib/ordax/config';

/**
 * Constantes de tempo padrão
 * Otimizadas para performance e precisão
 * 
 * ✅ TARGET_FPS e MAX_DELTA_TIME vêm do config central (SSOT)
 */
export const TIME = {
  /** 
   * FPS alvo padrão (SSOT: config.ts)
   * 60 FPS para animações suaves
   */
  TARGET_FPS: ENGINE_PERFORMANCE.TARGET_FPS,
  
  /** 
   * Delta time mínimo (ms)
   * Previne valores extremamente baixos
   */
  MIN_DELTA_TIME: 1, // ms
  
  /** 
   * Delta time máximo (ms) - SSOT: config.ts
   * Previne valores extremamente altos (freezes)
   * Convertido de segundos para milissegundos
   */
  MAX_DELTA_TIME: ENGINE_PERFORMANCE.MAX_DELTA_TIME * 1000, // 100ms (equivalente a 10 FPS mínimo)
  
  /** 
   * FPS mínimo permitido
   * Abaixo disso considera-se freeze
   */
  MIN_FPS: 10,
  
  /** 
   * FPS máximo permitido
   * Acima disso não há benefício visual
   */
  MAX_FPS: 240,
  
  /** 
   * Tempo máximo de frame (ms)
   * Se um frame demorar mais, considera-se freeze
   */
  MAX_FRAME_TIME: 1000, // ms
  
  /** 
   * Intervalo de atualização de física (ms)
   * Física rodando a 60Hz independente do FPS
   */
  PHYSICS_UPDATE_INTERVAL: 16.67, // ms (60Hz)
  
  /** 
   * Intervalo de atualização de rede (ms)
   * Para jogos multiplayer
   */
  NETWORK_UPDATE_INTERVAL: 33.33, // ms (30Hz)
  
  /** 
   * Intervalo de salvamento automático (ms)
   */
  AUTO_SAVE_INTERVAL: 30000, // 30 segundos
  
  /** 
   * Intervalo de limpeza de cache (ms)
   */
  CACHE_CLEANUP_INTERVAL: 60000, // 1 minuto
} as const;

/**
 * Timeouts e delays padrão
 * Para operações assíncronas
 */
export const TIMEOUTS = {
  /** 
   * Timeout de carregamento (ms)
   */
  LOADING: 30000, // 30 segundos
  
  /** 
   * Timeout de rede (ms)
   */
  NETWORK: 10000, // 10 segundos
  
  /** 
   * Timeout de operação de arquivo (ms)
   */
  FILE_OPERATION: 5000, // 5 segundos
  
  /** 
   * Timeout de inicialização (ms)
   */
  INITIALIZATION: 15000, // 15 segundos
  
  /** 
   * Timeout de renderização (ms)
   */
  RENDERING: 1000, // 1 segundo
  
  /** 
   * Timeout de física (ms)
   */
  PHYSICS: 500, // 0.5 segundos
} as const;

/**
 * Configurações de tempo por gênero
 * Otimizações específicas por tipo de jogo
 */
export const TIME_BY_GENRE = {
  platformer: {
    TARGET_FPS: 60,
    PHYSICS_UPDATE_INTERVAL: 16.67, // Física precisa
  },
  racing: {
    TARGET_FPS: 120, // Alta FPS para corrida
    PHYSICS_UPDATE_INTERVAL: 8.33, // Física mais rápida (120Hz)
  },
  puzzle: {
    TARGET_FPS: 30, // FPS mais baixo (jogos estáticos)
    PHYSICS_UPDATE_INTERVAL: 33.33, // Física mais lenta (30Hz)
  },
  shooter: {
    TARGET_FPS: 144, // Alta FPS para tiro
    PHYSICS_UPDATE_INTERVAL: 6.94, // Física muito rápida (144Hz)
  },
} as const;

/**
 * Obtém configuração de tempo por gênero
 */
export function getTimeForGenre(genre: string): Record<string, number> {
  const genreConfig = TIME_BY_GENRE[genre as keyof typeof TIME_BY_GENRE];
  
  if (genreConfig) {
    return {
      ...TIME,
      ...genreConfig,
    };
  }
  
  return TIME;
}

/**
 * Calcula delta time seguro
 * Garante que delta time está dentro dos limites
 */
export function calculateSafeDeltaTime(rawDeltaTime: number): number {
  return Math.max(
    TIME.MIN_DELTA_TIME,
    Math.min(TIME.MAX_DELTA_TIME, rawDeltaTime)
  );
}

/**
 * Calcula FPS a partir do delta time
 */
export function calculateFPS(deltaTime: number): number {
  if (deltaTime <= 0) {
    return TIME.TARGET_FPS;
  }
  
  const fps = 1000 / deltaTime;
  return Math.max(TIME.MIN_FPS, Math.min(TIME.MAX_FPS, fps));
}

/**
 * Verifica se há freeze (delta time muito alto)
 */
export function isFreezeDetected(deltaTime: number): boolean {
  return deltaTime > TIME.MAX_FRAME_TIME;
}