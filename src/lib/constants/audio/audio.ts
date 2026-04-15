/**
 * Constantes de Áudio do Sistema
 * 
 * Sistema centralizado de constantes de áudio com suporte a volumes, categorias e configurações.
 */

import { z } from 'zod';

// Schemas de validação
export const AudioCategorySchema = z.enum(['music', 'sfx', 'ui', 'ambient', 'dialogue', 'music']);
export const AudioConfigSchema = z.object({
  volume: z.number().min(0).max(1).default(1.0),
  pitch: z.number().min(0.5).max(2.0).default(1.0),
  loop: z.boolean().default(false),
  loopStart: z.number().min(0).optional(),
  loopEnd: z.number().min(0).optional(),
  spatial: z.boolean().default(false),
  spatialRange: z.number().min(0).default(100),
});

export type AudioCategory = z.infer<typeof AudioCategorySchema>;
export type AudioConfig = z.infer<typeof AudioConfigSchema>;

// Categorias de áudio
export const AUDIO_CATEGORIES = {
  MUSIC: 'music',
  SFX: 'sfx',
  UI: 'ui',
  AMBIENT: 'ambient',
  DIALOGUE: 'dialogue',
} as const;

// Volumes padrão por categoria
export const DEFAULT_VOLUMES = {
  [AUDIO_CATEGORIES.MUSIC]: 0.8,
  [AUDIO_CATEGORIES.SFX]: 0.7,
  [AUDIO_CATEGORIES.UI]: 0.6,
  [AUDIO_CATEGORIES.AMBIENT]: 0.5,
  [AUDIO_CATEGORIES.DIALOGUE]: 0.9,
} as const;

// Configurações de áudio por gênero de jogo
export const AUDIO_CONFIG_BY_GENRE = {
  platformer: {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    uiVolume: 0.6,
    musicCategory: 'upbeat',
    reverb: 'hall',
  },
  racing: {
    musicVolume: 0.8,
    sfxVolume: 0.9,
    uiVolume: 0.7,
    musicCategory: 'intense',
    reverb: 'garage',
  },
  shooter: {
    musicVolume: 0.6,
    sfxVolume: 1.0,
    uiVolume: 0.5,
    musicCategory: 'intense',
    reverb: 'warehouse',
  },
  puzzle: {
    musicVolume: 0.5,
    sfxVolume: 0.7,
    uiVolume: 0.6,
    musicCategory: 'calm',
    reverb: 'room',
  },
  rpg: {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    uiVolume: 0.6,
    musicCategory: 'epic',
    reverb: 'cathedral',
  },
  default: {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    uiVolume: 0.6,
    musicCategory: 'default',
    reverb: 'room',
  },
} as const;

// Tipos de áudio
export const AUDIO_TYPES = {
  MUSIC: {
    MENU: 'menu_music',
    GAMEPLAY: 'gameplay_music',
    BOSS: 'boss_music',
    CREDITS: 'credits_music',
  },
  SFX: {
    JUMP: 'jump',
    COLLECT: 'collect',
    HIT: 'hit',
    SHOOT: 'shoot',
    EXPLOSION: 'explosion',
    UI_CLICK: 'ui_click',
    UI_HOVER: 'ui_hover',
    UI_SELECT: 'ui_select',
  },
  AMBIENT: {
    WIND: 'wind',
    RAIN: 'rain',
    FIRE: 'fire',
    WATER: 'water',
  },
  DIALOGUE: {
    NPC: 'npc_dialogue',
    PLAYER: 'player_dialogue',
    NARRATOR: 'narrator',
  },
} as const;

// Configurações de áudio 3D
export const SPATIAL_AUDIO_CONFIG = {
  MAX_DISTANCE: 100, // Distância máxima de audição
  REF_DISTANCE: 1, // Distância de referência (1 unidade de jogo)
  ROLLOFF_FACTOR: 1, // Fator de atenuação
  CONE_INNER_ANGLE: 360, // Ângulo interno do cone (360 = omnidirecional)
  CONE_OUTER_ANGLE: 360, // Ângulo externo do cone
  CONE_OUTER_GAIN: 0.3, // Volume fora do cone
} as const;

// Configurações de reverb
export const REVERB_PRESETS = {
  ROOM: {
    decay: 1.0,
    preDelay: 0.015,
    wet: 0.2,
    dry: 0.8,
  },
  HALL: {
    decay: 2.0,
    preDelay: 0.05,
    wet: 0.3,
    dry: 0.7,
  },
  CAVE: {
    decay: 3.0,
    preDelay: 0.1,
    wet: 0.4,
    dry: 0.6,
  },
  GARAGE: {
    decay: 1.5,
    preDelay: 0.02,
    wet: 0.25,
    dry: 0.75,
  },
  CATHEDRAL: {
    decay: 4.0,
    preDelay: 0.1,
    wet: 0.5,
    dry: 0.5,
  },
} as const;

// Funções utilitárias
export function getAudioConfigForGenre(genre: string) {
  return AUDIO_CONFIG_BY_GENRE[genre as keyof typeof AUDIO_CONFIG_BY_GENRE] || AUDIO_CONFIG_BY_GENRE.default;
}

export function calculateSpatialVolume(distance: number, maxDistance: number = SPATIAL_AUDIO_CONFIG.MAX_DISTANCE): number {
  if (distance >= maxDistance) return 0;
  
  // Lei do inverso do quadrado da distância
  const volume = 1.0 - (distance / maxDistance);
  return Math.max(0, Math.min(1, volume));
}

export function calculateDopplerEffect(relativeVelocity: number, speedOfSound: number = 343): number {
  // Efeito Doppler: f' = f * (c / (c ± v))
  const dopplerFactor = speedOfSound / (speedOfSound + relativeVelocity);
  return Math.max(0.1, Math.min(2.0, dopplerFactor));
}

// Validação
export function validateAudioConfig(config: unknown): AudioConfig {
  return AudioConfigSchema.parse(config);
}

export function validateAudioConfigSafe(config: unknown): AudioConfig | null {
  try {
    return AudioConfigSchema.parse(config);
  } catch {
    return null;
  }
}