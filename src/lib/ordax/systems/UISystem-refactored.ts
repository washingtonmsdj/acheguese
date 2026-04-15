/**
 * 🎨 UI SYSTEM REFACTORED - Sistema de interface do usuário (100% type safe)
 * 
 * Responsável por:
 * - Gerenciamento de elementos de UI (text, bar, button, image, etc.)
 * - Renderização automática baseada em estado do jogo
 * - Input handling (cliques, hover)
 * - Performance otimizada com caching e object pooling
 * 
 * @version 2.0.0
 * @build 2026-04-10
 * @changelog
 *   - 2.0.0: Usando TIME_CONSTANTS do config para conversões (SSOT compliant)
 *   - 1.0.0: Versão inicial
 */

import {
  GameState,
  UIElement,
  UIElementType,
  Entity,
  ScoreSystem,
  TimerSystem,
  UIConfig,
  isGameState,
  isUIElement,
  isEntityArray,
  isScoreSystem,
  isTimerSystem,
  isUIConfig,
  validateUIElement,
  createUIElement,
  cloneUIElement,
  mergeUIElements,
  DEFAULT_COLORS,
  DEFAULT_FONTS,
  DEFAULT_PADDING
} from "./uiSystemTypes";

import {
  UISystemConfig,
  ScreenConfigs,
  DEFAULT_CONFIG,
  DEFAULT_SCREEN_CONFIGS,
  validateConfig,
  validateScreenConfigs,
  getScreenConfig,
  mergeConfigs
} from "./uiSystemConfig";

import { TIME_CONSTANTS } from "../config";

import {
  validateElementId,
  validateElementPosition,
  validateElementSize,
  validateElementValue,
  validateElementText,
  validateElementColor,
  renderText,
  renderBar,
  renderButton,
  renderImage,
  renderFallback,
  isPointInRect,
  isPointInRoundRect,
  ElementCache,
  ObjectPool,
  logUISystem,
  measurePerformance
} from "./uiSystemUtils";

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  gameState: GameState;
  entities: Entity[];
  scoreSystem?: ScoreSystem;
  timerSystem?: TimerSystem;
  config?: UIConfig;
}

/**
 * Elemento UI com metadata para cache e dirty checking
 * Type-safe: usa Record para propriedades adicionais
 */
interface ElementWithMetadata extends UIElement {
  metadata: {
    isDirty: boolean;
    lastRenderTime: number;
    cacheKey?: string;
    additionalData?: Record<string, unknown>;
    isHovered?: boolean;
    isPressed?: boolean;
    borderRadius?: number;
  };
}

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

export class UISystem {
  private config: UISystemConfig;
  private screenConfigs: ScreenConfigs;
  private elements: Map<string, ElementWithMetadata> = new Map();
  private elementCache: ElementCache;
  private elementPool: ObjectPool<ElementWithMetadata>;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isInitialized: boolean = false;
  private lastRenderTime: number = 0;
  private frameCount: number = 0;
  private dirtyElements: Set<string> = new Set();
  private mousePosition = { x: 0, y: 0 };
  private hoveredElement: string | null = null;
  private clickedElement: string | null = null;

  // Stored bound handlers for proper event listener removal
  private boundHandlers: {
    mousedown?: (e: MouseEvent) => void;
    mouseup?: (e: MouseEvent) => void;
    mousemove?: (e: MouseEvent) => void;
    click?: (e: MouseEvent) => void;
    touchstart?: (e: TouchEvent) => void;
    touchend?: (e: TouchEvent) => void;
    touchmove?: (e: TouchEvent) => void;
  } = {};

  constructor(
    config: Partial<UISystemConfig> = {},
    screenConfigs: Partial<ScreenConfigs> = {}
  ) {
    this.config = validateConfig(config);
    this.screenConfigs = validateScreenConfigs(screenConfigs);
    this.elementCache = new ElementCache(this.config.maxElements, this.config.cacheDuration);
    this.elementPool = new ObjectPool<ElementWithMetadata>(
      () => this.createEmptyElement(),
      (element) => this.resetElement(element),
      this.config.poolSize
    );

    this.log("info", "UISystem initialized", {
      config: this.config,
      cacheSize: this.config.maxElements,
      poolSize: this.config.poolSize
    });
  }

  // ==========================================================================
  // INICIALIZAÇÃO E DESTRUTOR
  // ==========================================================================

