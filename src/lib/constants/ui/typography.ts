/**
 * Constantes de Tipografia do Sistema
 * 
 * Sistema centralizado de tipografia com suporte a responsividade, acessibilidade e consistência visual.
 */

import { z } from 'zod';

// Schemas de validação
export const FontSizeSchema = z.object({
  value: z.number().positive(),
  unit: z.enum(['px', 'rem', 'em']),
  lineHeight: z.number().positive(),
  letterSpacing: z.number(),
});

export const FontFamilySchema = z.object({
  name: z.string(),
  fallbacks: z.array(z.string()),
  category: z.enum(['sans-serif', 'serif', 'monospace', 'display', 'handwriting']),
  webSafe: z.boolean(),
});

export const TypographyScaleSchema = z.object({
  xs: FontSizeSchema,
  sm: FontSizeSchema,
  base: FontSizeSchema,
  lg: FontSizeSchema,
  xl: FontSizeSchema,
  '2xl': FontSizeSchema,
  '3xl': FontSizeSchema,
  '4xl': FontSizeSchema,
  '5xl': FontSizeSchema,
});

export const TypographyConfigSchema = z.object({
  fontFamily: FontFamilySchema,
  scale: TypographyScaleSchema,
  fontWeight: z.object({
    light: z.number().min(100).max(900),
    normal: z.number().min(100).max(900),
    medium: z.number().min(100).max(900),
    semibold: z.number().min(100).max(900),
    bold: z.number().min(100).max(900),
  }),
  lineHeight: z.object({
    tight: z.number().positive(),
    normal: z.number().positive(),
    relaxed: z.number().positive(),
    loose: z.number().positive(),
  }),
});

export type FontSize = z.infer<typeof FontSizeSchema>;
export type FontFamily = z.infer<typeof FontFamilySchema>;
export type TypographyScale = z.infer<typeof TypographyScaleSchema>;
export type TypographyConfig = z.infer<typeof TypographyConfigSchema>;

// Famílias de fontes
export const FONT_FAMILIES = {
  // Sans-serif (padrão do sistema)
  SANS: {
    name: 'Inter',
    fallbacks: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
    category: 'sans-serif',
    webSafe: true,
  },
  
  // Serif (para títulos e destaque)
  SERIF: {
    name: 'Georgia',
    fallbacks: ['Times New Roman', 'Times', 'serif'],
    category: 'serif',
    webSafe: true,
  },
  
  // Monospace (para código e interface técnica)
  MONO: {
    name: 'JetBrains Mono',
    fallbacks: ['Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    category: 'monospace',
    webSafe: false,
  },
  
  // Display (para títulos grandes)
  DISPLAY: {
    name: 'Poppins',
    fallbacks: ['Arial', 'sans-serif'],
    category: 'display',
    webSafe: false,
  },
  
  // Handwriting (para elementos especiais)
  HANDWRITING: {
    name: 'Caveat',
    fallbacks: ['cursive'],
    category: 'handwriting',
    webSafe: false,
  },
} as const;

// Escala de tipografia (base 16px = 1rem)
export const TYPOGRAPHY_SCALE: TypographyScale = {
  xs: { value: 0.75, unit: 'rem', lineHeight: 1.5, letterSpacing: 0.01 },    // 12px
  sm: { value: 0.875, unit: 'rem', lineHeight: 1.5, letterSpacing: 0.01 },   // 14px
  base: { value: 1, unit: 'rem', lineHeight: 1.5, letterSpacing: 0 },        // 16px
  lg: { value: 1.125, unit: 'rem', lineHeight: 1.5, letterSpacing: -0.01 },  // 18px
  xl: { value: 1.25, unit: 'rem', lineHeight: 1.4, letterSpacing: -0.01 },   // 20px
  '2xl': { value: 1.5, unit: 'rem', lineHeight: 1.4, letterSpacing: -0.02 }, // 24px
  '3xl': { value: 1.875, unit: 'rem', lineHeight: 1.3, letterSpacing: -0.02 }, // 30px
  '4xl': { value: 2.25, unit: 'rem', lineHeight: 1.2, letterSpacing: -0.03 }, // 36px
  '5xl': { value: 3, unit: 'rem', lineHeight: 1.1, letterSpacing: -0.03 },   // 48px
};

// Pesos de fonte
export const FONT_WEIGHTS = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// Alturas de linha
export const LINE_HEIGHTS = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
} as const;

