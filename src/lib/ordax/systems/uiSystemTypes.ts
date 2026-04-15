/**
 * 🎨 UI SYSTEM TYPES - Tipos TypeScript para sistema de UI
 * 
 * @version 1.0.0
 * @build 2026-02-17
 */

// Import SSOT constants (must be at top)
import { UI_DEFAULTS } from "../config";

// ============================================================================
// TIPOS DE ESTADO DO JOGO
// ============================================================================

export type GameState = 
  | "START"
  | "PLAYING"
  | "PAUSED"
  | "GAME_OVER"
  | "VICTORY"
  | "MENU";

// ============================================================================
// TIPOS DE ELEMENTOS DE UI
// ============================================================================

export type UIElementType = 
  | "text"
  | "bar"
  | "button"
  | "image"
  | "panel"
  | "progress"
  | "icon"
  | "label"
  | "input"
  | "slider";

export interface UIElement {
  id: string;
  type: UIElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  value?: number;
  maxValue?: number;
  minValue?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  fontSize?: number;
  fontFamily?: string;
  visible: boolean;
  enabled: boolean;
  zIndex: number;
  onClick?: (element: UIElement, event?: MouseEvent) => void;
  onHover?: (element: UIElement, event?: MouseEvent) => void;
  onFocus?: (element: UIElement) => void;
  onBlur?: (element: UIElement) => void;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// TIPOS DE CONFIGURAÇÃO DE UI
// ============================================================================

export interface UIConfig {
  startScreen?: StartScreenConfig;
  hud?: HUDConfig;
  gameOverScreen?: GameOverScreenConfig;
  victoryScreen?: VictoryScreenConfig;
  pauseScreen?: PauseScreenConfig;
  menuScreen?: MenuScreenConfig;
}

export interface StartScreenConfig {
  title: string;
  subtitle?: string;
  instructions: string[];
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonText?: string;
}

export interface HUDConfig {
  showHealth: boolean;
  showScore: boolean;
  showTimer: boolean;
  showAmmo: boolean;
  showWave: boolean;
  showMiniMap: boolean;
  position: "top" | "bottom" | "left" | "right";
  backgroundColor?: string;
  textColor?: string;
  barColor?: string;
  barBackgroundColor?: string;
}

export interface GameOverScreenConfig {
  title: string;
  showFinalScore: boolean;
  showHighScore: boolean;
  showTimeSurvived: boolean;
  showRestartButton: boolean;
  showMenuButton: boolean;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
}

export interface VictoryScreenConfig {
  title: string;
  subtitle?: string;
  showScore: boolean;
  showTime: boolean;
  showNextLevelButton: boolean;
  showReplayButton: boolean;
}

export interface PauseScreenConfig {
  title: string;
  showResumeButton: boolean;
  showRestartButton: boolean;
  showMenuButton: boolean;
  showSettingsButton: boolean;
}

export interface MenuScreenConfig {
  title: string;
  items: MenuItemConfig[];
  backgroundColor?: string;
  textColor?: string;
  selectedColor?: string;
}

export interface MenuItemConfig {
  id: string;
  text: string;
  actionId: string;
  enabled: boolean;
  shortcut?: string;
}

// Alias para compatibilidade
export type MenuItem = MenuItemConfig;

// ============================================================================
// TIPOS DE ENTIDADES — Re-export from canonical source
// ============================================================================

export type { OrdaxEntity as Entity } from "@/lib/ordax/types";

// ============================================================================
// TIPOS DE SISTEMAS
// ============================================================================

export interface ScoreSystem {
  getScore(): number;
  getHighScore(): number;
  addScore(points: number): void;
  resetScore(): void;
}

export interface TimerSystem {
  getElapsedTime(): number;
  getFormattedTime(): string;
  isRunning(): boolean;
  start(): void;
  stop(): void;
  reset(): void;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isGameState(value: unknown): value is GameState {
  return typeof value === "string" && [
    "START", "PLAYING", "PAUSED", "GAME_OVER", "VICTORY", "MENU"
  ].includes(value);
}

export function isUIElementType(value: unknown): value is UIElementType {
  return typeof value === "string" && [
    "text", "bar", "button", "image", "panel", "progress", 
    "icon", "label", "input", "slider"
  ].includes(value);
}

export function isUIElement(value: unknown): value is UIElement {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>).id === "string" &&
    isUIElementType((value as Record<string, unknown>).type) &&
    typeof (value as Record<string, unknown>).x === "number" &&
    typeof (value as Record<string, unknown>).y === "number" &&
    typeof (value as Record<string, unknown>).visible === "boolean" &&
    typeof (value as Record<string, unknown>).enabled === "boolean" &&
    typeof (value as Record<string, unknown>).zIndex === "number"
  );
}

