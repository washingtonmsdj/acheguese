/**
 * 🎨 UI SYSTEM UTILS - Utilitários para sistema de UI
 * 
 * @version 2.0.0
 * @build 2026-04-10
 * @changelog
 *   - 2.0.0: Usando UI_DEFAULTS do config para validações (SSOT compliant)
 *   - 1.0.0: Versão inicial
 */

import { 
  UIElement, 
  UIElementType, 
  isValidColor, 
  validateCoordinates,
  DEFAULT_COLORS,
  DEFAULT_FONTS,
  DEFAULT_PADDING
} from "./uiSystemTypes";
import { UI_DEFAULTS, VALIDATION_RANGES } from "../config";

// ============================================================================
// VALIDAÇÕES
// ============================================================================

export function validateElementId(id: string): { valid: boolean; error?: string } {
  if (!id || typeof id !== "string") {
    return { valid: false, error: "ID deve ser uma string não vazia" };
  }
  
  if (id.trim() === "") {
    return { valid: false, error: "ID não pode ser vazio ou apenas espaços" };
  }
  
  if (id.length > UI_DEFAULTS.MAX_ID_LENGTH) {
    return { valid: false, error: `ID muito longo (máximo ${UI_DEFAULTS.MAX_ID_LENGTH} caracteres)` };
  }
  
  // Valida caracteres permitidos
  const validChars = /^[a-zA-Z0-9_-]+$/;
  if (!validChars.test(id)) {
    return { valid: false, error: "ID contém caracteres inválidos (use apenas letras, números, _ e -)" };
  }
  
  return { valid: true };
}

export function validateElementPosition(
  x: number, 
  y: number, 
  canvasWidth: number, 
  canvasHeight: number
): { valid: boolean; error?: string } {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return { valid: false, error: "Coordenadas devem ser números finitos" };
  }
  
  if (x < 0 || x > canvasWidth || y < 0 || y > canvasHeight) {
    return { 
      valid: false, 
      error: `Coordenadas fora do canvas (${canvasWidth}x${canvasHeight}): x=${x}, y=${y}` 
    };
  }
  
  return { valid: true };
}

export function validateElementSize(
  width?: number, 
  height?: number
): { valid: boolean; error?: string } {
  if (width !== undefined) {
    if (!Number.isFinite(width)) {
      return { valid: false, error: "Largura deve ser um número finito" };
    }
    if (width < 0) {
      return { valid: false, error: "Largura não pode ser negativa" };
    }
    if (width > VALIDATION_RANGES.DIMENSION.MAX) {
      return { valid: false, error: `Largura muito grande (máximo ${VALIDATION_RANGES.DIMENSION.MAX})` };
    }
  }
  
  if (height !== undefined) {
    if (!Number.isFinite(height)) {
      return { valid: false, error: "Altura deve ser um número finito" };
    }
    if (height < 0) {
      return { valid: false, error: "Altura não pode ser negativa" };
    }
    if (height > VALIDATION_RANGES.DIMENSION.MAX) {
      return { valid: false, error: `Altura muito grande (máximo ${VALIDATION_RANGES.DIMENSION.MAX})` };
    }
  }
  
  return { valid: true };
}

export function validateElementValue(
  value?: number, 
  maxValue?: number, 
  minValue?: number
): { valid: boolean; error?: string } {
  if (value !== undefined) {
    if (!Number.isFinite(value)) {
      return { valid: false, error: "Valor deve ser um número finito" };
    }
    
    if (maxValue !== undefined && value > maxValue) {
      return { valid: false, error: `Valor (${value}) maior que valor máximo (${maxValue})` };
    }
    
    if (minValue !== undefined && value < minValue) {
      return { valid: false, error: `Valor (${value}) menor que valor mínimo (${minValue})` };
    }
  }
  
  if (maxValue !== undefined && !Number.isFinite(maxValue)) {
    return { valid: false, error: "Valor máximo deve ser um número finito" };
  }
  
  if (minValue !== undefined && !Number.isFinite(minValue)) {
    return { valid: false, error: "Valor mínimo deve ser um número finito" };
  }
  
  if (minValue !== undefined && maxValue !== undefined && minValue > maxValue) {
    return { valid: false, error: `Valor mínimo (${minValue}) maior que valor máximo (${maxValue})` };
  }
  
  return { valid: true };
}

