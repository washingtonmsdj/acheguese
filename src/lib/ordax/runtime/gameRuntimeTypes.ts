/**
 * Tipos para GameRuntime
 * Sistema 100% genérico com type safety completo
 */

import type { OrdaxSpec, OrdaxEntity } from "@/lib/ordax/types";

// Re-export Entity from canonical source
export type { OrdaxEntity as Entity } from "@/lib/ordax/types";

/**
 * Interface base para todos os sistemas
 */
export interface System {
  /**
   * Atualiza o sistema
   * @param deltaTime - Tempo desde último frame (em segundos)
   * @param entities - Array de entidades do jogo
   */
  update(deltaTime: number, entities: OrdaxEntity[]): void;
  
  /**
   * Limpa recursos do sistema (opcional)
   */
  dispose?(): void;
}

/**
 * Constructor de sistema
 */
export type SystemConstructor = new () => System;

/**
 * Type guard para validar se objeto é Entity válida
 */
export function isValidEntity(obj: unknown): obj is OrdaxEntity {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  if (typeof o.id !== "string" || (o.id as string).trim().length === 0) return false;
  return true;
}

/**
 * Type guard para validar se objeto é System válido
 */
export function isValidSystem(obj: unknown): obj is System {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  if (typeof o.update !== "function") return false;
  return true;
}

/**
 * Type guard para validar se função é SystemConstructor
 */
export function isSystemConstructor(fn: unknown): fn is SystemConstructor {
  if (typeof fn !== "function") return false;
  try {
    // Tenta criar instância para validar
    const instance = new (fn as new () => object)();
    return isValidSystem(instance);
  } catch {
    return false;
  }
}

/**
 * Renderer customizado para shapes
 */
export interface ShapeRenderer {
  /**
   * Renderiza a shape
   * @param ctx - Contexto 2D do canvas
   * @param entity - Entidade a ser renderizada
   */
  render(ctx: CanvasRenderingContext2D, entity: OrdaxEntity): void;
}

/**
 * Registry de sistemas
 * Permite registro dinâmico de sistemas customizados
 */
export class SystemRegistry {
  private static systems = new Map<string, SystemConstructor>();

  /**
   * Registra um sistema
   * @param name - Nome do sistema
   * @param constructor - Constructor do sistema
   */
  static register(name: string, constructor: SystemConstructor): void {
    if (!name || name.trim().length === 0) {
      throw new Error("System name cannot be empty");
    }
    if (!isSystemConstructor(constructor)) {
      throw new Error(`Invalid system constructor for "${name}"`);
    }
    this.systems.set(name, constructor);
  }

  /**
   * Obtém constructor de sistema
   * @param name - Nome do sistema
   * @returns Constructor ou undefined
   */
  static get(name: string): SystemConstructor | undefined {
    return this.systems.get(name);
  }

  /**
   * Verifica se sistema está registrado
   * @param name - Nome do sistema
   */
  static has(name: string): boolean {
    return this.systems.has(name);
  }

  /**
   * Lista todos os sistemas registrados
   */
  static list(): string[] {
    return Array.from(this.systems.keys());
  }

  /**
   * Remove sistema do registry
   * @param name - Nome do sistema
   */
  static unregister(name: string): boolean {
    return this.systems.delete(name);
  }

  /**
   * Limpa todos os sistemas
   */
  static clear(): void {
    this.systems.clear();
  }
}

/**
 * Registry de renderers customizados
 * Permite registro dinâmico de shapes customizadas
 */
export class RendererRegistry {
  private static renderers = new Map<string, ShapeRenderer>();

  /**
   * Registra um renderer
   * @param shape - Nome da shape
   * @param renderer - Renderer customizado
   */
  static register(shape: string, renderer: ShapeRenderer): void {
    if (!shape || shape.trim().length === 0) {
      throw new Error("Shape name cannot be empty");
    }
    if (!renderer || typeof renderer.render !== "function") {
      throw new Error(`Invalid renderer for shape "${shape}"`);
    }
    this.renderers.set(shape, renderer);
  }

  /**
   * Obtém renderer para shape
   * @param shape - Nome da shape
   * @returns Renderer ou undefined
   */
  static get(shape: string): ShapeRenderer | undefined {
    return this.renderers.get(shape);
  }

  /**
   * Verifica se renderer está registrado
   * @param shape - Nome da shape
   */
  static has(shape: string): boolean {
    return this.renderers.has(shape);
  }

  /**
   * Lista todas as shapes registradas
   */
  static list(): string[] {
    return Array.from(this.renderers.keys());
  }

  /**
   * Remove renderer do registry
   * @param shape - Nome da shape
   */
  static unregister(shape: string): boolean {
    return this.renderers.delete(shape);
  }

  /**
   * Limpa todos os renderers
   */
  static clear(): void {
    this.renderers.clear();
  }
}

/**
 * Configuração do GameRuntime
 */
export interface GameRuntimeConfig {
  /**
   * Habilita logging de debug
   */
  debug?: boolean;
  
  /**
   * Habilita monitoramento de performance
   */
  enablePerformanceMonitoring?: boolean;
  
  /**
   * FPS alvo
   */
  targetFPS?: number;
  
  /**
   * Máximo de deltaTime permitido (em segundos)
   * Previne "spiral of death" em caso de lag
   */
  maxDeltaTime?: number;
}

/**
 * Métricas de performance
 */
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  updateTime: number;
  renderTime: number;
  entityCount: number;
  systemCount: number;
}
