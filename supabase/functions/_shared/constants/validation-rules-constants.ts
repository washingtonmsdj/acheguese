// ✅ CONSTANTES DE REGRAS TÉCNICAS (Edge Functions)
// Sistema local para evitar imports de src/

export interface TechnicalRule {
  id: string;
  name: string;
  description: string;
  regex: RegExp;
  required: boolean;
  pilar: string;
  level: 'CRITICAL' | 'SEVERE' | 'MINOR';
  suggestion: string;
}

// Nomes de sistemas
export const SYSTEM_NAMES = {
  TIME_SYSTEM: 'TimeSystem',
  FSM_SYSTEM: 'FSMSystem',
  UI_SYSTEM: 'UISystem',
  INPUT_SYSTEM: 'InputSystem',
  SAVE_SYSTEM: 'SaveSystem',
  VIEWPORT_SYSTEM: 'ViewportSystem',
  PHYSICS_SYSTEM: 'PhysicsSystem',
  COLLISION_SYSTEM: 'CollisionSystem',
  VEHICLE_SYSTEM: 'VehicleSystem',
  SCORE_SYSTEM: 'ScoreSystem',
  TIMER_SYSTEM: 'TimerSystem',
  AI_SYSTEM: 'AISystem',
  SPAWNER_SYSTEM: 'SpawnerSystem',
  AUDIO_SYSTEM: 'AudioSystem',
  PARTICLE_SYSTEM: 'ParticleSystem',
  ANIMATION_SYSTEM: 'AnimationSystem',
  CAMERA_SYSTEM: 'CameraSystem',
  DIALOGUE_SYSTEM: 'DialogueSystem',
  INVENTORY_SYSTEM: 'InventorySystem',
};

// Propriedades da spec
export const SPEC_PROPERTIES = {
  SCENE: 'scene',
  ENTITIES: 'entities',
  SYSTEMS: 'systems',
  GAME_TYPE: 'gameType',
  TITLE: 'title',
  DESCRIPTION: 'description',
  PLAYER: 'player',
  SPAWNERS: 'spawners',
  VISUAL: 'visual',
  UI: 'ui',
};

// Estados do jogo
export const GAME_STATES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
};

// Padrões regex
export const REGEX_PATTERNS = {
  UPDATE_WITH_DELTA: /update\s*\([^)]*deltaTime[^)]*\)/gi,
  USES_DELTA_IN_MOVEMENT: /\*\s*deltaTime|\*=\s*deltaTime/gi,
  GAME_STATE_ENUM: /enum\s+GameState/i,
  GAME_STATE_START: /START|PLAYING|PAUSED|GAME_OVER/gi,
  REQUEST_ANIMATION_FRAME: /requestAnimationFrame/gi,
  SEPARATE_UPDATE_RENDER: /update\s*\([^)]*\)\s*{[^}]*}\s*render\s*\([^)]*\)\s*{[^}]*}/gi,
  INPUT_MANAGER: /InputManager/gi,
  SAVE_MANAGER: /SaveManager/gi,
  VIEWPORT_HANDLER: /resize|viewport/gi,
  UI_ELEMENTS: /StartScreen|HUD|GameOverScreen/gi,
};

// Regras técnicas
export const TECHNICAL_RULES: TechnicalRule[] = [
  {
    id: 'time_management_1',
    name: 'Time Management',
    description: 'Verifica se update() usa deltaTime',
    regex: REGEX_PATTERNS.UPDATE_WITH_DELTA,
    required: true,
    pilar: 'TIME_MANAGEMENT',
    level: 'CRITICAL',
    suggestion: 'Adicione deltaTime como parâmetro em update() e use em cálculos de movimento/física',
  },
  {
    id: 'time_management_2',
    name: 'DeltaTime in Movement',
    description: 'Verifica se cálculos de movimento usam deltaTime',
    regex: REGEX_PATTERNS.USES_DELTA_IN_MOVEMENT,
    required: true,
    pilar: 'TIME_MANAGEMENT',
    level: 'CRITICAL',
    suggestion: 'Multiplique velocidades por deltaTime: velocity.x * deltaTime',
  },
  {
    id: 'fsm_1',
    name: 'GameState Enum',
    description: 'Verifica se há enum GameState',
    regex: REGEX_PATTERNS.GAME_STATE_ENUM,
    required: true,
    pilar: 'FSM',
    level: 'CRITICAL',
    suggestion: 'Crie enum GameState com START, PLAYING, PAUSED, GAME_OVER',
  },
  {
    id: 'fsm_2',
    name: 'GameState Values',
    description: 'Verifica se há estados obrigatórios',
    regex: REGEX_PATTERNS.GAME_STATE_START,
    required: true,
    pilar: 'FSM',
    level: 'CRITICAL',
    suggestion: 'Inclua pelo menos START, PLAYING, GAME_OVER no enum GameState',
  },
  {
    id: 'game_loop_1',
    name: 'Request Animation Frame',
    description: 'Verifica se usa requestAnimationFrame',
    regex: REGEX_PATTERNS.REQUEST_ANIMATION_FRAME,
    required: true,
    pilar: 'GAME_LOOP',
    level: 'CRITICAL',
    suggestion: 'Use requestAnimationFrame para o game loop principal',
  },
  {
    id: 'game_loop_2',
    name: 'Separate Update/Render',
    description: 'Verifica se há separação update()/render()',
    regex: REGEX_PATTERNS.SEPARATE_UPDATE_RENDER,
    required: true,
    pilar: 'GAME_LOOP',
    level: 'CRITICAL',
    suggestion: 'Separe lógica (update) de renderização (render)',
  },
];

// Configuração de validação técnica
export const TECHNICAL_VALIDATION_CONFIG = {
  MIN_CODE_LENGTH: 10,
  MAX_VIOLATIONS: 50,
  REQUIRED_SYSTEMS: [
    SYSTEM_NAMES.TIME_SYSTEM,
    SYSTEM_NAMES.FSM_SYSTEM,
    SYSTEM_NAMES.UI_SYSTEM,
    SYSTEM_NAMES.INPUT_SYSTEM,
    SYSTEM_NAMES.SAVE_SYSTEM,
    SYSTEM_NAMES.VIEWPORT_SYSTEM,
  ],
  REQUIRED_UI: ['StartScreen', 'HUD', 'GameOverScreen'],
};

// Funções helper
export function createCachedRegex(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags);
}

export function validateSpecAgainstTechnicalRule(
  specCode: string,
  rule: TechnicalRule
): { valid: boolean; message?: string } {
  const matches = specCode.match(rule.regex);
  const valid = rule.required ? !!matches && matches.length > 0 : true;
  
  if (!valid) {
    return {
      valid: false,
      message: rule.suggestion,
    };
  }
  
  return { valid: true };
}