export function validateElementText(text?: string): { valid: boolean; error?: string } {
  if (text === undefined) {
    return { valid: true };
  }
  
  if (typeof text !== "string") {
    return { valid: false, error: "Texto deve ser uma string" };
  }
  
  if (text.length > UI_DEFAULTS.MAX_TEXT_LENGTH) {
    return { valid: false, error: `Texto muito longo (máximo ${UI_DEFAULTS.MAX_TEXT_LENGTH} caracteres)` };
  }
  
  return { valid: true };
}

export function validateElementColor(color?: string): { valid: boolean; error?: string } {
  if (color === undefined) {
    return { valid: true };
  }
  
  if (!isValidColor(color)) {
    return { valid: false, error: `Cor inválida: ${color}` };
  }
  
  return { valid: true };
}

// ============================================================================
// RENDERIZAÇÃO
// ============================================================================

export function renderText(
  ctx: CanvasRenderingContext2D,
  element: UIElement,
  defaults: {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
  } = {}
): void {
  try {
    const color = element.color || defaults.color || DEFAULT_COLORS.TEXT;
    const fontSize = element.metadata?.fontSize || defaults.fontSize || 16;
    const fontFamily = element.metadata?.fontFamily || defaults.fontFamily || "monospace";
    const align = element.metadata?.align || defaults.align || "left";
    const baseline = element.metadata?.baseline || defaults.baseline || "top";
    
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    
    const text = element.text || "";
    const maxWidth = element.width || defaults.align === "center" ? undefined : 400;
    
    if (maxWidth && ctx.measureText(text).width > maxWidth) {
      // Trunca texto se for muito longo
      let truncated = text;
      while (truncated.length > 3 && ctx.measureText(truncated + "...").width > maxWidth) {
        truncated = truncated.slice(0, -1);
      }
      ctx.fillText(truncated + "...", element.x, element.y, maxWidth);
    } else {
      ctx.fillText(text, element.x, element.y, maxWidth);
    }
  } catch {
    renderFallback(ctx, element);
  }
}

export function renderBar(
  ctx: CanvasRenderingContext2D,
  element: UIElement,
  defaults: {
    width?: number;
    height?: number;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  } = {}
): void {
  try {
    const width = element.width || defaults.width || 200;
    const height = element.height || defaults.height || 20;
    const color = element.color || defaults.color || DEFAULT_COLORS.HEALTH_BAR;
    const backgroundColor = element.metadata?.backgroundColor || defaults.backgroundColor || DEFAULT_COLORS.HEALTH_BAR_BACKGROUND;
    const borderColor = element.metadata?.borderColor || defaults.borderColor || DEFAULT_COLORS.BORDER;
    const borderWidth = element.metadata?.borderWidth || defaults.borderWidth || 1;
    
    const value = element.value || 0;
    const maxValue = element.maxValue || VALIDATION_RANGES.HEALTH.DEFAULT;
    const percent = Math.max(0, Math.min(1, value / maxValue));
    
    // Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(element.x, element.y, width, height);
    
    // Fill
    ctx.fillStyle = color;
    ctx.fillRect(element.x, element.y, width * percent, height);
    
    // Border
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(element.x, element.y, width, height);
    }
    
    // Texto do valor (opcional)
    if (element.metadata?.showValue !== false) {
      const valueColor = element.metadata?.valueColor || DEFAULT_COLORS.TEXT;
      const valueFont = element.metadata?.valueFont || DEFAULT_FONTS.SMALL;
      
      ctx.fillStyle = valueColor;
      ctx.font = valueFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const valueText = `${Math.round(value)}/${maxValue}`;
      ctx.fillText(
        valueText,
        element.x + width / 2,
        element.y + height / 2
      );
    }
  } catch {
    renderFallback(ctx, element);
  }
}