// Configurações de tipografia por gênero de jogo
export const TYPOGRAPHY_CONFIG_BY_GENRE = {
  // Platformer (jogos de plataforma - estilo cartoon)
  platformer: {
    fontFamily: FONT_FAMILIES.DISPLAY,
    scale: TYPOGRAPHY_SCALE,
    fontWeight: FONT_WEIGHTS,
    lineHeight: LINE_HEIGHTS,
  },
  
  // Racing (corrida - estilo técnico)
  racing: {
    fontFamily: FONT_FAMILIES.MONO,
    scale: {
      ...TYPOGRAPHY_SCALE,
      base: { value: 0.9375, unit: 'rem', lineHeight: 1.4, letterSpacing: 0.02 }, // 15px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 1.8,
    },
  },
  
  // Shooter (tiro - estilo militar)
  shooter: {
    fontFamily: FONT_FAMILIES.MONO,
    scale: {
      ...TYPOGRAPHY_SCALE,
      base: { value: 0.875, unit: 'rem', lineHeight: 1.3, letterSpacing: 0.01 }, // 14px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.1,
      normal: 1.3,
      relaxed: 1.5,
      loose: 1.7,
    },
  },
  
  // Puzzle (quebra-cabeça - estilo limpo)
  puzzle: {
    fontFamily: FONT_FAMILIES.SANS,
    scale: TYPOGRAPHY_SCALE,
    fontWeight: FONT_WEIGHTS,
    lineHeight: LINE_HEIGHTS,
  },
  
  // RPG (RPG - estilo medieval/fantasia)
  rpg: {
    fontFamily: FONT_FAMILIES.SERIF,
    scale: {
      ...TYPOGRAPHY_SCALE,
      base: { value: 1.125, unit: 'rem', lineHeight: 1.6, letterSpacing: 0.01 }, // 18px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.3,
      normal: 1.6,
      relaxed: 1.8,
      loose: 2,
    },
  },
  
  // Default (padrão do sistema)
  default: {
    fontFamily: FONT_FAMILIES.SANS,
    scale: TYPOGRAPHY_SCALE,
    fontWeight: FONT_WEIGHTS,
    lineHeight: LINE_HEIGHTS,
  },
} as const;

// Configuração padrão
export const DEFAULT_TYPOGRAPHY_CONFIG = TYPOGRAPHY_CONFIG_BY_GENRE.default;

// Funções utilitárias
export function getTypographyConfigForGenre(genre: string): Record<string, unknown> {
  return (TYPOGRAPHY_CONFIG_BY_GENRE as Record<string, Record<string, unknown>>)[genre] || DEFAULT_TYPOGRAPHY_CONFIG;
}

export function getFontSize(scale: TypographyScale, size: keyof TypographyScale): string {
  const fontSize = scale[size];
  return `${fontSize.value}${fontSize.unit}`;
}

export function getLineHeight(scale: TypographyScale, size: keyof TypographyScale): number {
  return scale[size].lineHeight;
}

export function getLetterSpacing(scale: TypographyScale, size: keyof TypographyScale): string {
  const spacing = scale[size].letterSpacing;
  return `${spacing}em`;
}

export function getFontFamily(fontFamily: FontFamily): string {
  return `${fontFamily.name}, ${fontFamily.fallbacks.join(', ')}`;
}

// Classes CSS utilitárias (para uso com CSS-in-JS)
export function generateTypographyClasses(config: TypographyConfig): Record<string, string> {
  const { fontFamily, scale, fontWeight, lineHeight } = config;
  
  return {
    'font-family': getFontFamily(fontFamily),
    'font-weight-normal': fontWeight.normal.toString(),
    'font-weight-bold': fontWeight.bold.toString(),
    'line-height-tight': lineHeight.tight.toString(),
    'line-height-normal': lineHeight.normal.toString(),
    'line-height-relaxed': lineHeight.relaxed.toString(),
    'line-height-loose': lineHeight.loose.toString(),
    
    // Classes por tamanho
    'text-xs': getFontSize(scale, 'xs'),
    'text-sm': getFontSize(scale, 'sm'),
    'text-base': getFontSize(scale, 'base'),
    'text-lg': getFontSize(scale, 'lg'),
    'text-xl': getFontSize(scale, 'xl'),
    'text-2xl': getFontSize(scale, '2xl'),
    'text-3xl': getFontSize(scale, '3xl'),
    'text-4xl': getFontSize(scale, '4xl'),
    'text-5xl': getFontSize(scale, '5xl'),
    
    // Letter spacing
    'tracking-xs': getLetterSpacing(scale, 'xs'),
    'tracking-sm': getLetterSpacing(scale, 'sm'),
    'tracking-base': getLetterSpacing(scale, 'base'),
    'tracking-lg': getLetterSpacing(scale, 'lg'),
    'tracking-xl': getLetterSpacing(scale, 'xl'),
    'tracking-2xl': getLetterSpacing(scale, '2xl'),
    'tracking-3xl': getLetterSpacing(scale, '3xl'),
    'tracking-4xl': getLetterSpacing(scale, '4xl'),
    'tracking-5xl': getLetterSpacing(scale, '5xl'),
  };
}

// Validação
export function validateTypographyConfig(config: unknown): TypographyConfig {
  return TypographyConfigSchema.parse(config);
}

export function validateTypographyConfigSafe(config: unknown): TypographyConfig | null {
  try {
    return TypographyConfigSchema.parse(config);
  } catch {
    return null;
  }
}