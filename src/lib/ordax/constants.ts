/**
 * Constantes compartilhadas do Ordax Engine
 * 
 * Este arquivo centraliza todas as constantes usadas em múltiplos lugares
 * para evitar duplicação e garantir consistência.
 */

// ============================================================================
// SISTEMAS PERMITIDOS
// ============================================================================

/**
 * Lista completa de sistemas disponíveis na engine Ordax.
 * 
 * IMPORTANTE: Esta é a fonte única de verdade (Single Source of Truth).
 * Qualquer validação de sistemas DEVE usar esta constante.
 */
export const ORDAX_ALLOWED_SYSTEMS = [
  // Sistemas Constitucionais (obrigatórios)
  "TimeSystem",        // Gerenciamento de deltaTime
  "GameStateSystem",   // FSM (Finite State Machine)
  "InputSystem",       // Gerenciamento de input
  "SaveSystem",        // Persistência de dados
  "ViewportSystem",    // Gerenciamento de viewport/resize
  "UISystem",          // Sistema de UI
  
  // Sistemas de Física
  "PhysicsSystem",     // Física arcade 2D
  "CollisionSystem",   // Detecção de colisões
  
  // Sistemas de Gameplay
  "VehicleSystem",     // Controle de veículos
  "AISystem",          // IA básica para NPCs
  "SpawnerSystem",     // Sistema de spawn
  "ScoreSystem",       // Sistema de pontuação
  "TimerSystem",       // Temporizadores
  
  // Sistemas de Apresentação
  "ParticleSystem",    // Sistema de partículas
  "AnimationSystem",   // Animações
  "AudioSystem",       // Áudio (música e SFX)
  "CameraSystem",      // Controle de câmera
  
  // Sistemas de Conteúdo
  "DialogueSystem",    // Sistema de diálogos
  "InventorySystem",   // Sistema de inventário
  
  // Sistemas Adicionais (para compatibilidade)
  "FSMSystem",         // Sinônimo de GameStateSystem
  "SpawnSystem",       // Sinônimo de SpawnerSystem
] as const;

/**
 * Tipo derivado da lista de sistemas permitidos
 */
export type OrdaxSystem = typeof ORDAX_ALLOWED_SYSTEMS[number];

/**
 * Set para validação rápida de sistemas
 */
export const ORDAX_ALLOWED_SYSTEMS_SET = new Set<string>(ORDAX_ALLOWED_SYSTEMS);

/**
 * Valida se um sistema é permitido
 */
export function isValidSystem(system: string): system is OrdaxSystem {
  return ORDAX_ALLOWED_SYSTEMS_SET.has(system);
}

/**
 * Filtra lista de sistemas, mantendo apenas os válidos
 */
export function filterValidSystems(systems: string[]): OrdaxSystem[] {
  return systems.filter(isValidSystem) as OrdaxSystem[];
}

// ============================================================================
// FASES DO COMPILADOR
// ============================================================================

/**
 * Fases do compilador Ordax (FSM)
 */
export const COMPILER_PHASES = {
  INTERPRETATION: "interpretation",
  PLAN: "plan",
  VALIDATION: "validation",
  CONFIRMATION: "confirmation",
  COMPILATION: "compilation",
} as const;

/**
 * Tipo das fases do compilador
 * ✅ SSOT: Definido em types.ts, re-exportado aqui para conveniência
 */
export type CompilerPhase = import("./types").CompilerPhase;

/**
 * Array de fases válidas (para validação)
 */
export const VALID_COMPILER_PHASES = Object.values(COMPILER_PHASES);

/**
 * Valida se uma fase é válida
 */
export function isValidCompilerPhase(phase: string): phase is CompilerPhase {
  return VALID_COMPILER_PHASES.includes(phase as unknown as CompilerPhase);
}

// ============================================================================
// TIPOS DE JOGO
// ============================================================================

/**
 * Tipos de jogo suportados pela engine
 */
export const GAME_TYPES = {
  PLATFORMER: "platformer",
  TOPDOWN: "topdown",
  SHOOTER: "shooter",
  PUZZLE: "puzzle",
  RACING: "racing",
  SPORTS: "sports",
  UNKNOWN: "unknown",
} as const;

/**
 * Tipo derivado dos tipos de jogo
 */
export type GameType = typeof GAME_TYPES[keyof typeof GAME_TYPES];

// ============================================================================
// TIMEOUTS E DELAYS - SSOT from config.ts
// ============================================================================

/**
 * Timeouts para operações assíncronas
 * ✅ SSOT: Importado de config.ts
 */