export function renderButton(
  ctx: CanvasRenderingContext2D,
  element: UIElement,
  defaults: {
    width?: number;
    height?: number;
    color?: string;
    hoverColor?: string;
    textColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    font?: string;
    padding?: number;
  } = {}
): void {
  try {
    const width = element.width || defaults.width || 200;
    const height = element.height || defaults.height || 50;
    const color = element.color || defaults.color || DEFAULT_COLORS.BUTTON;
    const textColor = element.metadata?.textColor || defaults.textColor || DEFAULT_COLORS.TEXT;
    const borderColor = element.metadata?.borderColor || defaults.borderColor || DEFAULT_COLORS.BORDER;
    const borderWidth = element.metadata?.borderWidth || defaults.borderWidth || 2;
    const borderRadius = element.metadata?.borderRadius || defaults.borderRadius || 5;
    const font = element.metadata?.font || defaults.font || DEFAULT_FONTS.BUTTON;
    const padding = element.metadata?.padding || defaults.padding || DEFAULT_PADDING.BUTTON;
    
    const isHovered = element.metadata?.isHovered || false;
    const isPressed = element.metadata?.isPressed || false;
    const isDisabled = !element.enabled;
    
    // Cor baseada no estado
    let fillColor = color;
    if (isDisabled) {
      fillColor = element.metadata?.disabledColor || defaults.hoverColor || DEFAULT_COLORS.BUTTON_DISABLED;
    } else if (isPressed) {
      fillColor = element.metadata?.pressedColor || darkenColor(color, 0.2);
    } else if (isHovered) {
      fillColor = element.metadata?.hoverColor || defaults.hoverColor || lightenColor(color, 0.1);
    }
    
    // Background com borda arredondada
    ctx.fillStyle = fillColor;
    roundRect(ctx, element.x, element.y, width, height, borderRadius);
    ctx.fill();
    
    // Borda
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      roundRect(ctx, element.x, element.y, width, height, borderRadius);
      ctx.stroke();
    }
    
    // Texto
    const text = element.text || "Button";
    ctx.fillStyle = textColor;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    ctx.fillText(
      text,
      element.x + width / 2,
      element.y + height / 2
    );
    
    // Efeito de desabilitado
    if (isDisabled) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      roundRect(ctx, element.x, element.y, width, height, borderRadius);
      ctx.fill();
    }
  } catch {
    renderFallback(ctx, element);
  }
}

export function renderImage(
  ctx: CanvasRenderingContext2D,
  element: UIElement,
  image?: HTMLImageElement | null
): void {
  try {
    if (!image) {
      renderFallback(ctx, element);
      return;
    }
    
    const width = element.width || image.width;
    const height = element.height || image.height;
    const scale = element.metadata?.scale || 1.0;
    const rotation = element.metadata?.rotation || 0;
    const opacity = element.metadata?.opacity || 1.0;
    
    ctx.save();
    
    // Aplica transformações
    ctx.translate(element.x + width * scale / 2, element.y + height * scale / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.globalAlpha = opacity;
    
    // Desenha imagem
    ctx.drawImage(
      image,
      -width * scale / 2,
      -height * scale / 2,
      width * scale,
      height * scale
    );
    
    ctx.restore();
  } catch {
    renderFallback(ctx, element);
  }
}

export function renderFallback(
  ctx: CanvasRenderingContext2D,
  element: UIElement
): void {
  // Fallback simples para quando a renderização falha
  const width = element.width || UI_DEFAULTS.BUTTON_WIDTH;
  const height = element.height || UI_DEFAULTS.BUTTON_HEIGHT;
  
  ctx.fillStyle = "#ff0000";
  ctx.fillRect(element.x, element.y, width, height);
  
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(element.x, element.y, width, height);
  
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `ERR: ${element.type}`,
    element.x + width / 2,
    element.y + height / 2
  );
}

// ============================================================================
// UTILITÁRIOS DE CORES
// ============================================================================

export function lightenColor(color: string, amount: number): string {
  try {
    if (color.startsWith("#")) {
      return lightenHexColor(color, amount);
    } else if (color.startsWith("rgb")) {
      return lightenRgbColor(color, amount);
    }
    return color;
  } catch {
    return color;
  }
}

export function darkenColor(color: string, amount: number): string {
  try {
    if (color.startsWith("#")) {
      return darkenHexColor(color, amount);
    } else if (color.startsWith("rgb")) {
      return darkenRgbColor(color, amount);
    }
    return color;
  } catch {
    return color;
  }
}

