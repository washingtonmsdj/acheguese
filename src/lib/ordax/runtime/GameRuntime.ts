import type { OrdaxSpec } from "@/lib/ordax/types";
import { TimeSystem } from "@/lib/ordax/systems/TimeSystem";
import { PhysicsSystem } from "@/lib/ordax/systems/PhysicsSystem";
import { CollisionSystem } from "@/lib/ordax/systems/CollisionSystem";
import { ScoreSystem } from "@/lib/ordax/systems/ScoreSystem";
import { UISystem } from "@/lib/ordax/systems/UISystem-refactored";  // ✅ Using refactored version
import { InputSystem } from "@/lib/ordax/systems/InputSystem";
import { AudioSystem } from "@/lib/ordax/systems/AudioSystem";
import { CameraSystem } from "@/lib/ordax/systems/CameraSystem";
import { ParticleSystem } from "@/lib/ordax/systems/ParticleSystem";
import { TimerSystem } from "@/lib/ordax/systems/TimerSystem";
import { AISystem } from "@/lib/ordax/systems/AISystem";
import { AnimationSystem } from "@/lib/ordax/systems/AnimationSystem";
import {
  SystemRegistry,
  RendererRegistry,
} from "./gameRuntimeTypes";
import type {
  System,
  SystemConstructor,
  Entity,
  GameRuntimeConfig,
  PerformanceMetrics,
} from "./gameRuntimeTypes";
import {
  RENDER_CONFIG,
  PERFORMANCE_CONFIG,
  ERROR_MESSAGES,
  WARNING_MESSAGES,
  INFO_MESSAGES,
  DEFAULT_SHAPE_RENDERERS,
} from "./gameRuntimeConfig";
import {
  GameRuntimeLogger,
  validateCanvas,
  validateSpec,
  validateEntity,
  normalizeEntity,
  clampDeltaTime,
  calculateFPS,
  createError,
} from "./gameRuntimeUtils";

/**
 * Registra sistemas padrão no registry
 * Isso permite que sistemas customizados sejam adicionados dinamicamente
 */
function registerDefaultSystems(): void {
  SystemRegistry.register("TimeSystem", TimeSystem as unknown as SystemConstructor);
  SystemRegistry.register("PhysicsSystem", PhysicsSystem as unknown as SystemConstructor);
  SystemRegistry.register("CollisionSystem", CollisionSystem as unknown as SystemConstructor);
  SystemRegistry.register("ScoreSystem", ScoreSystem as unknown as SystemConstructor);
  SystemRegistry.register("UISystem", UISystem as unknown as SystemConstructor);
  SystemRegistry.register("InputSystem", InputSystem as unknown as SystemConstructor);
  SystemRegistry.register("AudioSystem", AudioSystem as unknown as SystemConstructor);
  SystemRegistry.register("CameraSystem", CameraSystem as unknown as SystemConstructor);
  SystemRegistry.register("ParticleSystem", ParticleSystem as unknown as SystemConstructor);
  SystemRegistry.register("TimerSystem", TimerSystem as unknown as SystemConstructor);
  SystemRegistry.register("AISystem", AISystem as unknown as SystemConstructor);
  SystemRegistry.register("AnimationSystem", AnimationSystem as unknown as SystemConstructor);
}

// Registra sistemas padrão na inicialização do módulo
registerDefaultSystems();