export const TIMEOUTS = {
  OPENAI_REQUEST_MS: 30000,
  EDGE_FUNCTION_INVOKE_MS: 60000,
  STREAMING_MS: 120000,
  CONNECTION_MS: 10000,
  DEFAULT_MS: 60000,
  RETRY_MAX_ATTEMPTS: 3,
  RETRY_INITIAL_DELAY_MS: 1000,
  RETRY_MAX_DELAY_MS: 10000,
  RETRY_BACKOFF_MULTIPLIER: 2,
  INPUT_DEBOUNCE_MS: 300,
  PHASE_ADVANCE_MS: 2000,
  RETRY_BASE_MS: 800,
} as const;

/**
 * Delays para retry e auto-advance
 * ✅ SSOT: Re-export from config.ts
 */
export const DELAYS = {
  RETRY_BASE_MS: TIMEOUTS.RETRY_BASE_MS,
  PHASE_ADVANCE_MS: TIMEOUTS.PHASE_ADVANCE_MS,
  INPUT_DEBOUNCE_MS: TIMEOUTS.INPUT_DEBOUNCE_MS,
} as const;

// ============================================================================
// LIMITES
// ============================================================================

/**
 * Limites de tamanho e quantidade
 */
export const LIMITS = {
  /** Máximo de tentativas de retry */
  MAX_RETRY_ATTEMPTS: 3,
  
  /** Máximo de mensagens no histórico */
  MAX_MESSAGES_HISTORY: 100,
  
  /** Máximo de entidades por cena */
  MAX_ENTITIES_PER_SCENE: 1000,
  
  /** Máximo de sistemas por jogo */
  MAX_SYSTEMS_PER_GAME: 20,
} as const;

// ============================================================================
// MENSAGENS DE ERRO
// ============================================================================

/**
 * Mensagens de erro padronizadas
 */
export const ERROR_MESSAGES = {
  INVALID_SYSTEM: (system: string) => `Sistema inválido: ${system}. Sistemas permitidos: ${ORDAX_ALLOWED_SYSTEMS.join(", ")}`,
  INVALID_PHASE: (phase: string) => `Fase inválida: ${phase}. Fases válidas: ${VALID_COMPILER_PHASES.join(", ")}`,
  TIMEOUT: (operation: string) => `Timeout ao executar: ${operation}`,
  RACE_CONDITION: "Operação já em andamento. Aguarde a conclusão.",
  SESSION_NOT_FOUND: "Sessão não encontrada. Inicie um novo jogo.",
  INVALID_SPEC: "Spec inválida. Verifique a estrutura do jogo.",
} as const;

// ============================================================================
// PILARES CONSTITUCIONAIS
// ============================================================================

/**
 * Os 7 pilares constitucionais obrigatórios da engine Ordax
 */
export const CONSTITUTIONAL_PILLARS = {
  TIME_MANAGEMENT: {
    name: "Time Management",
    description: "Uso de deltaTime em todo movimento/física",
    requiredSystems: ["TimeSystem"],
  },
  FSM: {
    name: "Finite State Machine",
    description: "GameState enum com START, PLAYING, PAUSED, GAME_OVER",
    requiredSystems: ["GameStateSystem"],
  },
  UI_SYSTEM: {
    name: "UI System",
    description: "StartScreen + HUD + GameOverScreen (obrigatórios)",
    requiredSystems: ["UISystem"],
    requiredEntities: ["StartScreen", "HUD", "GameOverScreen"],
  },
  INPUT_SYSTEM: {
    name: "Input System",
    description: "InputManager centralizado (keyboard + mouse/touch)",
    requiredSystems: ["InputSystem"],
  },
  SAVE_SYSTEM: {
    name: "Save System",
    description: "SaveManager com localStorage para highScore",
    requiredSystems: ["SaveSystem"],
  },
  VIEWPORT_MANAGEMENT: {
    name: "Viewport Management",
    description: "Resize handler para canvas responsivo",
    requiredSystems: ["ViewportSystem"],
  },
  GAME_LOOP: {
    name: "Game Loop",
    description: "requestAnimationFrame + separação update()/render()",
    requiredSystems: ["TimeSystem"],
  },
} as const;

/**
 * Sistemas constitucionais obrigatórios (derivado dos pilares)
 */
export const CONSTITUTIONAL_REQUIRED_SYSTEMS = [
  "TimeSystem",
  "GameStateSystem",
  "UISystem",
  "InputSystem",
  "SaveSystem",
  "ViewportSystem",
] as const;

/**
 * Entidades UI obrigatórias
 */
export const CONSTITUTIONAL_REQUIRED_UI = [
  "StartScreen",
  "HUD",
  "GameOverScreen",
] as const;
