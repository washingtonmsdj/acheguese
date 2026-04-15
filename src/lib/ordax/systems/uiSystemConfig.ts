/**
 * 🎨 UI SYSTEM CONFIG - Configuração centralizada para sistema de UI
 * 
 * @version 2.0.0
 * @build 2026-04-11
 * @changelog
 *   - 2.0.0: SSOT compliance - imports constants from config.ts
 */

import { 
  DEFAULT_COLORS, 
  DEFAULT_FONTS, 
  DEFAULT_PADDING, 
  DEFAULT_SIZES 
} from "./uiSystemTypes";
import { WORLD, UI_DEFAULTS, ENGINE_PERFORMANCE } from "../config";

// ============================================================================
// CONFIGURAÇÃO DO SISTEMA
// ============================================================================

export interface UISystemConfig {
  // Renderização
  enableCaching: boolean;
  cacheDuration: number; // ms
  enableDirtyChecking: boolean;
  maxElements: number;
  enablePerformanceLogging: boolean;
  
  // Canvas
  defaultCanvasWidth: number;
  defaultCanvasHeight: number;
  enableAutoResize: boolean;
  
  // Input
  enableMouseInput: boolean;
  enableTouchInput: boolean;
  clickThreshold: number; // ms
  doubleClickThreshold: number; // ms
  
  // Estilo
  defaultTextColor: string;
  defaultBackgroundColor: string;
  defaultBorderColor: string;
  defaultButtonColor: string;
  defaultFontFamily: string;
  
  // Performance
  frameRate: number;
  batchRenderSize: number;
  enableObjectPooling: boolean;
  poolSize: number;
  
  // Debug
  enableDebugOverlay: boolean;
  showFPS: boolean;
  showElementCount: boolean;
  showPerformanceMetrics: boolean;
}

export const DEFAULT_CONFIG: UISystemConfig = {
  // Renderização
  enableCaching: true,
  cacheDuration: UI_DEFAULTS.CACHE_DURATION_MS,
  enableDirtyChecking: true,
  maxElements: UI_DEFAULTS.MAX_ELEMENTS,
  enablePerformanceLogging: false,
  
  // Canvas
  defaultCanvasWidth: WORLD.W,
  defaultCanvasHeight: WORLD.H,
  enableAutoResize: true,
  
  // Input
  enableMouseInput: true,
  enableTouchInput: true,
  clickThreshold: UI_DEFAULTS.CLICK_THRESHOLD_MS,
  doubleClickThreshold: UI_DEFAULTS.DOUBLE_CLICK_THRESHOLD_MS,
  
  // Estilo
  defaultTextColor: DEFAULT_COLORS.TEXT,
  defaultBackgroundColor: DEFAULT_COLORS.BACKGROUND,
  defaultBorderColor: DEFAULT_COLORS.BORDER,
  defaultButtonColor: DEFAULT_COLORS.BUTTON,
  defaultFontFamily: "monospace",
  
  // Performance
  frameRate: ENGINE_PERFORMANCE.TARGET_FPS,
  batchRenderSize: UI_DEFAULTS.BATCH_RENDER_SIZE,
  enableObjectPooling: true,
  poolSize: UI_DEFAULTS.POOL_SIZE,
  
  // Debug
  enableDebugOverlay: false,
  showFPS: false,
  showElementCount: false,
  showPerformanceMetrics: false,
};

// ============================================================================
// CONFIGURAÇÃO DE TELAS
// ============================================================================

export interface ScreenConfigs {
  startScreen: StartScreenConfig;
  hud: HUDConfig;
  gameOverScreen: GameOverScreenConfig;
  victoryScreen: VictoryScreenConfig;
  pauseScreen: PauseScreenConfig;
  menuScreen: MenuScreenConfig;
}

export interface StartScreenConfig {
  title: string;
  subtitle: string;
  instructions: string[];
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonText: string;
  titleFont: string;
  subtitleFont: string;
  instructionsFont: string;
  buttonFont: string;
}

