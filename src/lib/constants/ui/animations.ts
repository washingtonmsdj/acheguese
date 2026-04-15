/**
 * Constantes de Animações do Sistema
 * 
 * Sistema centralizado de animações com suporte a easing, duração, delays e consistência visual.
 */

import { z } from 'zod';

// Schemas de validação
export const EasingFunctionSchema = z.enum([
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'cubic-bezier',
  'spring',
]);

export const AnimationDurationSchema = z.object({
  value: z.number().positive(),
  unit: z.enum(['ms', 's']),
});

export const AnimationConfigSchema = z.object({
  duration: AnimationDurationSchema,
  easing: EasingFunctionSchema,
  delay: AnimationDurationSchema.optional(),
  iterations: z.number().int().min(1).max(Infinity).optional(),
  direction: z.enum(['normal', 'reverse', 'alternate', 'alternate-reverse']).optional(),
  fillMode: z.enum(['none', 'forwards', 'backwards', 'both']).optional(),
});

export const AnimationPresetSchema = z.object({
  name: z.string(),
  config: AnimationConfigSchema,
  description: z.string().optional(),
});

export type EasingFunction = z.infer<typeof EasingFunctionSchema>;
export type AnimationDuration = z.infer<typeof AnimationDurationSchema>;
export type AnimationConfig = z.infer<typeof AnimationConfigSchema>;
export type AnimationPreset = z.infer<typeof AnimationPresetSchema>;

// Durações padrão
export const ANIMATION_DURATIONS = {
  // Instantâneas
  INSTANT: { value: 0, unit: 'ms' as const },
  FASTEST: { value: 50, unit: 'ms' as const },
  FASTER: { value: 100, unit: 'ms' as const },
  FAST: { value: 150, unit: 'ms' as const },
  
  // Normais
  NORMAL: { value: 200, unit: 'ms' as const },
  SLOW: { value: 300, unit: 'ms' as const },
  SLOWER: { value: 500, unit: 'ms' as const },
  SLOWEST: { value: 700, unit: 'ms' as const },
  
  // Especiais
  MODAL: { value: 250, unit: 'ms' as const },
  TOAST: { value: 300, unit: 'ms' as const },
  PAGE_TRANSITION: { value: 400, unit: 'ms' as const },
  LOADING: { value: 1000, unit: 'ms' as const },
} as const;

// Funções de easing
export const EASING_FUNCTIONS = {
  LINEAR: 'linear' as const,
  EASE: 'ease' as const,
  EASE_IN: 'ease-in' as const,
  EASE_OUT: 'ease-out' as const,
  EASE_IN_OUT: 'ease-in-out' as const,
  SPRING: 'spring' as const,
  
  // Custom cubic-bezier functions (mapped to enum value for type compatibility)
  CUSTOM_SPRING: 'cubic-bezier' as const,
  CUSTOM_BOUNCE: 'cubic-bezier' as const,
  CUSTOM_ELASTIC: 'cubic-bezier' as const,
} as const;

