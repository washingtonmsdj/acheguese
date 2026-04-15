/**
 * Constantes de Input do Sistema
 * 
 * Sistema centralizado de mapeamento de controles, teclas, gamepads e configurações de input.
 */

import { z } from 'zod';

// Schemas de validação
export const KeyCodeSchema = z.object({
  code: z.string(),
  key: z.string(),
  description: z.string(),
  category: z.enum(['movement', 'action', 'ui', 'system', 'debug']),
});

export const GamepadButtonSchema = z.object({
  index: z.number().int().min(0).max(31),
  name: z.string(),
  description: z.string(),
  category: z.enum(['face', 'shoulder', 'trigger', 'dpad', 'system']),
});

export const InputMappingSchema = z.object({
  keyboard: z.record(z.string(), KeyCodeSchema),
  gamepad: z.record(z.string(), GamepadButtonSchema),
  mouse: z.record(z.string(), z.object({
    button: z.number().int().min(0).max(2),
    description: z.string(),
  })),
  touch: z.record(z.string(), z.object({
    gesture: z.enum(['tap', 'double-tap', 'long-press', 'swipe', 'pinch']),
    description: z.string(),
  })),
});

export const InputConfigSchema = z.object({
  deadzone: z.number().min(0).max(1),
  sensitivity: z.number().positive(),
  invertY: z.boolean(),
  vibration: z.boolean(),
  autoAim: z.boolean().optional(),
  aimAssist: z.boolean().optional(),
});

export type KeyCode = z.infer<typeof KeyCodeSchema>;
export type GamepadButton = z.infer<typeof GamepadButtonSchema>;
export type InputMapping = z.infer<typeof InputMappingSchema>;
export type InputConfig = z.infer<typeof InputConfigSchema>;

// Códigos de tecla padrão
export const KEY_CODES: Record<string, KeyCode> = {
  // Movimento
  MOVE_UP: {
    code: 'KeyW',
    key: 'W',
    description: 'Mover para cima',
    category: 'movement',
  },
  MOVE_DOWN: {
    code: 'KeyS',
    key: 'S',
    description: 'Mover para baixo',
    category: 'movement',
  },
  MOVE_LEFT: {
    code: 'KeyA',
    key: 'A',
    description: 'Mover para esquerda',
    category: 'movement',
  },
  MOVE_RIGHT: {
    code: 'KeyD',
    key: 'D',
    description: 'Mover para direita',
    category: 'movement',
  },
  JUMP: {
    code: 'Space',
    key: 'Space',
    description: 'Pular',
    category: 'movement',
  },
  CROUCH: {
    code: 'ControlLeft',
    key: 'Ctrl',
    description: 'Agachar',
    category: 'movement',
  },
  SPRINT: {
    code: 'ShiftLeft',
    key: 'Shift',
    description: 'Correr',
    category: 'movement',
  },
  
  // Ações
  PRIMARY_ACTION: {
    code: 'Mouse0',
    key: 'Mouse Left',
    description: 'Ação primária (atirar, atacar)',
    category: 'action',
  },
  SECONDARY_ACTION: {
    code: 'Mouse1',
    key: 'Mouse Right',
    description: 'Ação secundária (mirar, bloquear)',
    category: 'action',
  },
  INTERACT: {
    code: 'KeyE',
    key: 'E',
    description: 'Interagir',
    category: 'action',
  },
  RELOAD: {
    code: 'KeyR',
    key: 'R',
    description: 'Recarregar',
    category: 'action',
  },
  USE_ITEM: {
    code: 'KeyF',
    key: 'F',
    description: 'Usar item',
    category: 'action',
  },
  SWITCH_WEAPON: {
    code: 'KeyQ',
    key: 'Q',
    description: 'Trocar arma',
    category: 'action',
  },
  
  // UI
  PAUSE: {
    code: 'Escape',
    key: 'Esc',
    description: 'Pausar jogo',
    category: 'ui',
  },
  INVENTORY: {
    code: 'KeyI',
    key: 'I',
    description: 'Abrir inventário',
    category: 'ui',
  },
  MAP: {
    code: 'KeyM',
    key: 'M',
    description: 'Abrir mapa',
    category: 'ui',
  },
  JOURNAL: {
    code: 'KeyJ',
    key: 'J',
    description: 'Abrir diário',
    category: 'ui',
  },
  SKILLS: {
    code: 'KeyK',
    key: 'K',
    description: 'Abrir habilidades',
    category: 'ui',
  },
  
  // Sistema
  CONSOLE: {
    code: 'Backquote',
    key: '`',
    description: 'Abrir console',
    category: 'system',
  },
  SCREENSHOT: {
    code: 'F12',
    key: 'F12',
    description: 'Tirar screenshot',
    category: 'system',
  },
  RECORD: {
    code: 'F9',
    key: 'F9',
    description: 'Iniciar/parar gravação',
    category: 'system',
  },
  
  // Debug
  DEBUG_TOGGLE: {
    code: 'F3',
    key: 'F3',
    description: 'Alternar modo debug',
    category: 'debug',
  },
  WIREFRAME: {
    code: 'F4',
    key: 'F4',
    description: 'Alternar wireframe',
    category: 'debug',
  },
  STATS: {
    code: 'F5',
    key: 'F5',
    description: 'Mostrar estatísticas',
    category: 'debug',
  },
};