  initialize(canvas: HTMLCanvasElement): void {
    if (this.isInitialized) {
      this.log("warn", "UISystem já inicializado");
      return;
    }

    try {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      
      if (!this.ctx) {
        throw new Error("Não foi possível obter contexto 2D do canvas");
      }

      this.setupEventListeners();
      this.isInitialized = true;

      this.log("info", "UISystem inicializado com sucesso", {
        canvasSize: { width: canvas.width, height: canvas.height },
        config: this.config
      });
    } catch (error) {
      this.log("error", "Falha ao inicializar UISystem", error);
      throw error;
    }
  }

  dispose(): void {
    this.removeEventListeners();
    this.clearAllElements();
    this.elementCache.clear();
    this.elementPool.clear();
    this.canvas = null;
    this.ctx = null;
    this.isInitialized = false;

    this.log("info", "UISystem disposed");
  }

  private setupEventListeners(): void {
    if (!this.canvas) return;

    // Store bound handlers so they can be removed later
    this.boundHandlers.mousedown = (e: MouseEvent) => this.handleMouseDown(e);
    this.boundHandlers.mouseup = (e: MouseEvent) => this.handleMouseUp(e);
    this.boundHandlers.mousemove = (e: MouseEvent) => this.handleMouseMove(e);
    this.boundHandlers.click = (e: MouseEvent) => this.handleClick(e);
    this.boundHandlers.touchstart = (e: TouchEvent) => this.handleTouchStart(e);
    this.boundHandlers.touchend = (e: TouchEvent) => this.handleTouchEnd(e);
    this.boundHandlers.touchmove = (e: TouchEvent) => this.handleTouchMove(e);

    if (this.config.enableMouseInput) {
      this.canvas.addEventListener("mousedown", this.boundHandlers.mousedown);
      this.canvas.addEventListener("mouseup", this.boundHandlers.mouseup);
      this.canvas.addEventListener("mousemove", this.boundHandlers.mousemove);
      this.canvas.addEventListener("click", this.boundHandlers.click);
    }

    if (this.config.enableTouchInput) {
      this.canvas.addEventListener("touchstart", this.boundHandlers.touchstart, { passive: false });
      this.canvas.addEventListener("touchend", this.boundHandlers.touchend, { passive: false });
      this.canvas.addEventListener("touchmove", this.boundHandlers.touchmove, { passive: false });
    }
  }

  private removeEventListeners(): void {
    if (!this.canvas) return;

    if (this.boundHandlers.mousedown) {
      this.canvas.removeEventListener("mousedown", this.boundHandlers.mousedown);
    }
    if (this.boundHandlers.mouseup) {
      this.canvas.removeEventListener("mouseup", this.boundHandlers.mouseup);
    }
    if (this.boundHandlers.mousemove) {
      this.canvas.removeEventListener("mousemove", this.boundHandlers.mousemove);
    }
    if (this.boundHandlers.click) {
      this.canvas.removeEventListener("click", this.boundHandlers.click);
    }
    if (this.boundHandlers.touchstart) {
      this.canvas.removeEventListener("touchstart", this.boundHandlers.touchstart);
    }
    if (this.boundHandlers.touchend) {
      this.canvas.removeEventListener("touchend", this.boundHandlers.touchend);
    }
    if (this.boundHandlers.touchmove) {
      this.canvas.removeEventListener("touchmove", this.boundHandlers.touchmove);
    }
    
    this.boundHandlers = {};
  }

  // ==========================================================================
  // GERENCIAMENTO DE ELEMENTOS
  // ==========================================================================

  addElement(element: UIElement): boolean {
    try {
      // Validação
      const validation = validateUIElement(element);
      if (!validation.valid) {
        this.log("error", "Elemento inválido", { element, errors: validation.errors });
        return false;
      }

      // Valida ID único
      if (this.elements.has(element.id)) {
        this.log("warn", `Elemento com ID já existe: ${element.id}`);
        return false;
      }

      // Cria elemento com metadata
      const elementWithMetadata: ElementWithMetadata = {
        ...element,
        metadata: {
          isDirty: true,
          lastRenderTime: 0,
          cacheKey: this.generateCacheKey(element),
          ...element.metadata
        }
      };

      this.elements.set(element.id, elementWithMetadata);
      this.markElementDirty(element.id);

      this.log("debug", "Elemento adicionado", { id: element.id, type: element.type });
      return true;
    } catch (error) {
      this.log("error", "Erro ao adicionar elemento", { element, error });
      return false;
    }
  }