// Presets de animação
export const ANIMATION_PRESETS: Record<string, AnimationPreset> = {
  // UI Básica
  FADE_IN: {
    name: 'fade-in',
    config: {
      duration: ANIMATION_DURATIONS.NORMAL,
      easing: EASING_FUNCTIONS.EASE_OUT,
    },
    description: 'Fade in suave para elementos UI',
  },
  
  FADE_OUT: {
    name: 'fade-out',
    config: {
      duration: ANIMATION_DURATIONS.FAST,
      easing: EASING_FUNCTIONS.EASE_IN,
    },
    description: 'Fade out rápido para elementos UI',
  },
  
  SLIDE_IN: {
    name: 'slide-in',
    config: {
      duration: ANIMATION_DURATIONS.NORMAL,
      easing: EASING_FUNCTIONS.EASE_OUT,
    },
    description: 'Slide in de baixo para cima',
  },
  
  SLIDE_OUT: {
    name: 'slide-out',
    config: {
      duration: ANIMATION_DURATIONS.FAST,
      easing: EASING_FUNCTIONS.EASE_IN,
    },
    description: 'Slide out de cima para baixo',
  },
  
  // Interações
  HOVER: {
    name: 'hover',
    config: {
      duration: ANIMATION_DURATIONS.FAST,
      easing: EASING_FUNCTIONS.EASE_IN_OUT,
    },
    description: 'Animação de hover em botões e links',
  },
  
  PRESS: {
    name: 'press',
    config: {
      duration: ANIMATION_DURATIONS.FASTEST,
      easing: EASING_FUNCTIONS.EASE_OUT,
    },
    description: 'Animação de clique/pressão',
  },
  
  // Feedback
  SHAKE: {
    name: 'shake',
    config: {
      duration: ANIMATION_DURATIONS.SLOW,
      easing: EASING_FUNCTIONS.EASE_IN_OUT,
      iterations: 3,
      direction: 'alternate',
    },
    description: 'Animação de shake para indicar erro',
  },
  
  PULSE: {
    name: 'pulse',
    config: {
      duration: ANIMATION_DURATIONS.SLOW,
      easing: EASING_FUNCTIONS.EASE_IN_OUT,
      iterations: Infinity,
      direction: 'alternate',
    },
    description: 'Animação de pulso para indicar carregamento',
  },
  
  BOUNCE: {
    name: 'bounce',
    config: {
      duration: ANIMATION_DURATIONS.SLOW,
      easing: EASING_FUNCTIONS.CUSTOM_BOUNCE,
    },
    description: 'Animação de bounce para elementos importantes',
  },
  
  // Transições
  MODAL_OPEN: {
    name: 'modal-open',
    config: {
      duration: ANIMATION_DURATIONS.MODAL,
      easing: EASING_FUNCTIONS.EASE_OUT,
    },
    description: 'Abertura de modal com fade e scale',
  },
  
  MODAL_CLOSE: {
    name: 'modal-close',
    config: {
      duration: ANIMATION_DURATIONS.FAST,
      easing: EASING_FUNCTIONS.EASE_IN,
    },
    description: 'Fechamento de modal com fade',
  },
  
  TOAST_SHOW: {
    name: 'toast-show',
    config: {
      duration: ANIMATION_DURATIONS.TOAST,
      easing: EASING_FUNCTIONS.EASE_OUT,
    },
    description: 'Exibição de toast com slide',
  },
  
  TOAST_HIDE: {
    name: 'toast-hide',
    config: {
      duration: ANIMATION_DURATIONS.FAST,
      easing: EASING_FUNCTIONS.EASE_IN,
    },
    description: 'Ocultação de toast com fade',
  },
  
  // Jogo
  DAMAGE: {
    name: 'damage',
    config: {
      duration: ANIMATION_DURATIONS.FAST,
      easing: EASING_FUNCTIONS.EASE_OUT,
      iterations: 2,
      direction: 'alternate',
    },
    description: 'Flash vermelho para indicar dano',
  },
  
  HEAL: {
    name: 'heal',
    config: {
      duration: ANIMATION_DURATIONS.SLOW,
      easing: EASING_FUNCTIONS.EASE_OUT,
    },
    description: 'Flash verde para indicar cura',
  },
  
  LEVEL_UP: {
    name: 'level-up',
    config: {
      duration: ANIMATION_DURATIONS.SLOWEST,
      easing: EASING_FUNCTIONS.CUSTOM_SPRING,
    },
    description: 'Animação de level up com partículas',
  },
  
  // Específicas por gênero
  PLATFORMER_JUMP: {
    name: 'platformer-jump',
    config: {
      duration: ANIMATION_DURATIONS.NORMAL,
      easing: EASING_FUNCTIONS.CUSTOM_BOUNCE,
    },
    description: 'Animação de pulo para jogos de plataforma',
  },
  
  RACING_BOOST: {
    name: 'racing-boost',
    config: {
      duration: ANIMATION_DURATIONS.FAST,
      easing: EASING_FUNCTIONS.EASE_OUT,
      iterations: 3,
      direction: 'alternate',
    },
    description: 'Efeito de boost para jogos de corrida',
  },
  
  SHOOTER_RELOAD: {
    name: 'shooter-reload',
    config: {
      duration: ANIMATION_DURATIONS.SLOW,
      easing: EASING_FUNCTIONS.LINEAR,
    },
    description: 'Animação de recarga para jogos de tiro',
  },
} as const;