// Botões de gamepad padrão (Xbox layout)
export const GAMEPAD_BUTTONS: Record<string, GamepadButton> = {
  // Face buttons
  A: {
    index: 0,
    name: 'A',
    description: 'Ação primária (pular, confirmar)',
    category: 'face',
  },
  B: {
    index: 1,
    name: 'B',
    description: 'Ação secundária (cancelar, voltar)',
    category: 'face',
  },
  X: {
    index: 2,
    name: 'X',
    description: 'Ação terciária (interagir, recarregar)',
    category: 'face',
  },
  Y: {
    index: 3,
    name: 'Y',
    description: 'Ação quaternária (inventário, mapa)',
    category: 'face',
  },
  
  // Shoulder buttons
  LB: {
    index: 4,
    name: 'LB',
    description: 'Botão de ombro esquerdo',
    category: 'shoulder',
  },
  RB: {
    index: 5,
    name: 'RB',
    description: 'Botão de ombro direito',
    category: 'shoulder',
  },
  
  // Triggers
  LT: {
    index: 6,
    name: 'LT',
    description: 'Gatilho esquerdo (analógico)',
    category: 'trigger',
  },
  RT: {
    index: 7,
    name: 'RT',
    description: 'Gatilho direito (analógico)',
    category: 'trigger',
  },
  
  // System buttons
  BACK: {
    index: 8,
    name: 'Back',
    description: 'Botão de sistema (menu)',
    category: 'system',
  },
  START: {
    index: 9,
    name: 'Start',
    description: 'Botão de sistema (início)',
    category: 'system',
  },
  
  // Stick buttons
  LS: {
    index: 10,
    name: 'LS',
    description: 'Botão do analógico esquerdo',
    category: 'system',
  },
  RS: {
    index: 11,
    name: 'RS',
    description: 'Botão do analógico direito',
    category: 'system',
  },
  
  // D-pad
  DPAD_UP: {
    index: 12,
    name: 'D-pad Up',
    description: 'Direcional para cima',
    category: 'dpad',
  },
  DPAD_DOWN: {
    index: 13,
    name: 'D-pad Down',
    description: 'Direcional para baixo',
    category: 'dpad',
  },
  DPAD_LEFT: {
    index: 14,
    name: 'D-pad Left',
    description: 'Direcional para esquerda',
    category: 'dpad',
  },
  DPAD_RIGHT: {
    index: 15,
    name: 'D-pad Right',
    description: 'Direcional para direita',
    category: 'dpad',
  },
};