  addText(
    id: string,
    x: number,
    y: number,
    text: string,
    options: Partial<UIElement> = {}
  ): boolean {
    try {
      const element = createUIElement("text", id, x, y, {
        text,
        ...options
      });

      return this.addElement(element);
    } catch (error) {
      this.log("error", "Erro ao criar elemento de texto", { id, x, y, text, error });
      return false;
    }
  }

  addBar(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    value: number,
    maxValue: number,
    options: Partial<UIElement> = {}
  ): boolean {
    try {
      const element = createUIElement("bar", id, x, y, {
        width,
        height,
        value,
        maxValue,
        ...options
      });

      return this.addElement(element);
    } catch (error) {
      this.log("error", "Erro ao criar elemento de barra", { id, x, y, width, height, value, maxValue, error });
      return false;
    }
  }

  addButton(
    id: string,
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    options: Partial<UIElement> = {}
  ): boolean {
    const element = createUIElement("button", id, x, y, {
      text,
      onClick,
      ...options
    });

    return this.addElement(element);
  }

  updateElement(id: string, updates: Partial<UIElement>): boolean {
    try {
      const element = this.elements.get(id);
      if (!element) {
        this.log("warn", `Elemento não encontrado: ${id}`);
        return false;
      }

      // Valida updates
      const merged = mergeUIElements(element, updates);
      const validation = validateUIElement(merged);
      if (!validation.valid) {
        this.log("error", "Updates inválidos", { id, updates, errors: validation.errors });
        return false;
      }

      // Atualiza elemento
      const updatedElement: ElementWithMetadata = {
        ...merged,
        metadata: {
          ...element.metadata,
          isDirty: true,
          cacheKey: this.generateCacheKey(merged)
        }
      };

      this.elements.set(id, updatedElement);
      this.markElementDirty(id);

      this.log("debug", "Elemento atualizado", { id, updates });
      return true;
    } catch (error) {
      this.log("error", "Erro ao atualizar elemento", { id, updates, error });
      return false;
    }
  }

  removeElement(id: string): boolean {
    try {
      const element = this.elements.get(id);
      if (!element) {
        this.log("warn", `Elemento não encontrado: ${id}`);
        return false;
      }

      this.elements.delete(id);
      this.dirtyElements.delete(id);
      this.elementCache.delete(id);

      // Libera para pool se configurado
      if (this.config.enableObjectPooling) {
        this.elementPool.release(element);
      }

      this.log("debug", "Elemento removido", { id });
      return true;
    } catch (error) {
      this.log("error", "Erro ao remover elemento", { id, error });
      return false;
    }
  }

  getElement(id: string): UIElement | null {
    const element = this.elements.get(id);
    if (!element) return null;

    // Remove metadata antes de retornar
    const { metadata, ...cleanElement } = element;
    return cleanElement;
  }

  clearAllElements(): void {
    this.elements.clear();
    this.dirtyElements.clear();
    this.elementCache.clear();
    this.hoveredElement = null;
    this.clickedElement = null;

    this.log("info", "Todos os elementos removidos");
  }

  // ==========================================================================
  // RENDERIZAÇÃO
  // ==========================================================================