// Re-export canonical type guards from types.ts
export { isEntity, isEntityArray } from "@/lib/ordax/types";

export function isScoreSystem(value: unknown): value is ScoreSystem {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>).getScore === "function" &&
    typeof (value as Record<string, unknown>).getHighScore === "function" &&
    typeof (value as Record<string, unknown>).addScore === "function" &&
    typeof (value as Record<string, unknown>).resetScore === "function"
  );
}

export function isTimerSystem(value: unknown): value is TimerSystem {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>).getElapsedTime === "function" &&
    typeof (value as Record<string, unknown>).getFormattedTime === "function" &&
    typeof (value as Record<string, unknown>).isRunning === "function" &&
    typeof (value as Record<string, unknown>).start === "function" &&
    typeof (value as Record<string, unknown>).stop === "function" &&
    typeof (value as Record<string, unknown>).reset === "function"
  );
}

export function isUIConfig(value: unknown): value is UIConfig {
  return (
    value !== null &&
    typeof value === "object" &&
    ((value as Record<string, unknown>).startScreen === undefined || typeof (value as Record<string, unknown>).startScreen === "object") &&
    ((value as Record<string, unknown>).hud === undefined || typeof (value as Record<string, unknown>).hud === "object") &&
    ((value as Record<string, unknown>).gameOverScreen === undefined || typeof (value as Record<string, unknown>).gameOverScreen === "object")
  );
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

export function validateUIElement(element: Partial<UIElement>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!element.id || typeof element.id !== "string" || element.id.trim() === "") {
    errors.push("ID inválido ou vazio");
  }

  if (!element.type || !isUIElementType(element.type)) {
    errors.push(`Tipo inválido: ${element.type}`);
  }

  if (typeof element.x !== "number" || !Number.isFinite(element.x)) {
    errors.push("Coordenada X inválida");
  }

  if (typeof element.y !== "number" || !Number.isFinite(element.y)) {
    errors.push("Coordenada Y inválida");
  }

  if (element.width !== undefined && (typeof element.width !== "number" || element.width < 0)) {
    errors.push("Largura inválida");
  }

  if (element.height !== undefined && (typeof element.height !== "number" || element.height < 0)) {
    errors.push("Altura inválida");
  }

  if (element.value !== undefined && (typeof element.value !== "number" || !Number.isFinite(element.value))) {
    errors.push("Valor inválido");
  }

  if (element.maxValue !== undefined && (typeof element.maxValue !== "number" || !Number.isFinite(element.maxValue))) {
    errors.push("Valor máximo inválido");
  }

  if (element.value !== undefined && element.maxValue !== undefined && element.value > element.maxValue) {
    errors.push("Valor maior que valor máximo");
  }

  if (element.color !== undefined && !isValidColor(element.color)) {
    errors.push(`Cor inválida: ${element.color}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function isValidColor(color: string): boolean {
  if (typeof color !== "string") return false;
  
  // Hex color
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(color)) return true;
  
  // RGB/RGBA
  if (/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/.test(color)) return true;
  if (/^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(0|1|0?\.\d+)\)$/.test(color)) return true;
  
  // Named colors (basic)
  const namedColors = [
    "black", "white", "red", "green", "blue", "yellow", "cyan", "magenta",
    "gray", "grey", "orange", "purple", "brown", "pink", "transparent"
  ];
  return namedColors.includes(color.toLowerCase());
}

export function validateCoordinates(x: number, y: number, canvasWidth: number, canvasHeight: number): boolean {
  return (
    Number.isFinite(x) && Number.isFinite(y) &&
    x >= 0 && x <= canvasWidth &&
    y >= 0 && y <= canvasHeight
  );
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

export function createUIElement(
  type: UIElementType,
  id: string,
  x: number,
  y: number,
  options: Partial<UIElement> = {}
): UIElement {
  const defaults: UIElement = {
    id,
    type,
    x,
    y,
    visible: true,
    enabled: true,
    zIndex: 0,
    ...options
  };

  const validation = validateUIElement(defaults);
  if (!validation.valid) {
    throw new Error(`UIElement inválido: ${validation.errors.join(", ")}`);
  }

  return defaults;
}

export function cloneUIElement(element: UIElement): UIElement {
  return {
    ...element,
    onClick: element.onClick,
    onHover: element.onHover,
    onFocus: element.onFocus,
    onBlur: element.onBlur,
    metadata: element.metadata ? { ...element.metadata } : undefined
  };
}

export function mergeUIElements(base: UIElement, updates: Partial<UIElement>): UIElement {
  const merged = { ...base, ...updates };
  
  // Preserva callbacks se não foram sobrescritos
  if (updates.onClick === undefined) merged.onClick = base.onClick;
  if (updates.onHover === undefined) merged.onHover = base.onHover;
  if (updates.onFocus === undefined) merged.onFocus = base.onFocus;
  if (updates.onBlur === undefined) merged.onBlur = base.onBlur;
  
  // Preserva metadata se não foi sobrescrito
  if (updates.metadata === undefined && base.metadata) {
    merged.metadata = { ...base.metadata };
  }
  
  return merged;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const DEFAULT_COLORS = {
  TEXT: "#ffffff",
  BACKGROUND: "rgba(0, 0, 0, 0.7)",
  BORDER: "#ffffff",
  BUTTON: "#4a90e2",
  BUTTON_HOVER: "#357ae8",
  BUTTON_DISABLED: "#666666",
  HEALTH_BAR: "#00ff00",
  HEALTH_BAR_LOW: "#ff0000",
  HEALTH_BAR_BACKGROUND: "#333333",
  SCORE: "#ffff00",
  TIMER: "#00ffff",
  WARNING: "#ff9900",
  ERROR: "#ff0000",
  SUCCESS: "#00ff00"
} as const;

export const DEFAULT_FONTS = {
  TITLE: "48px monospace",
  SUBTITLE: "24px monospace",
  BODY: "16px monospace",
  SMALL: "12px monospace",
  BUTTON: "20px monospace"
} as const;

export const DEFAULT_PADDING = {
  SCREEN: 20,
  ELEMENT: 10,
  BUTTON: 15,
  BAR: 5
} as const;

// ============================================================================
// DEFAULT SIZES - SSOT: Imported from config
// ============================================================================

/**
 * @deprecated Use UI_DEFAULTS from config.ts instead
 * Kept for backward compatibility, but imports from SSOT
 */
export const DEFAULT_SIZES = {
  BUTTON_WIDTH: UI_DEFAULTS.BUTTON_WIDTH,
  BUTTON_HEIGHT: UI_DEFAULTS.BUTTON_HEIGHT,
  BAR_WIDTH: UI_DEFAULTS.BAR_WIDTH,
  BAR_HEIGHT: UI_DEFAULTS.BAR_HEIGHT,
  TEXT_WIDTH: UI_DEFAULTS.TEXT_WIDTH,
  TEXT_HEIGHT: UI_DEFAULTS.TEXT_HEIGHT,
} as const;

