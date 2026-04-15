/**
 * Constantes de Cores do Sistema
 * 
 * Sistema centralizado de cores com suporte a temas, acessibilidade e consistência visual.
 */

import { z } from 'zod';

// Schemas de validação
export const ColorSchema = z.object({
  hex: z.string().regex(/^#[0-9A-F]{6}$/i, 'Formato HEX inválido'),
  rgb: z.object({
    r: z.number().min(0).max(255),
    g: z.number().min(0).max(255),
    b: z.number().min(0).max(255),
  }),
  name: z.string(),
  description: z.string().optional(),
});

export const ColorPaletteSchema = z.object({
  primary: ColorSchema,
  secondary: ColorSchema,
  accent: ColorSchema,
  background: ColorSchema,
  surface: ColorSchema,
  text: ColorSchema,
  error: ColorSchema,
  warning: ColorSchema,
  success: ColorSchema,
  info: ColorSchema,
  disabled: ColorSchema,
});

export const ThemeSchema = z.object({
  light: ColorPaletteSchema,
  dark: ColorPaletteSchema,
  highContrast: ColorPaletteSchema,
});

export type Color = z.infer<typeof ColorSchema>;
export type ColorPalette = z.infer<typeof ColorPaletteSchema>;
export type Theme = z.infer<typeof ThemeSchema>;

// Cores base
export const BASE_COLORS = {
  // Primárias
  BLUE: { hex: '#2196F3', rgb: { r: 33, g: 150, b: 243 }, name: 'Blue', description: 'Cor primária do sistema' },
  GREEN: { hex: '#4CAF50', rgb: { r: 76, g: 175, b: 80 }, name: 'Green', description: 'Cor de sucesso' },
  RED: { hex: '#F44336', rgb: { r: 244, g: 67, b: 54 }, name: 'Red', description: 'Cor de erro' },
  YELLOW: { hex: '#FFEB3B', rgb: { r: 255, g: 235, b: 59 }, name: 'Yellow', description: 'Cor de aviso' },
  PURPLE: { hex: '#9C27B0', rgb: { r: 156, g: 39, b: 176 }, name: 'Purple', description: 'Cor de destaque' },
  ORANGE: { hex: '#FF9800', rgb: { r: 255, g: 152, b: 0 }, name: 'Orange', description: 'Cor de ação' },
  
  // Neutras
  BLACK: { hex: '#000000', rgb: { r: 0, g: 0, b: 0 }, name: 'Black', description: 'Preto puro' },
  WHITE: { hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 }, name: 'White', description: 'Branco puro' },
  GRAY_50: { hex: '#FAFAFA', rgb: { r: 250, g: 250, b: 250 }, name: 'Gray 50', description: 'Cinza muito claro' },
  GRAY_100: { hex: '#F5F5F5', rgb: { r: 245, g: 245, b: 245 }, name: 'Gray 100', description: 'Cinza claro' },
  GRAY_200: { hex: '#EEEEEE', rgb: { r: 238, g: 238, b: 238 }, name: 'Gray 200', description: 'Cinza médio claro' },
  GRAY_300: { hex: '#E0E0E0', rgb: { r: 224, g: 224, b: 224 }, name: 'Gray 300', description: 'Cinza médio' },
  GRAY_400: { hex: '#BDBDBD', rgb: { r: 189, g: 189, b: 189 }, name: 'Gray 400', description: 'Cinza' },
  GRAY_500: { hex: '#9E9E9E', rgb: { r: 158, g: 158, b: 158 }, name: 'Gray 500', description: 'Cinza escuro' },
  GRAY_600: { hex: '#757575', rgb: { r: 117, g: 117, b: 117 }, name: 'Gray 600', description: 'Cinza muito escuro' },
  GRAY_700: { hex: '#616161', rgb: { r: 97, g: 97, b: 97 }, name: 'Gray 700', description: 'Cinza quase preto' },
  GRAY_800: { hex: '#424242', rgb: { r: 66, g: 66, b: 66 }, name: 'Gray 800', description: 'Cinza escuro profundo' },
  GRAY_900: { hex: '#212121', rgb: { r: 33, g: 33, b: 33 }, name: 'Gray 900', description: 'Cinza quase preto' },
  
  // Semânticas
  SUCCESS: { hex: '#4CAF50', rgb: { r: 76, g: 175, b: 80 }, name: 'Success', description: 'Indica sucesso' },
  WARNING: { hex: '#FF9800', rgb: { r: 255, g: 152, b: 0 }, name: 'Warning', description: 'Indica aviso' },
  ERROR: { hex: '#F44336', rgb: { r: 244, g: 67, b: 54 }, name: 'Error', description: 'Indica erro' },
  INFO: { hex: '#2196F3', rgb: { r: 33, g: 150, b: 243 }, name: 'Info', description: 'Indica informação' },
} as const;