  render(
    gameState: GameState,
    entities: Entity[] = [],
    scoreSystem?: ScoreSystem,
    timerSystem?: TimerSystem,
    config?: UIConfig
  ): void {
    if (!this.isInitialized || !this.ctx || !this.canvas) {
      this.log("error", "UISystem não inicializado para renderização");
      return;
    }

    try {
      const renderStart = performance.now();
      this.frameCount++;

      // Valida inputs
      if (!isGameState(gameState)) {
        this.log("error", "Estado do jogo inválido", { gameState });
        return;
      }

      if (!isEntityArray(entities)) {
        this.log("error", "Array de entidades inválido", { entities });
        return;
      }

      if (scoreSystem && !isScoreSystem(scoreSystem)) {
        this.log("error", "ScoreSystem inválido", { scoreSystem });
        return;
      }

      if (timerSystem && !isTimerSystem(timerSystem)) {
        this.log("error", "TimerSystem inválido", { timerSystem });
        return;
      }

      if (config && !isUIConfig(config)) {
        this.log("error", "Configuração de UI inválida", { config });
        return;
      }

      // Cria contexto de renderização
      const renderContext: RenderContext = {
        ctx: this.ctx,
        canvasWidth: this.canvas.width,
        canvasHeight: this.canvas.height,
        gameState,
        entities,
        scoreSystem,
        timerSystem,
        config: config || this.getDefaultConfigForState(gameState)
      };

      // Limpa canvas
      this.clearCanvas();

      // Renderiza elementos manuais
      this.renderManualElements(renderContext);

      // Renderiza elementos automáticos baseados no estado
      this.renderAutoElements(renderContext);

      // Renderiza overlay de debug se habilitado
      if (this.config.enableDebugOverlay) {
        this.renderDebugOverlay(renderContext, renderStart);
      }

      this.lastRenderTime = performance.now() - renderStart;

      // Log de performance se habilitado
      if (this.config.enablePerformanceLogging && this.frameCount % 60 === 0) {
        this.logPerformanceMetrics();
      }
    } catch (error) {
      this.log("error", "Erro durante renderização", error);
    }
  }

  private renderManualElements(context: RenderContext): void {
    const { ctx } = context;

    for (const element of this.elements.values()) {
      if (!element.visible) continue;

      // Verifica se precisa renderizar (dirty checking)
      if (this.config.enableDirtyChecking && !element.metadata.isDirty) {
        // Tenta usar cache
        const cached = this.elementCache.get(element.metadata.cacheKey || element.id);
        if (cached) {
          // Elemento não mudou, pular renderização
          continue;
        }
      }

      try {
        // Renderiza baseado no tipo
        switch (element.type) {
          case "text":
            renderText(ctx, element);
            break;
          case "bar":
            renderBar(ctx, element);
            break;
          case "button":
            renderButton(ctx, element);
            break;
          case "image":
            // TODO: Implementar renderização de imagem
            renderFallback(ctx, element);
            break;
          default:
            renderFallback(ctx, element);
            break;
        }

        // Marca como limpo e atualiza cache
        element.metadata.isDirty = false;
        element.metadata.lastRenderTime = performance.now();
        
        if (this.config.enableCaching) {
          this.elementCache.set(element.metadata.cacheKey || element.id, element);
        }
      } catch (error) {
        this.log("error", `Erro ao renderizar elemento ${element.id}`, { element, error });
        renderFallback(ctx, element);
      }
    }

    // Limpa dirty elements após renderização
    this.dirtyElements.clear();
  }

  private renderAutoElements(context: RenderContext): void {
    const { gameState, entities, scoreSystem, timerSystem, config } = context;

    switch (gameState) {
      case "START":
        this.renderStartScreen(context);
        break;
      case "PLAYING":
        this.renderHUD(context);
        break;
      case "GAME_OVER":
        this.renderGameOverScreen(context);
        break;
      case "VICTORY":
        this.renderVictoryScreen(context);
        break;
      case "PAUSED":
        this.renderPauseScreen(context);
        break;
      case "MENU":
        this.renderMenuScreen(context);
        break;
    }
  }