// Mapeamento de input padrão
export const DEFAULT_INPUT_MAPPING: InputMapping = {
  keyboard: {
    moveUp: KEY_CODES.MOVE_UP,
    moveDown: KEY_CODES.MOVE_DOWN,
    moveLeft: KEY_CODES.MOVE_LEFT,
    moveRight: KEY_CODES.MOVE_RIGHT,
    jump: KEY_CODES.JUMP,
    primaryAction: KEY_CODES.PRIMARY_ACTION,
    secondaryAction: KEY_CODES.SECONDARY_ACTION,
    interact: KEY_CODES.INTERACT,
    pause: KEY_CODES.PAUSE,
  },
  gamepad: {
    move: GAMEPAD_BUTTONS.LS, // Analógico esquerdo
    look: GAMEPAD_BUTTONS.RS, // Analógico direito
    jump: GAMEPAD_BUTTONS.A,
    primaryAction: GAMEPAD_BUTTONS.RT,
    secondaryAction: GAMEPAD_BUTTONS.LT,
    interact: GAMEPAD_BUTTONS.X,
    pause: GAMEPAD_BUTTONS.START,
  },
  mouse: {
    primaryAction: {
      button: 0,
      description: 'Clique esquerdo',
    },
    secondaryAction: {
      button: 2,
      description: 'Clique direito',
    },
    middleClick: {
      button: 1,
      description: 'Clique do meio',
    },
  },
  touch: {
    tap: {
      gesture: 'tap',
      description: 'Toque simples',
    },
    doubleTap: {
      gesture: 'double-tap',
      description: 'Toque duplo',
    },
    longPress: {
      gesture: 'long-press',
      description: 'Pressionar longo',
    },
    swipe: {
      gesture: 'swipe',
      description: 'Arrastar',
    },
  },
};

// Configurações de input por gênero de jogo
export const INPUT_CONFIG_BY_GENRE = {
  // Platformer (controles simples e responsivos)
  platformer: {
    deadzone: 0.1,
    sensitivity: 1.0,
    invertY: false,
    vibration: true,
    autoAim: false,
    aimAssist: false,
  },
  
  // Racing (controles precisos e sensíveis)
  racing: {
    deadzone: 0.05,
    sensitivity: 0.8,
    invertY: false,
    vibration: true,
    autoAim: false,
    aimAssist: false,
  },
  
  // Shooter (controles precisos com assistência)
  shooter: {
    deadzone: 0.08,
    sensitivity: 1.2,
    invertY: true,
    vibration: true,
    autoAim: true,
    aimAssist: true,
  },
  
  // Puzzle (controles simples e previsíveis)
  puzzle: {
    deadzone: 0.15,
    sensitivity: 0.7,
    invertY: false,
    vibration: false,
    autoAim: false,
    aimAssist: false,
  },
  
  // RPG (controles variados e configuráveis)
  rpg: {
    deadzone: 0.12,
    sensitivity: 1.0,
    invertY: false,
    vibration: true,
    autoAim: false,
    aimAssist: false,
  },
  
  // Default (padrão do sistema)
  default: {
    deadzone: 0.1,
    sensitivity: 1.0,
    invertY: false,
    vibration: true,
    autoAim: false,
    aimAssist: false,
  },
} as const;

// Configuração padrão
export const DEFAULT_INPUT_CONFIG = INPUT_CONFIG_BY_GENRE.default;

// Funções utilitárias
export function getInputConfigForGenre(genre: string): InputConfig {
  return INPUT_CONFIG_BY_GENRE[genre as keyof typeof INPUT_CONFIG_BY_GENRE] || DEFAULT_INPUT_CONFIG;
}

export function getKeyCode(action: string): KeyCode | null {
  return KEY_CODES[action] || null;
}

export function getGamepadButton(action: string): GamepadButton | null {
  return GAMEPAD_BUTTONS[action] || null;
}

export function getInputMappingForGenre(genre: string): InputMapping {
  // Por enquanto, retorna o mapeamento padrão
  // Futuramente pode ter variações por gênero
  return DEFAULT_INPUT_MAPPING;
}

export function isKeyPressed(keyCode: string, pressedKeys: Set<string>): boolean {
  return pressedKeys.has(keyCode);
}

export function getGamepadAxisValue(
  gamepad: Gamepad,
  axisIndex: number,
  deadzone: number = DEFAULT_INPUT_CONFIG.deadzone
): number {
  const value = gamepad.axes[axisIndex];
  return Math.abs(value) > deadzone ? value : 0;
}

export function remapInputValue(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number {
  return ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin) + toMin;
}

// Validação
export function validateInputConfig(config: unknown): InputConfig {
  return InputConfigSchema.parse(config);
}

export function validateInputConfigSafe(config: unknown): InputConfig | null {
  try {
    return InputConfigSchema.parse(config);
  } catch {
    return null;
  }
}

export function validateInputMapping(mapping: unknown): InputMapping {
  return InputMappingSchema.parse(mapping);
}

export function validateInputMappingSafe(mapping: unknown): InputMapping | null {
  try {
    return InputMappingSchema.parse(mapping);
  } catch {
    return null;
  }
}