export interface HUDConfig {
  position: "top" | "bottom" | "left" | "right";
  padding: number;
  backgroundColor: string;
  textColor: string;
  barColor: string;
  barBackgroundColor: string;
  showHealth: boolean;
  showScore: boolean;
  showTimer: boolean;
  showAmmo: boolean;
  showWave: boolean;
  showMiniMap: boolean;
  healthBarWidth: number;
  healthBarHeight: number;
  scoreFont: string;
  timerFont: string;
}

export interface GameOverScreenConfig {
  title: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonHoverColor: string;
  showFinalScore: boolean;
  showHighScore: boolean;
  showTimeSurvived: boolean;
  showRestartButton: boolean;
  showMenuButton: boolean;
  restartButtonText: string;
  menuButtonText: string;
  titleFont: string;
  scoreFont: string;
  buttonFont: string;
}

export interface VictoryScreenConfig {
  title: string;
  subtitle: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  showScore: boolean;
  showTime: boolean;
  showNextLevelButton: boolean;
  showReplayButton: boolean;
  nextLevelButtonText: string;
  replayButtonText: string;
}

export interface PauseScreenConfig {
  title: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  showResumeButton: boolean;
  showRestartButton: boolean;
  showMenuButton: boolean;
  showSettingsButton: boolean;
  resumeButtonText: string;
  restartButtonText: string;
  menuButtonText: string;
  settingsButtonText: string;
}

export interface MenuScreenConfig {
  title: string;
  backgroundColor: string;
  textColor: string;
  selectedColor: string;
  items: MenuItemConfig[];
  titleFont: string;
  itemFont: string;
}

export interface MenuItemConfig {
  id: string;
  text: string;
  actionId: string;
  enabled: boolean;
  shortcut?: string;
}

// ============================================================================
// CONFIGURAÇÕES PADRÃO
// ============================================================================

export const DEFAULT_SCREEN_CONFIGS: ScreenConfigs = {
  startScreen: {
    title: "Bem-vindo ao Jogo",
    subtitle: "Pressione ESPAÇO para começar",
    instructions: [
      "WASD ou SETAS - Movimentar",
      "ESPAÇO - Pular/Atirar",
      "ESC - Pausar",
      "R - Reiniciar"
    ],
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    textColor: DEFAULT_COLORS.TEXT,
    buttonColor: DEFAULT_COLORS.BUTTON,
    buttonText: "COMEÇAR",
    titleFont: DEFAULT_FONTS.TITLE,
    subtitleFont: DEFAULT_FONTS.SUBTITLE,
    instructionsFont: DEFAULT_FONTS.BODY,
    buttonFont: DEFAULT_FONTS.BUTTON,
  },
  
  hud: {
    position: "top",
    padding: DEFAULT_PADDING.ELEMENT,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    textColor: DEFAULT_COLORS.TEXT,
    barColor: DEFAULT_COLORS.HEALTH_BAR,
    barBackgroundColor: DEFAULT_COLORS.HEALTH_BAR_BACKGROUND,
    showHealth: true,
    showScore: true,
    showTimer: true,
    showAmmo: false,
    showWave: false,
    showMiniMap: false,
    healthBarWidth: DEFAULT_SIZES.BAR_WIDTH,
    healthBarHeight: DEFAULT_SIZES.BAR_HEIGHT,
    scoreFont: DEFAULT_FONTS.BODY,
    timerFont: DEFAULT_FONTS.BODY,
  },
  
  gameOverScreen: {
    title: "GAME OVER",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    textColor: DEFAULT_COLORS.TEXT,
    buttonColor: DEFAULT_COLORS.BUTTON,
    buttonHoverColor: DEFAULT_COLORS.BUTTON_HOVER,
    showFinalScore: true,
    showHighScore: true,
    showTimeSurvived: true,
    showRestartButton: true,
    showMenuButton: true,
    restartButtonText: "REINICIAR",
    menuButtonText: "MENU",
    titleFont: DEFAULT_FONTS.TITLE,
    scoreFont: DEFAULT_FONTS.SUBTITLE,
    buttonFont: DEFAULT_FONTS.BUTTON,
  },
  
  victoryScreen: {
    title: "VITÓRIA!",
    subtitle: "Parabéns, você venceu!",
    backgroundColor: "rgba(0, 100, 0, 0.8)",
    textColor: DEFAULT_COLORS.TEXT,
    buttonColor: DEFAULT_COLORS.SUCCESS,
    showScore: true,
    showTime: true,
    showNextLevelButton: true,
    showReplayButton: true,
    nextLevelButtonText: "PRÓXIMO NÍVEL",
    replayButtonText: "JOGAR NOVAMENTE",
  },
  
  pauseScreen: {
    title: "PAUSADO",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    textColor: DEFAULT_COLORS.TEXT,
    buttonColor: DEFAULT_COLORS.BUTTON,
    showResumeButton: true,
    showRestartButton: true,
    showMenuButton: true,
    showSettingsButton: false,
    resumeButtonText: "CONTINUAR",
    restartButtonText: "REINICIAR",
    menuButtonText: "MENU",
    settingsButtonText: "CONFIGURAÇÕES",
  },
  
  menuScreen: {
    title: "MENU PRINCIPAL",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    textColor: DEFAULT_COLORS.TEXT,
    selectedColor: DEFAULT_COLORS.BUTTON,
    items: [
      { id: "new_game", text: "NOVO JOGO", actionId: "start_new_game", enabled: true },
      { id: "continue", text: "CONTINUAR", actionId: "continue_game", enabled: false },
      { id: "settings", text: "CONFIGURAÇÕES", actionId: "open_settings", enabled: true },
      { id: "credits", text: "CRÉDITOS", actionId: "show_credits", enabled: true },
      { id: "quit", text: "SAIR", actionId: "quit_game", enabled: true },
    ],
    titleFont: DEFAULT_FONTS.TITLE,
    itemFont: DEFAULT_FONTS.BUTTON,
  },
};