function lightenHexColor(hex: string, amount: number): string {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  
  r = Math.min(255, r + Math.round(255 * amount));
  g = Math.min(255, g + Math.round(255 * amount));
  b = Math.min(255, b + Math.round(255 * amount));
  
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function darkenHexColor(hex: string, amount: number): string {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  
  r = Math.max(0, r - Math.round(255 * amount));
  g = Math.max(0, g - Math.round(255 * amount));
  b = Math.max(0, b - Math.round(255 * amount));
  
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function lightenRgbColor(rgb: string, amount: number): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
  if (!match) return rgb;
  
  let r = parseInt(match[1]);
  let g = parseInt(match[2]);
  let b = parseInt(match[3]);
  const a = match[4] ? parseFloat(match[4]) : 1;
  
  r = Math.min(255, r + Math.round(255 * amount));
  g = Math.min(255, g + Math.round(255 * amount));
  b = Math.min(255, b + Math.round(255 * amount));
  
  if (rgb.startsWith("rgba")) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function darkenRgbColor(rgb: string, amount: number): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
  if (!match) return rgb;
  
  let r = parseInt(match[1]);
  let g = parseInt(match[2]);
  let b = parseInt(match[3]);
  const a = match[4] ? parseFloat(match[4]) : 1;
  
  r = Math.max(0, r - Math.round(255 * amount));
  g = Math.max(0, g - Math.round(255 * amount));
  b = Math.max(0, b - Math.round(255 * amount));
  
  if (rgb.startsWith("rgba")) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

// ============================================================================
// UTILITÁRIOS DE GEOMETRIA
// ============================================================================

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  if (radius > width / 2) radius = width / 2;
  if (radius > height / 2) radius = height / 2;
  
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function isPointInRect(
  x: number,
  y: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean {
  return x >= rectX && x <= rectX + rectWidth && y >= rectY && y <= rectY + rectHeight;
}

export function isPointInRoundRect(
  x: number,
  y: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number,
  radius: number
): boolean {
  // Primeiro verifica se está dentro do retângulo sem bordas arredondadas
  if (!isPointInRect(x, y, rectX, y, rectWidth, rectHeight)) {
    return false;
  }
  
  // Verifica cantos arredondados
  const corners = [
    { cx: rectX + radius, cy: rectY + radius, r: radius }, // superior esquerdo
    { cx: rectX + rectWidth - radius, cy: rectY + radius, r: radius }, // superior direito
    { cx: rectX + radius, cy: rectY + rectHeight - radius, r: radius }, // inferior esquerdo
    { cx: rectX + rectWidth - radius, cy: rectY + rectHeight - radius, r: radius }, // inferior direito
  ];
  
  // Verifica se está em alguma área retangular central
  if (x >= rectX + radius && x <= rectX + rectWidth - radius) return true;
  if (y >= rectY + radius && y <= rectY + rectHeight - radius) return true;
  
  // Verifica cantos arredondados
  for (const corner of corners) {
    const dx = x - corner.cx;
    const dy = y - corner.cy;
    if (dx * dx + dy * dy <= corner.r * corner.r) {
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// UTILITÁRIOS DE PERFORMANCE
// ============================================================================

export class ElementCache {
  private cache: Map<string, { element: UIElement; timestamp: number }> = new Map();
  private maxSize: number;
  private ttl: number; // time to live in ms
  
  constructor(maxSize: number = 1000, ttl: number = 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }
  
  set(key: string, element: UIElement): void {
    this.cleanup();
    
    if (this.cache.size >= this.maxSize) {
      // Remove o mais antigo
      const oldestKey = Array.from(this.cache.entries())
        .reduce((oldest: string, entry: [string, { element: UIElement; timestamp: number }]) => entry[1].timestamp < this.cache.get(oldest)!.timestamp ? entry[0] : oldest, Array.from(this.cache.keys())[0]);
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      element: { ...element },
      timestamp: Date.now()
    });
  }
  
  get(key: string): UIElement | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return { ...entry.element };
  }
  
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    this.cleanup();
    return this.cache.size;
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;
  
  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize: number = 100
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }
  
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }
  
  clear(): void {
    this.pool = [];
  }
  
  size(): number {
    return this.pool.length;
  }
}

// ============================================================================
// LOGGING E DEBUG
// ============================================================================

/**
 * Log messages do UISystem com type safety
 * 
 * @param level - Nível do log
 * @param message - Mensagem a ser logada
 * @param data - Dados adicionais (type-safe com unknown)
 * @param enableLogging - Se deve logar (default: false)
 */
export function logUISystem(
  level: "info" | "warn" | "error" | "debug",
  message: string,
  data?: unknown,  // ✅ Type-safe: unknown instead of any
  enableLogging: boolean = false
): void {
  if (level === "debug" && !enableLogging) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] UISystem:`;
  
  switch (level) {
    case "info":
    case "warn":
    case "error":
    case "debug":
      // Logs silenciados conforme regras - usar DebugLogPanel se necessário
      break;
  }
}

export function measurePerformance<T>(
  name: string,
  fn: () => T,
  enableLogging: boolean = false
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (enableLogging) {
    logUISystem("debug", `Performance: ${name}`, { duration: end - start });
  }
  
  return result;
}