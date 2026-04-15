/**
 * Constantes compartilhadas para Edge Functions
 * Extrai magic numbers e strings hardcoded
 */

// ============================================================================
// PHASES E MODES
// ============================================================================

export const PHASES = {
  INTERPRETATION: 'interpretation',
  PLAN: 'plan',
  VALIDATION: 'validation',
  CONFIRMATION: 'confirmation',
  COMPILATION: 'compilation',
  SPEC: 'spec'
} as const;

export const MODES = {
  SPEC: 'spec',
  COACH: 'coach',
  CODE_PATCH: 'code_patch'
} as const;

export const ACTIONS = {
  APPROVE_PLAN: 'APPROVE_PLAN'
} as const;

// ============================================================================
// VALIDAÇÃO E LOGS
// ============================================================================

export const LOG_LIMITS = {
  MAX_PREVIEW_CHARS: 500,
  MAX_LOG_LENGTH: 1000,
  MAX_PLAN_PREVIEW: 500,
  MAX_ERROR_PREVIEW: 500
} as const;

export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 5000,
  TIMEOUT_MS: 30000
} as const;

// ============================================================================
// SESSÕES E IDs
// ============================================================================

export const SESSION_CONFIG = {
  ANON_PREFIX: 'anon',
  ID_SEPARATOR: '_',
  RANDOM_LENGTH: 13
} as const;

// ============================================================================
// AI CONFIG (Lovable AI Gateway)
// ============================================================================

export const GROQ_CONFIG = {
  DEFAULT_MODEL: 'google/gemini-3-flash-preview',
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 4000,
  TIMEOUT_MS: 30000,
  BASE_URL: 'https://ai.gateway.lovable.dev/v1/chat/completions'
} as const;

// ============================================================================
// VALIDAÇÃO CONSTITUCIONAL
// ============================================================================

export const CONSTITUTIONAL_PILLARS = {
  TIME_MANAGEMENT: 'Time Management',
  FSM: 'FSM',
  UI_SYSTEM: 'UI System',
  INPUT_SYSTEM: 'Input System',
  SAVE_SYSTEM: 'Save System',
  VIEWPORT_MANAGEMENT: 'Viewport Management',
  GAME_LOOP: 'Game Loop'
} as const;

export const VALIDATION_LEVELS = {
  CRITICAL: 'CRITICAL',
  SEVERE: 'SEVERE',
  MINOR: 'MINOR'
} as const;

// ============================================================================
// GÊNEROS DE JOGO
// ============================================================================

export const GAME_GENRES = {
  RACING: 'racing',
  SHOOTER: 'shooter',
  PLATFORMER: 'platformer',
  PUZZLE: 'puzzle',
  SPORTS: 'sports',
  TOPDOWN: 'topdown',
  UNKNOWN: 'unknown'
} as const;

// ============================================================================
// SISTEMAS DISPONÍVEIS
// ============================================================================

export const AVAILABLE_SYSTEMS = [
  'TimeSystem',
  'FSMSystem',
  'PhysicsSystem',
  'CollisionSystem',
  'VehicleSystem',
  'AISystem',
  'SpawnerSystem',
  'ScoreSystem',
  'UISystem',
  'InputSystem',
  'SaveSystem',
  'ViewportSystem',
  'AudioSystem',
  'ParticleSystem',
  'AnimationSystem',
  'TimerSystem'
] as const;

// ============================================================================
// MENSAGENS DE ERRO
// ============================================================================

export const ERROR_MESSAGES = {
  // Validação
  INVALID_REQUEST_BODY: 'Request body must be a valid JSON object',
  MISSING_MESSAGES: 'Messages field is required',
  INVALID_MESSAGES_TYPE: 'Messages must be an array',
  EMPTY_MESSAGES: 'Messages array cannot be empty',
  INVALID_MESSAGE_ROLE: 'Message has invalid role',
  INVALID_MESSAGE_CONTENT: 'Message has invalid content',
  INVALID_MODE: 'Invalid mode specified',
  INVALID_PHASE: 'Invalid phase specified',
  MISSING_PHASE_FOR_NEW_GAME: 'Phase is required for new game compilation',
  MISSING_CURRENT_SPEC_FOR_COACH: 'currentSpec is required when mode is coach',
  
  // Sessão
  INVALID_SESSION_STATE: 'Session is in invalid state',
  SESSION_PHASE_NULL: 'Session phase is null or undefined',
  SESSION_NOT_FOUND: 'Session not found',
  NO_PLAN_TO_APPROVE: 'No game plan found for this session',
  
  // FSM
  INVALID_PHASE_TRANSITION: 'Invalid phase transition',
  
  // Validação constitucional
  CONSTITUTIONAL_ERROR: 'Game violates Ordax Engine Contract V1',
  
  // Gênero
  GENRE_CONTRACT_VIOLATION: 'Game plan violates genre contract',
  
  // Groq
  GROQ_API_ERROR: 'Groq API error',
  GROQ_RATE_LIMIT: 'Groq rate limit exceeded',
  GROQ_TIMEOUT: 'Groq request timeout',
  GROQ_INVALID_KEY: 'Groq API key invalid',
  
  // JSON
  PLANNER_INVALID_JSON: 'Failed to parse JSON from planner',
  REPAIR_FAILED: 'Planner repair failed'
} as const;

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMIT: 429,
  INTERNAL_SERVER_ERROR: 500,
  GATEWAY_TIMEOUT: 504
} as const;