  private renderStartScreen(context: RenderContext): void {
    const { ctx, canvasWidth, canvasHeight } = context;
    const config = this.screenConfigs.startScreen;

    try {
      // Fundo
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Título
      ctx.fillStyle = config.textColor;
      ctx.font = config.titleFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.title, canvasWidth / 2, canvasHeight / 2 - 100);

      // Subtítulo
      ctx.font = config.subtitleFont;
      ctx.fillText(config.subtitle, canvasWidth / 2, canvasHeight / 2 - 50);

      // Instruções
      ctx.font = config.instructionsFont;
      config.instructions.forEach((instruction, i) => {
        ctx.fillText(instruction, canvasWidth / 2, canvasHeight / 2 + i * 30);
      });

      // Botão (se implementado)
      // this.renderButtonElement(...);
    } catch (error) {
      this.log("error", "Erro ao renderizar tela inicial", { config, error });
    }
  }

  private renderHUD(context: RenderContext): void {
    const { ctx, canvasWidth, canvasHeight, entities, scoreSystem, timerSystem } = context;
    const config = this.screenConfigs.hud;
    const padding = config.padding;

    try {
      // Encontra player
      const player = entities.find(e => e.type === "player");
      if (!player) return;

      // Fundo do HUD
      if (config.backgroundColor !== "transparent") {
        ctx.fillStyle = config.backgroundColor;
        
        switch (config.position) {
          case "top":
            ctx.fillRect(0, 0, canvasWidth, 100);
            break;
          case "bottom":
            ctx.fillRect(0, canvasHeight - 100, canvasWidth, 100);
            break;
          case "left":
            ctx.fillRect(0, 0, 200, canvasHeight);
            break;
          case "right":
            ctx.fillRect(canvasWidth - 200, 0, 200, canvasHeight);
            break;
        }
      }

      let yOffset = padding;

      // Health bar
      if (config.showHealth && player.props?.health !== undefined) {
        const health = Number(player.props.health) || 0;
        const maxHealth = Number(player.props.maxHealth) || 100;
        const percent = health / maxHealth;

        // Background
        ctx.fillStyle = config.barBackgroundColor;
        ctx.fillRect(padding, yOffset, config.healthBarWidth, config.healthBarHeight);

        // Fill
        ctx.fillStyle = percent > 0.3 ? config.barColor : DEFAULT_COLORS.HEALTH_BAR_LOW;
        ctx.fillRect(padding, yOffset, config.healthBarWidth * percent, config.healthBarHeight);

        // Border
        ctx.strokeStyle = DEFAULT_COLORS.BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(padding, yOffset, config.healthBarWidth, config.healthBarHeight);

        // Text
        ctx.fillStyle = config.textColor;
        ctx.font = config.scoreFont;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`Health: ${Math.floor(health)}/${maxHealth}`, padding, yOffset + config.healthBarHeight + 5);

        yOffset += config.healthBarHeight + 25;
      }

      // Score
      if (config.showScore && scoreSystem) {
        ctx.fillStyle = config.textColor;
        ctx.font = config.scoreFont;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`Score: ${scoreSystem.getScore()}`, padding, yOffset);
        yOffset += 25;
      }

      // Timer
      if (config.showTimer && timerSystem) {
        ctx.fillStyle = config.textColor;
        ctx.font = config.timerFont;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`Time: ${Math.floor(timerSystem.getElapsedTime())}s`, padding, yOffset);
        yOffset += 25;
      }

      // Wave (se disponível)
      if (config.showWave) {
        const spawner = entities.find(e => e.type === "spawner");
        if (spawner?.props?.currentWave) {
          ctx.fillStyle = config.textColor;
          ctx.font = config.scoreFont;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(`Wave: ${spawner.props.currentWave}`, padding, yOffset);
        }
      }
    } catch (error) {
      this.log("error", "Erro ao renderizar HUD", { config, error });
    }
  }

  private renderGameOverScreen(context: RenderContext): void {
    const { ctx, canvasWidth, canvasHeight, scoreSystem, timerSystem } = context;
    const config = this.screenConfigs.gameOverScreen;

    try {
      // Fundo
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Título
      ctx.fillStyle = config.textColor;
      ctx.font = config.titleFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.title, canvasWidth / 2, canvasHeight / 2 - 100);

      let yOffset = canvasHeight / 2 - 50;

      // Score final
      if (config.showFinalScore && scoreSystem) {
        ctx.font = config.scoreFont;
        ctx.fillText(`Final Score: ${scoreSystem.getScore()}`, canvasWidth / 2, yOffset);
        yOffset += 40;
      }

      // High score
      if (config.showHighScore && scoreSystem) {
        ctx.fillText(`High Score: ${scoreSystem.getHighScore()}`, canvasWidth / 2, yOffset);
        yOffset += 40;
      }

      // Time survived
      if (config.showTimeSurvived && timerSystem) {
        const time = Math.floor(timerSystem.getElapsedTime());
        ctx.fillText(`Survived: ${time}s`, canvasWidth / 2, yOffset);
        yOffset += 60;
      }

      // Botões (seriam elementos de UI reais)
      if (config.showRestartButton) {
        // this.renderButtonElement(...);
      }

      if (config.showMenuButton) {
        // this.renderButtonElement(...);
      }
    } catch (error) {
      this.log("error", "Erro ao renderizar tela de game over", { config, error });
    }
  }

  private renderVictoryScreen(context: RenderContext): void {
    const { ctx, canvasWidth, canvasHeight, scoreSystem, timerSystem } = context;
    const config = this.screenConfigs.victoryScreen;

    try {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.fillStyle = config.textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Título
      ctx.font = "bold 48px monospace";
      ctx.fillText(config.title, canvasWidth / 2, canvasHeight / 2 - 120);

      // Subtítulo
      ctx.font = "24px monospace";
      ctx.fillText(config.subtitle, canvasWidth / 2, canvasHeight / 2 - 70);

      let yOffset = canvasHeight / 2 - 20;

      // Score final
      if (config.showScore && scoreSystem) {
        ctx.font = "20px monospace";
        ctx.fillText(`Score: ${scoreSystem.getScore()}`, canvasWidth / 2, yOffset);
        yOffset += 36;
      }

      // Tempo
      if (config.showTime && timerSystem) {
        ctx.font = "18px monospace";
        ctx.fillText(`Tempo: ${Math.floor(timerSystem.getElapsedTime())}s`, canvasWidth / 2, yOffset);
        yOffset += 36;
      }

      // Hint de ação
      ctx.font = "16px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(
        config.showNextLevelButton ? config.nextLevelButtonText + " — ENTER" : config.replayButtonText + " — R",
        canvasWidth / 2,
        yOffset + 20
      );
    } catch (error) {
      this.log("error", "Erro ao renderizar tela de vitória", { config, error });
    }
  }

  private renderPauseScreen(context: RenderContext): void {
    const { ctx, canvasWidth, canvasHeight } = context;
    const config = this.screenConfigs.pauseScreen;

    try {
      // Overlay semi-transparente sobre o jogo
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.fillStyle = config.textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Título
      ctx.font = "bold 40px monospace";
      ctx.fillText(config.title, canvasWidth / 2, canvasHeight / 2 - 80);

      // Opções
      const options: string[] = [];
      if (config.showResumeButton)   options.push(`${config.resumeButtonText} — ESC`);
      if (config.showRestartButton)  options.push(`${config.restartButtonText} — R`);
      if (config.showMenuButton)     options.push(config.menuButtonText);
      if (config.showSettingsButton) options.push(config.settingsButtonText);

      ctx.font = "18px monospace";
      options.forEach((opt, i) => {
        ctx.fillStyle = i === 0 ? config.buttonColor : "rgba(255,255,255,0.7)";
        ctx.fillText(opt, canvasWidth / 2, canvasHeight / 2 - 10 + i * 36);
      });
    } catch (error) {
      this.log("error", "Erro ao renderizar tela de pausa", { config, error });
    }
  }

  private renderMenuScreen(context: RenderContext): void {
    const { ctx, canvasWidth, canvasHeight } = context;
    const config = this.screenConfigs.menuScreen;

    try {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Título
      ctx.fillStyle = config.textColor;
      ctx.font = config.titleFont;
      ctx.fillText(config.title, canvasWidth / 2, canvasHeight / 2 - 120);

      // Itens do menu
      const enabledItems = config.items.filter(item => item.enabled);
      const startY = canvasHeight / 2 - 40;

      enabledItems.forEach((item, i) => {
        const y = startY + i * 44;
        const isFirst = i === 0;

        ctx.fillStyle = isFirst ? config.selectedColor : config.textColor;
        ctx.font = config.itemFont;
        ctx.fillText(item.text, canvasWidth / 2, y);

        if (item.shortcut) {
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.font = "12px monospace";
          ctx.fillText(item.shortcut, canvasWidth / 2 + 120, y);
        }
      });
    } catch (error) {
      this.log("error", "Erro ao renderizar menu", { config, error });
    }
  }

  private renderDebugOverlay(context: RenderContext, renderStart: number): void {
    const { ctx, canvasWidth } = context;
    const renderTime = performance.now() - renderStart;

    try {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, 10, 200, 100);

      ctx.fillStyle = "#ffffff";
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      let y = 20;

      if (this.config.showFPS) {
        const fps = renderTime > 0 ? Math.round(TIME_CONSTANTS.MS_TO_SECONDS / renderTime) : 0;
        ctx.fillText(`FPS: ${fps}`, 20, y);
        y += 15;
      }

      if (this.config.showElementCount) {
        ctx.fillText(`Elements: ${this.elements.size}`, 20, y);
        y += 15;
      }

      if (this.config.showPerformanceMetrics) {
        ctx.fillText(`Render: ${renderTime.toFixed(2)}ms`, 20, y);
        y += 15;
        ctx.fillText(`Cache: ${this.elementCache.size()}`, 20, y);
        y += 15;
        ctx.fillText(`Pool: ${this.elementPool.size()}`, 20, y);
      }
    } catch (error) {
      this.log("error", "Erro ao renderizar debug overlay", error);
    }
  }

  // ==========================================================================
  // INPUT HANDLING
  // ==========================================================================

  private handleMouseDown(event: MouseEvent): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    this.mousePosition.x = event.clientX - rect.left;
    this.mousePosition.y = event.clientY - rect.top;

    this.updateHoveredElement();
    this.handleElementClick("mousedown");
  }

  private handleMouseUp(event: MouseEvent): void {
    this.handleElementClick("mouseup");
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    this.mousePosition.x = event.clientX - rect.left;
    this.mousePosition.y = event.clientY - rect.top;

    this.updateHoveredElement();
  }

  private handleClick(event: MouseEvent): void {
    this.handleElementClick("click");
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (!this.canvas || event.touches.length === 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const touch = event.touches[0];
    this.mousePosition.x = touch.clientX - rect.left;
    this.mousePosition.y = touch.clientY - rect.top;

    this.updateHoveredElement();
    this.handleElementClick("touchstart");
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    this.handleElementClick("touchend");
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (!this.canvas || event.touches.length === 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const touch = event.touches[0];
    this.mousePosition.x = touch.clientX - rect.left;
    this.mousePosition.y = touch.clientY - rect.top;

    this.updateHoveredElement();
  }

  private updateHoveredElement(): void {
    let newHoveredElement: string | null = null;

    for (const [id, element] of this.elements.entries()) {
      if (!element.visible || !element.enabled || element.type !== "button") continue;

      const isHovered = this.isPointInElement(this.mousePosition.x, this.mousePosition.y, element);
      
      if (isHovered) {
        newHoveredElement = id;
        
        // Atualiza estado de hover
        if (element.metadata.isHovered !== true) {
          element.metadata.isHovered = true;
          this.markElementDirty(id);
          
          // Chama callback de hover se existir
          if (element.onHover) {
            try {
              element.onHover(element);
            } catch (error) {
              this.log("error", "Erro no callback onHover", { id, error });
            }
          }
        }
      } else if (element.metadata.isHovered) {
        // Remove hover
        element.metadata.isHovered = false;
        this.markElementDirty(id);
      }
    }

    // Atualiza elemento com hover
    if (this.hoveredElement !== newHoveredElement) {
      this.hoveredElement = newHoveredElement;
    }
  }

  private handleElementClick(eventType: string): void {
    if (!this.hoveredElement) return;

    const element = this.elements.get(this.hoveredElement);
    if (!element || !element.enabled || element.type !== "button") return;

    if (eventType === "mousedown" || eventType === "touchstart") {
      // Marca como pressionado
      element.metadata.isPressed = true;
      this.clickedElement = this.hoveredElement;
      this.markElementDirty(this.hoveredElement);
    } else if ((eventType === "mouseup" || eventType === "touchend") && this.clickedElement === this.hoveredElement) {
      // Desmarca pressionado
      element.metadata.isPressed = false;
      this.markElementDirty(this.hoveredElement);
      
      // Chama callback de clique
      if (element.onClick) {
        try {
          element.onClick(element);
          this.log("debug", "Elemento clicado", { id: this.hoveredElement });
        } catch (error) {
          this.log("error", "Erro no callback onClick", { id: this.hoveredElement, error });
        }
      }
      
      this.clickedElement = null;
    }
  }

  private isPointInElement(x: number, y: number, element: UIElement): boolean {
    if (!element.width || !element.height) {
      // Para elementos sem dimensão, usa área aproximada
      return isPointInRect(x, y, element.x - 10, element.y - 10, 20, 20);
    }

    if (element.type === "button" && element.metadata?.borderRadius) {
      const borderRadius = Number(element.metadata.borderRadius);
      if (!isNaN(borderRadius)) {
        return isPointInRoundRect(
          x, y,
          element.x, element.y,
          element.width, element.height,
          borderRadius
        );
      }
    }

    return isPointInRect(x, y, element.x, element.y, element.width, element.height);
  }

  // ==========================================================================
  // UTILITÁRIOS
  // ==========================================================================

  private clearCanvas(): void {
    if (!this.ctx || !this.canvas) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private markElementDirty(id: string): void {
    if (this.config.enableDirtyChecking) {
      this.dirtyElements.add(id);
      
      const element = this.elements.get(id);
      if (element) {
        element.metadata.isDirty = true;
      }
    }
  }

  private generateCacheKey(element: UIElement): string {
    // Gera chave de cache baseada nas propriedades do elemento
    return `${element.type}_${element.id}_${element.x}_${element.y}_${element.width}_${element.height}_${element.text}_${element.value}_${element.maxValue}_${element.color}`;
  }

  private createEmptyElement(): ElementWithMetadata {
    return {
      id: "",
      type: "text",
      x: 0,
      y: 0,
      visible: true,
      enabled: true,
      zIndex: 0,
      metadata: {
        isDirty: true,
        lastRenderTime: 0
      }
    };
  }

  private resetElement(element: ElementWithMetadata): void {
    element.id = "";
    element.type = "text";
    element.x = 0;
    element.y = 0;
    element.visible = true;
    element.enabled = true;
    element.zIndex = 0;
    element.metadata.isDirty = true;
    element.metadata.lastRenderTime = 0;
    delete element.metadata.cacheKey;
    delete element.metadata.isHovered;
    delete element.metadata.isPressed;
  }

  private getDefaultConfigForState(gameState: GameState): UIConfig {
    switch (gameState) {
      case "START":
        return { startScreen: this.screenConfigs.startScreen };
      case "PLAYING":
        return { hud: this.screenConfigs.hud };
      case "GAME_OVER":
        return { gameOverScreen: this.screenConfigs.gameOverScreen };
      case "VICTORY":
        return { victoryScreen: this.screenConfigs.victoryScreen };
      case "PAUSED":
        return { pauseScreen: this.screenConfigs.pauseScreen };
      case "MENU":
        return { menuScreen: this.screenConfigs.menuScreen };
      default:
        return {};
    }
  }

  private logPerformanceMetrics(): void {
    const metrics = {
      frameCount: this.frameCount,
      elementCount: this.elements.size,
      dirtyElements: this.dirtyElements.size,
      cacheSize: this.elementCache.size(),
      poolSize: this.elementPool.size(),
      lastRenderTime: this.lastRenderTime,
      estimatedFPS: this.lastRenderTime > 0 ? Math.round(TIME_CONSTANTS.MS_TO_SECONDS / this.lastRenderTime) : 0
    };

    this.log("debug", "Performance metrics", metrics);
  }

  private log(level: "info" | "warn" | "error" | "debug", message: string, data?: unknown): void {
    logUISystem(level, message, data as Record<string, unknown> | undefined, this.config.enablePerformanceLogging);
  }

  // ==========================================================================
  // API PÚBLICA
  // ==========================================================================

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  getElementCount(): number {
    return this.elements.size;
  }

  getDirtyElementCount(): number {
    return this.dirtyElements.size;
  }

  getCacheSize(): number {
    return this.elementCache.size();
  }

  getPoolSize(): number {
    return this.elementPool.size();
  }

  getLastRenderTime(): number {
    return this.lastRenderTime;
  }

  getEstimatedFPS(): number {
    return this.lastRenderTime > 0 ? Math.round(TIME_CONSTANTS.MS_TO_SECONDS / this.lastRenderTime) : 0;
  }

  getConfig(): UISystemConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<UISystemConfig>): void {
    this.config = mergeConfigs(this.config, newConfig);
    this.log("info", "Configuração atualizada", { config: this.config });
  }

  updateScreenConfigs(newConfigs: Partial<ScreenConfigs>): void {
    this.screenConfigs = validateScreenConfigs({ ...this.screenConfigs, ...newConfigs });
    this.log("info", "Configurações de tela atualizadas", { screenConfigs: this.screenConfigs });
  }

  forceRedraw(): void {
    // Marca todos os elementos como dirty
    for (const [id, element] of this.elements.entries()) {
      element.metadata.isDirty = true;
      this.dirtyElements.add(id);
    }
    
    this.log("debug", "Redraw forçado", { elementCount: this.elements.size });
  }
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default UISystem;