// Configurações de animação por gênero de jogo
export const ANIMATION_CONFIG_BY_GENRE = {
  // Platformer (animações bouncy e exageradas)
  platformer: {
    ui: ANIMATION_PRESETS.FADE_IN.config,
    interaction: ANIMATION_PRESETS.HOVER.config,
    feedback: ANIMATION_PRESETS.BOUNCE.config,
    game: ANIMATION_PRESETS.PLATFORMER_JUMP.config,
    transition: ANIMATION_PRESETS.MODAL_OPEN.config,
  },
  
  // Racing (animações rápidas e suaves)
  racing: {
    ui: {
      duration: ANIMATION_DURATIONS.FAST,
      easing: EASING_FUNCTIONS.EASE_OUT,
    },
    interaction: {
      duration: ANIMATION_DURATIONS.FASTEST,
      easing: EASING_FUNCTIONS.EASE_IN_OUT,
    },
    feedback: ANIMATION_PRESETS.RACING_BOOST.config,
    game: {
      duration: ANIMATION_DURATIONS.FAST,
      easing: EASING_FUNCTIONS.LINEAR,
    },
    transition: {
      duration: ANIMATION_DURATIONS.FAST,
      easing: EASING_FUNCTIONS.EASE_IN_OUT,
    },
  },
  
  // Shooter (animações instantâneas e impactantes)
  shooter: {
    ui: {
      duration: ANIMATION_DURATIONS.FASTEST,
      easing: EASING_FUNCTIONS.EASE_OUT,
    },
    interaction: {
      duration: ANIMATION_DURATIONS.INSTANT,
      easing: EASING_FUNCTIONS.LINEAR,
    },
    feedback: ANIMATION_PRESETS.SHOOTER_RELOAD.config,
    game: {
      duration: ANIMATION_DURATIONS.FAST,
      easing: EASING_FUNCTIONS.EASE_OUT,
    },
    transition: {
      duration: ANIMATION_DURATIONS.FAST,
      easing: EASING_FUNCTIONS.EASE_IN,
    },
  },
  
  // Puzzle (animações suaves e previsíveis)
  puzzle: {
    ui: ANIMATION_PRESETS.FADE_IN.config,
    interaction: ANIMATION_PRESETS.HOVER.config,
    feedback: ANIMATION_PRESETS.PULSE.config,
    game: {
      duration: ANIMATION_DURATIONS.SLOW,
      easing: EASING_FUNCTIONS.EASE_IN_OUT,
    },
    transition: ANIMATION_PRESETS.MODAL_OPEN.config,
  },
  
  // RPG (animações dramáticas e épicas)
  rpg: {
    ui: {
      duration: ANIMATION_DURATIONS.SLOW,
      easing: EASING_FUNCTIONS.EASE_IN_OUT,
    },
    interaction: {
      duration: ANIMATION_DURATIONS.NORMAL,
      easing: EASING_FUNCTIONS.EASE_OUT,
    },
    feedback: ANIMATION_PRESETS.LEVEL_UP.config,
    game: {
      duration: ANIMATION_DURATIONS.SLOWEST,
      easing: EASING_FUNCTIONS.CUSTOM_SPRING,
    },
    transition: {
      duration: ANIMATION_DURATIONS.SLOW,
      easing: EASING_FUNCTIONS.EASE_IN_OUT,
    },
  },
  
  // Default (padrão do sistema)
  default: {
    ui: ANIMATION_PRESETS.FADE_IN.config,
    interaction: ANIMATION_PRESETS.HOVER.config,
    feedback: ANIMATION_PRESETS.SHAKE.config,
    game: {
      duration: ANIMATION_DURATIONS.NORMAL,
      easing: EASING_FUNCTIONS.EASE_OUT,
    },
    transition: ANIMATION_PRESETS.MODAL_OPEN.config,
  },
} as const;

// Configuração padrão
export const DEFAULT_ANIMATION_CONFIG = ANIMATION_CONFIG_BY_GENRE.default;

// Funções utilitárias
export function getAnimationConfigForGenre(genre: string): Record<string, unknown> {
  return (ANIMATION_CONFIG_BY_GENRE as Record<string, Record<string, unknown>>)[genre] || DEFAULT_ANIMATION_CONFIG;
}

export function getAnimationPreset(name: string): AnimationPreset | null {
  return ANIMATION_PRESETS[name] || null;
}

export function durationToString(duration: AnimationDuration): string {
  return `${duration.value}${duration.unit}`;
}

export function configToCss(config: AnimationConfig): string {
  const parts: string[] = [];
  
  parts.push(durationToString(config.duration));
  parts.push(config.easing);
  
  if (config.delay) {
    parts.push(durationToString(config.delay));
  }
  
  if (config.iterations) {
    parts.push(config.iterations === Infinity ? 'infinite' : config.iterations.toString());
  }
  
  if (config.direction) {
    parts.push(config.direction);
  }
  
  if (config.fillMode) {
    parts.push(config.fillMode);
  }
  
  return parts.join(' ');
}

export function createSpringAnimation(
  tension: number = 170,
  friction: number = 26
): string {
  return `spring(${tension}, ${friction})`;
}

// Validação
export function validateAnimationConfig(config: unknown): AnimationConfig {
  return AnimationConfigSchema.parse(config);
}

export function validateAnimationConfigSafe(config: unknown): AnimationConfig | null {
  try {
    return AnimationConfigSchema.parse(config);
  } catch {
    return null;
  }
}

export function validateAnimationPreset(preset: unknown): AnimationPreset {
  return AnimationPresetSchema.parse(preset);
}

export function validateAnimationPresetSafe(preset: unknown): AnimationPreset | null {
  try {
    return AnimationPresetSchema.parse(preset);
  } catch {
    return null;
  }
}