export class GameRuntime {
  private systems: Map<string, System> = new Map();
  private entities: Entity[] = [];
  private isRunning = false;
  private lastTime = 0;
  private rafId: number | null = null;
  private config: GameRuntimeConfig;
  private performanceMetrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    updateTime: 0,
    renderTime: 0,
    entityCount: 0,
    systemCount: 0,
  };
  private metricsUpdateTime = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private spec: OrdaxSpec,
    config?: GameRuntimeConfig
  ) {
    // Valida inputs
    if (!validateCanvas(canvas)) {
      throw createError(ERROR_MESSAGES.INVALID_CANVAS);
    }
    
    if (!validateSpec(spec)) {
      throw createError(ERROR_MESSAGES.INVALID_SPEC);
    }
    
    // Configuração com valores padrão
    this.config = {
      debug: config?.debug ?? false,
      enablePerformanceMonitoring: config?.enablePerformanceMonitoring ?? false,
      targetFPS: config?.targetFPS ?? PERFORMANCE_CONFIG.TARGET_FPS,
      maxDeltaTime: config?.maxDeltaTime ?? PERFORMANCE_CONFIG.MAX_DELTA_TIME,
    };
    
    // Habilita logging se debug ativo
    if (this.config.debug) {
      GameRuntimeLogger.setEnabled(true);
    }
    
    this.initializeSystems();
    this.initializeEntities();
    
    GameRuntimeLogger.info(INFO_MESSAGES.RUNTIME_STARTED);
  }

  private initializeSystems(): void {
    const systemNames = this.spec.systems || [];
    
    for (const systemName of systemNames) {
      // Valida nome do sistema
      if (typeof systemName !== "string" || systemName.trim().length === 0) {
        GameRuntimeLogger.warn(`Invalid system name: ${systemName}`);
        continue;
      }
      
      // Busca constructor no registry
      const Constructor = SystemRegistry.get(systemName);
      
      if (!Constructor) {
        GameRuntimeLogger.warn(WARNING_MESSAGES.SYSTEM_IGNORED(systemName));
        continue;
      }
      
      try {
        // Instancia sistema
        const system = new Constructor();
        this.systems.set(systemName, system);
        GameRuntimeLogger.info(INFO_MESSAGES.SYSTEM_INITIALIZED(systemName));
      } catch (error) {
        GameRuntimeLogger.error(
          ERROR_MESSAGES.SYSTEM_UPDATE_FAILED(
            systemName,
            error instanceof Error ? error.message : String(error)
          )
        );
      }
    }
    
    this.performanceMetrics.systemCount = this.systems.size;
  }

  private initializeEntities(): void {
    const rawEntities = this.spec.scene?.entities || [];
    
    for (const rawEntity of rawEntities) {
      // Valida entidade
      if (!validateEntity(rawEntity)) {
        GameRuntimeLogger.warn(WARNING_MESSAGES.ENTITY_INVALID((rawEntity as Record<string, unknown>)?.id as string || "unknown"));
        continue;
      }
      
      // Normaliza entidade com valores padrão
      const entity = normalizeEntity(rawEntity);
      this.entities.push(entity);
    }
    
    this.performanceMetrics.entityCount = this.entities.length;
    GameRuntimeLogger.debug(`Initialized ${this.entities.length} entities`);
  }

  start(): void {
    if (this.isRunning) {
      GameRuntimeLogger.warn("GameRuntime is already running");
      return;
    }
    
    // Valida pré-condições
    if (!validateCanvas(this.canvas)) {
      throw createError(ERROR_MESSAGES.INVALID_CANVAS);
    }
    
    if (this.systems.size === 0) {
      GameRuntimeLogger.warn("No systems initialized, game may not work correctly");
    }
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.metricsUpdateTime = this.lastTime;
    this.gameLoop();
    
    GameRuntimeLogger.info(INFO_MESSAGES.RUNTIME_STARTED);
  }

  stop(): void {
    if (!this.isRunning) {
      GameRuntimeLogger.warn("GameRuntime is not running");
      return;
    }
    
    this.isRunning = false;
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    GameRuntimeLogger.info(INFO_MESSAGES.RUNTIME_STOPPED);
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    let deltaTime = (currentTime - this.lastTime) / PERFORMANCE_CONFIG.MS_TO_SECONDS;
    this.lastTime = currentTime;
    
    // Clamp deltaTime para prevenir "spiral of death"
    deltaTime = clampDeltaTime(deltaTime, this.config.maxDeltaTime!);

    // Mede tempo de update
    const updateStartTime = performance.now();
    this.update(deltaTime);
    const updateEndTime = performance.now();
    
    // Mede tempo de render
    const renderStartTime = performance.now();
    this.render();
    const renderEndTime = performance.now();

    // Atualiza métricas de performance
    if (this.config.enablePerformanceMonitoring) {
      this.updatePerformanceMetrics(
        deltaTime,
        updateEndTime - updateStartTime,
        renderEndTime - renderStartTime,
        currentTime
      );
    }

    this.rafId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    // Atualiza todos os sistemas com error handling
    for (const [name, system] of this.systems) {
      try {
        if (system.update) {
          system.update(deltaTime, this.entities);
        }
      } catch (error) {
        GameRuntimeLogger.error(
          ERROR_MESSAGES.SYSTEM_UPDATE_FAILED(
            name,
            error instanceof Error ? error.message : String(error)
          ),
          error
        );
        // Continua executando outros sistemas mesmo se um falhar
      }
    }
  }

  private updatePerformanceMetrics(
    deltaTime: number,
    updateTime: number,
    renderTime: number,
    currentTime: number
  ): void {
    this.performanceMetrics.fps = calculateFPS(deltaTime);
    this.performanceMetrics.frameTime = deltaTime * PERFORMANCE_CONFIG.MS_TO_SECONDS;
    this.performanceMetrics.updateTime = updateTime;
    this.performanceMetrics.renderTime = renderTime;
    this.performanceMetrics.entityCount = this.entities.length;
    this.performanceMetrics.systemCount = this.systems.size;
    
    // Log métricas periodicamente
    if (currentTime - this.metricsUpdateTime >= PERFORMANCE_CONFIG.METRICS_UPDATE_INTERVAL) {
      this.metricsUpdateTime = currentTime;
      GameRuntimeLogger.debug("Performance metrics:", this.performanceMetrics);
    }
  }

  private render(): void {
    const ctx = this.canvas.getContext("2d");
    
    if (!ctx) {
      GameRuntimeLogger.warn(WARNING_MESSAGES.CONTEXT_NULL);
      return;
    }

    try {
      // Limpa canvas
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Renderiza entidades
      for (const entity of this.entities) {
        try {
          this.renderEntity(ctx, entity);
        } catch (error) {
          GameRuntimeLogger.error(
            `Failed to render entity "${entity.id}": ${error instanceof Error ? error.message : String(error)}`
          );
          // Continua renderizando outras entidades
        }
      }
    } catch (error) {
      GameRuntimeLogger.error(
        ERROR_MESSAGES.RENDER_FAILED(
          error instanceof Error ? error.message : String(error)
        ),
        error
      );
    }
  }

  private renderEntity(ctx: CanvasRenderingContext2D, entity: Entity): void {
    if (!entity.visual) {
      return;
    }

    const { shape, color = RENDER_CONFIG.DEFAULT_COLOR } = entity.visual;
    
    // Use entity's x/y/w/h directly (unified format)
    const x = entity.x ?? RENDER_CONFIG.DEFAULT_X;
    const y = entity.y ?? RENDER_CONFIG.DEFAULT_Y;
    const width = entity.w ?? RENDER_CONFIG.DEFAULT_WIDTH;
    const height = entity.h ?? RENDER_CONFIG.DEFAULT_HEIGHT;

    // Verifica se há renderer customizado registrado
    const customRenderer = RendererRegistry.get(shape);
    if (customRenderer) {
      customRenderer.render(ctx, entity);
      return;
    }

    // Usa renderer padrão se disponível
    const defaultRenderer = DEFAULT_SHAPE_RENDERERS[shape as keyof typeof DEFAULT_SHAPE_RENDERERS];
    if (defaultRenderer) {
      defaultRenderer(ctx, x, y, width, height, color);
      return;
    }

    // Fallback: renderiza como retângulo
    GameRuntimeLogger.warn(WARNING_MESSAGES.UNKNOWN_SHAPE(shape));
    DEFAULT_SHAPE_RENDERERS.rect(ctx, x, y, width, height, color);
  }

  getSystem<T extends System>(name: string): T | undefined {
    const system = this.systems.get(name);
    return system as T | undefined;
  }

  getEntities(): Entity[] {
    return [...this.entities];
  }

  addEntity(entity: Entity): void {
    // Valida entidade antes de adicionar
    if (!validateEntity(entity)) {
      throw createError(ERROR_MESSAGES.INVALID_ENTITY, { entity });
    }
    
    // Normaliza entidade
    const normalized = normalizeEntity(entity);
    this.entities.push(normalized);
    this.performanceMetrics.entityCount = this.entities.length;
    
    GameRuntimeLogger.info(INFO_MESSAGES.ENTITY_ADDED(normalized.id));
  }

  removeEntity(entityId: string): boolean {
    // In-place removal to avoid filter allocation
    const index = this.entities.findIndex(e => e.id === entityId);
    if (index === -1) {
      GameRuntimeLogger.warn(ERROR_MESSAGES.ENTITY_NOT_FOUND(entityId));
      return false;
    }
    
    // Swap with last and pop to avoid array shift
    const lastIndex = this.entities.length - 1;
    if (index !== lastIndex) {
      this.entities[index] = this.entities[lastIndex];
    }
    this.entities.pop();
    
    this.performanceMetrics.entityCount = this.entities.length;
    GameRuntimeLogger.info(INFO_MESSAGES.ENTITY_REMOVED(entityId));
    return true;
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  dispose(): void {
    this.stop();
    
    // Chama dispose() em cada sistema se disponível
    for (const [name, system] of this.systems) {
      try {
        if (system.dispose) {
          system.dispose();
        }
      } catch (error) {
        GameRuntimeLogger.error(
          `Failed to dispose system "${name}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    
    this.systems.clear();
    this.entities = [];
    this.performanceMetrics.systemCount = 0;
    this.performanceMetrics.entityCount = 0;
    
    GameRuntimeLogger.info(INFO_MESSAGES.RUNTIME_DISPOSED);
  }
}

// Exporta registries para uso externo
export { SystemRegistry, RendererRegistry } from "./gameRuntimeTypes";