// ============================================================================
// CONFIGURAÇÃO DE ELEMENTOS
// ============================================================================

export interface ElementDefaults {
  text: TextElementDefaults;
  bar: BarElementDefaults;
  button: ButtonElementDefaults;
  image: ImageElementDefaults;
  panel: PanelElementDefaults;
}

export interface TextElementDefaults {
  color: string;
  fontSize: number;
  fontFamily: string;
  align: CanvasTextAlign;
  baseline: CanvasTextBaseline;
  maxWidth?: number;
}

export interface BarElementDefaults {
  width: number;
  height: number;
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  showValue: boolean;
  valueColor: string;
  valueFont: string;
}

export interface ButtonElementDefaults {
  width: number;
  height: number;
  color: string;
  hoverColor: string;
  disabledColor: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  font: string;
  padding: number;
}

export interface ImageElementDefaults {
  width: number;
  height: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export interface PanelElementDefaults {
  width: number;
  height: number;
  color: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
}

export const DEFAULT_ELEMENT_DEFAULTS: ElementDefaults = {
  text: {
    color: DEFAULT_COLORS.TEXT,
    fontSize: 16,
    fontFamily: "monospace",
    align: "left",
    baseline: "top",
    maxWidth: 400,
  },
  
  bar: {
    width: DEFAULT_SIZES.BAR_WIDTH,
    height: DEFAULT_SIZES.BAR_HEIGHT,
    color: DEFAULT_COLORS.HEALTH_BAR,
    backgroundColor: DEFAULT_COLORS.HEALTH_BAR_BACKGROUND,
    borderColor: DEFAULT_COLORS.BORDER,
    borderWidth: 1,
    showValue: true,
    valueColor: DEFAULT_COLORS.TEXT,
    valueFont: DEFAULT_FONTS.SMALL,
  },
  
  button: {
    width: DEFAULT_SIZES.BUTTON_WIDTH,
    height: DEFAULT_SIZES.BUTTON_HEIGHT,
    color: DEFAULT_COLORS.BUTTON,
    hoverColor: DEFAULT_COLORS.BUTTON_HOVER,
    disabledColor: DEFAULT_COLORS.BUTTON_DISABLED,
    textColor: DEFAULT_COLORS.TEXT,
    borderColor: DEFAULT_COLORS.BORDER,
    borderWidth: 2,
    borderRadius: 5,
    font: DEFAULT_FONTS.BUTTON,
    padding: DEFAULT_PADDING.BUTTON,
  },
  
  image: {
    width: 64,
    height: 64,
    scale: 1.0,
    rotation: 0,
    opacity: 1.0,
  },
  
  panel: {
    width: 300,
    height: 200,
    color: DEFAULT_COLORS.BACKGROUND,
    borderColor: DEFAULT_COLORS.BORDER,
    borderWidth: 1,
    borderRadius: 5,
    padding: DEFAULT_PADDING.ELEMENT,
  },
};

// ============================================================================
// VALIDAÇÃO DE CONFIGURAÇÃO
// ============================================================================

export function validateConfig(config: Partial<UISystemConfig>): UISystemConfig {
  const validated = { ...DEFAULT_CONFIG, ...config };
  
  // Validações
  if (validated.cacheDuration < 0) {
    validated.cacheDuration = DEFAULT_CONFIG.cacheDuration;
  }
  
  if (validated.maxElements <= 0) {
    validated.maxElements = DEFAULT_CONFIG.maxElements;
  }
  
  if (validated.defaultCanvasWidth <= 0) {
    validated.defaultCanvasWidth = DEFAULT_CONFIG.defaultCanvasWidth;
  }
  
  if (validated.defaultCanvasHeight <= 0) {
    validated.defaultCanvasHeight = DEFAULT_CONFIG.defaultCanvasHeight;
  }
  
  if (validated.clickThreshold < 0) {
    validated.clickThreshold = DEFAULT_CONFIG.clickThreshold;
  }
  
  if (validated.doubleClickThreshold < validated.clickThreshold) {
    validated.doubleClickThreshold = validated.clickThreshold * 2.5;
  }
  
  if (validated.frameRate <= 0 || validated.frameRate > 240) {
    validated.frameRate = DEFAULT_CONFIG.frameRate;
  }
  
  if (validated.batchRenderSize <= 0) {
    validated.batchRenderSize = DEFAULT_CONFIG.batchRenderSize;
  }
  
  if (validated.poolSize <= 0) {
    validated.poolSize = DEFAULT_CONFIG.poolSize;
  }
  
  return validated;
}

export function validateScreenConfigs(configs: Partial<ScreenConfigs>): ScreenConfigs {
  return { ...DEFAULT_SCREEN_CONFIGS, ...configs };
}

// ============================================================================
// UTILITÁRIOS DE CONFIGURAÇÃO
// ============================================================================

export function getScreenConfig<T extends keyof ScreenConfigs>(
  screen: T,
  customConfigs?: Partial<ScreenConfigs>
): ScreenConfigs[T] {
  const configs = customConfigs 
    ? validateScreenConfigs(customConfigs)
    : DEFAULT_SCREEN_CONFIGS;
  
  return configs[screen];
}

export function mergeConfigs(
  base: UISystemConfig,
  overrides: Partial<UISystemConfig>
): UISystemConfig {
  return validateConfig({ ...base, ...overrides });
}

export function createConfig(
  customConfig: Partial<UISystemConfig> = {},
  customScreenConfigs: Partial<ScreenConfigs> = {}
): { system: UISystemConfig; screens: ScreenConfigs } {
  return {
    system: validateConfig(customConfig),
    screens: validateScreenConfigs(customScreenConfigs),
  };
}

// ============================================================================
// CONSTANTES DE PERFORMANCE
// ============================================================================

export const PERFORMANCE_CONSTANTS = {
  MAX_ELEMENTS_PER_FRAME: 100,
  CACHE_HIT_RATIO_TARGET: 0.8,
  DIRTY_CHECK_THRESHOLD: 10,
  RENDER_BATCH_SIZE: 50,
  POOL_CLEANUP_INTERVAL: 5000, // ms
  MEMORY_WARNING_THRESHOLD: 50 * 1024 * 1024, // 50MB
} as const;

// All exports are inline above