// Paletas de cores por gênero de jogo
export const COLOR_PALETTES_BY_GENRE = {
  // Platformer (Mario-style)
  platformer: {
    primary: BASE_COLORS.BLUE,
    secondary: BASE_COLORS.RED,
    accent: BASE_COLORS.YELLOW,
    background: BASE_COLORS.GRAY_100,
    surface: BASE_COLORS.WHITE,
    text: BASE_COLORS.GRAY_900,
    error: BASE_COLORS.ERROR,
    warning: BASE_COLORS.WARNING,
    success: BASE_COLORS.SUCCESS,
    info: BASE_COLORS.INFO,
    disabled: BASE_COLORS.GRAY_400,
  },
  
  // Racing (F1-style)
  racing: {
    primary: BASE_COLORS.RED,
    secondary: BASE_COLORS.BLACK,
    accent: BASE_COLORS.YELLOW,
    background: BASE_COLORS.GRAY_900,
    surface: BASE_COLORS.GRAY_800,
    text: BASE_COLORS.WHITE,
    error: BASE_COLORS.ERROR,
    warning: BASE_COLORS.WARNING,
    success: BASE_COLORS.SUCCESS,
    info: BASE_COLORS.INFO,
    disabled: BASE_COLORS.GRAY_600,
  },
  
  // Shooter (FPS-style)
  shooter: {
    primary: BASE_COLORS.GRAY_800,
    secondary: BASE_COLORS.GRAY_600,
    accent: BASE_COLORS.ORANGE,
    background: BASE_COLORS.GRAY_900,
    surface: BASE_COLORS.GRAY_800,
    text: BASE_COLORS.WHITE,
    error: BASE_COLORS.ERROR,
    warning: BASE_COLORS.WARNING,
    success: BASE_COLORS.SUCCESS,
    info: BASE_COLORS.INFO,
    disabled: BASE_COLORS.GRAY_700,
  },
  
  // Puzzle (Tetris-style)
  puzzle: {
    primary: BASE_COLORS.PURPLE,
    secondary: BASE_COLORS.BLUE,
    accent: BASE_COLORS.GREEN,
    background: BASE_COLORS.GRAY_100,
    surface: BASE_COLORS.WHITE,
    text: BASE_COLORS.GRAY_900,
    error: BASE_COLORS.ERROR,
    warning: BASE_COLORS.WARNING,
    success: BASE_COLORS.SUCCESS,
    info: BASE_COLORS.INFO,
    disabled: BASE_COLORS.GRAY_400,
  },
  
  // RPG (Fantasy-style)
  rpg: {
    primary: BASE_COLORS.PURPLE,
    secondary: BASE_COLORS.GREEN,
    accent: BASE_COLORS.YELLOW,
    background: { hex: '#1A1A2E', rgb: { r: 26, g: 26, b: 46 }, name: 'Dark Blue', description: 'Fundo escuro para RPG' },
    surface: { hex: '#16213E', rgb: { r: 22, g: 33, b: 62 }, name: 'Navy Blue', description: 'Superfície para RPG' },
    text: BASE_COLORS.WHITE,
    error: BASE_COLORS.ERROR,
    warning: BASE_COLORS.WARNING,
    success: BASE_COLORS.SUCCESS,
    info: BASE_COLORS.INFO,
    disabled: BASE_COLORS.GRAY_600,
  },
  
  // Default (Sistema padrão)
  default: {
    primary: BASE_COLORS.BLUE,
    secondary: BASE_COLORS.GRAY_600,
    accent: BASE_COLORS.ORANGE,
    background: BASE_COLORS.GRAY_50,
    surface: BASE_COLORS.WHITE,
    text: BASE_COLORS.GRAY_900,
    error: BASE_COLORS.ERROR,
    warning: BASE_COLORS.WARNING,
    success: BASE_COLORS.SUCCESS,
    info: BASE_COLORS.INFO,
    disabled: BASE_COLORS.GRAY_400,
  },
} as const;

// Temas do sistema
export const THEMES: Theme = {
  light: COLOR_PALETTES_BY_GENRE.default,
  dark: {
    primary: BASE_COLORS.BLUE,
    secondary: BASE_COLORS.GRAY_600,
    accent: BASE_COLORS.ORANGE,
    background: BASE_COLORS.GRAY_900,
    surface: BASE_COLORS.GRAY_800,
    text: BASE_COLORS.WHITE,
    error: BASE_COLORS.ERROR,
    warning: BASE_COLORS.WARNING,
    success: BASE_COLORS.SUCCESS,
    info: BASE_COLORS.INFO,
    disabled: BASE_COLORS.GRAY_600,
  },
  highContrast: {
    primary: BASE_COLORS.YELLOW,
    secondary: BASE_COLORS.WHITE,
    accent: BASE_COLORS.ORANGE,
    background: BASE_COLORS.BLACK,
    surface: BASE_COLORS.GRAY_900,
    text: BASE_COLORS.WHITE,
    error: BASE_COLORS.RED,
    warning: BASE_COLORS.ORANGE,
    success: BASE_COLORS.GREEN,
    info: BASE_COLORS.BLUE,
    disabled: BASE_COLORS.GRAY_600,
  },
};

// Paleta padrão
export const DEFAULT_COLOR_PALETTE = COLOR_PALETTES_BY_GENRE.default;

// Funções utilitárias
export function getColorPaletteForGenre(genre: string): ColorPalette {
  return COLOR_PALETTES_BY_GENRE[genre as keyof typeof COLOR_PALETTES_BY_GENRE] || DEFAULT_COLOR_PALETTE;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

export function getContrastColor(hexColor: string): 'black' | 'white' {
  const rgb = hexToRgb(hexColor);
  // Fórmula de luminância relativa (WCAG)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? 'black' : 'white';
}

// Validação
export function validateColorPalette(palette: unknown): ColorPalette {
  return ColorPaletteSchema.parse(palette);
}

export function validateColorPaletteSafe(palette: unknown): ColorPalette | null {
  try {
    return ColorPaletteSchema.parse(palette);
  } catch {
    return null;
  }
}