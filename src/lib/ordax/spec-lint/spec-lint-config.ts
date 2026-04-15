/**
 * Configuração centralizada para spec-lint.ts
 * Extrai todos os valores hardcoded para facilitar manutenção
 * 
 * ✅ SSOT: Importa WORLD de config.ts
 */

import type { OrdaxGameType } from "@/lib/ordax/types";
import { WORLD } from "@/lib/ordax/config";

// ============================================================================
// CONSTANTES GERAIS
// ============================================================================

/** Versão da configuração */
export const CONFIG_VERSION = "2.0.0";

/** Data da build */
export const BUILD_DATE = "2026-02-16";

// ============================================================================
// CONFIGURAÇÃO DE MUNDO
// ============================================================================

/** Bounds do mundo (tamanho do canvas) - SSOT: config.ts */
export const WORLD_BOUNDS = {
  w: WORLD.W,
  h: WORLD.H,
} as const;

/** Margens de segurança para entidades */
export const WORLD_MARGINS = {
  MIN_X: 0,
  MAX_X: WORLD_BOUNDS.w,
  MIN_Y: 0,
  MAX_Y: WORLD_BOUNDS.h,
  SAFE_MARGIN: 50, // Margem de segurança para evitar entidades muito perto da borda
} as const;

// ============================================================================
// CONFIGURAÇÃO DE ENTIDADES
// ============================================================================

/** Tamanhos padrão de entidades */
export const ENTITY_SIZES = {
  MIN_WIDTH: 1,
  MIN_HEIGHT: 1,
  DEFAULT_WIDTH: 32,
  DEFAULT_HEIGHT: 32,
  MAX_WIDTH: 500,
  MAX_HEIGHT: 500,
} as const;

/** Posições padrão do player */
export const PLAYER_POSITIONS = {
  DEFAULT_X: WORLD_BOUNDS.w / 2,
  DEFAULT_Y: WORLD_BOUNDS.h * 0.8, // 80% da altura
} as const;

/** Propriedades padrão do player */
export const PLAYER_DEFAULTS = {
  ID: "player",
  TYPE: "player",
  WIDTH: 32,
  HEIGHT: 32,
  HEALTH: 100,
  SPEED: 260,
} as const;

/** Nome padrão para entidades sem ID */
export const DEFAULT_ENTITY_NAME = "entity";

// ============================================================================
// CONFIGURAÇÃO DE SISTEMAS
// ============================================================================

/** Sistemas permitidos pelo runtime Ordax */
export const ORDAX_ALLOWED_SYSTEMS = [
  "PhysicsSystem",
  "CollisionSystem",
  "ParticleSystem",
  "AnimationSystem",
  "AudioSystem",
  "CameraSystem",
  "AISystem",
  "SpawnerSystem",
  "ScoreSystem",
  "UISystem",
  "TimerSystem",
  "DialogueSystem",
  "InventorySystem",
  "SaveSystem",
  "GameStateSystem",
  "InputSystem",
  "TimeSystem",
  "ViewportSystem",
  "VehicleSystem",
  "FSMSystem",
  "SpawnSystem"
] as const;

export type OrdaxAllowedSystem = (typeof ORDAX_ALLOWED_SYSTEMS)[number];

/** Aliases comuns para sistemas (mapeamento de nomes alternativos) */
export const COMMON_SYSTEM_ALIASES: Record<string, OrdaxAllowedSystem> = {
  movementsystem: "PhysicsSystem",
  rendersystem: "UISystem",
  hudsystem: "UISystem",
  scoringsystem: "ScoreSystem",
  spawningsystem: "SpawnerSystem",
  enemysystem: "AISystem",
  // Adicionar mais aliases conforme necessário
} as const;

/** Sistemas obrigatórios por gênero */
export const REQUIRED_SYSTEMS_BY_GENRE: Partial<Record<OrdaxGameType, OrdaxAllowedSystem[]>> = {
  shooter: ["PhysicsSystem", "CollisionSystem", "SpawnerSystem"],
  platformer: ["PhysicsSystem", "CollisionSystem"],
  racing: ["PhysicsSystem", "CollisionSystem"],
  // Outros gêneros podem ter sistemas obrigatórios específicos
} as const;

// ============================================================================
// CONFIGURAÇÃO DE VALIDAÇÃO
// ============================================================================

/** Limites de validação */
export const VALIDATION_LIMITS = {
  MAX_ENTITIES: 100,
  MAX_SYSTEMS: 20,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_ENTITY_NAME_LENGTH: 50,
  MAX_ISSUES_PER_LINT: 50,
} as const;

/** Severidade padrão para diferentes tipos de issues */
export const DEFAULT_SEVERITY = {
  MISSING_GAME_TYPE: "warn" as const,
  MISSING_TITLE: "warn" as const,
  MISSING_ENTITIES: "error" as const,
  DUPLICATE_ENTITY_IDS: "error" as const,
  INVALID_SYSTEMS: "warn" as const,
  ENTITY_OUT_OF_BOUNDS: "warn" as const,
  THEME_NOT_HSL: "warn" as const,
} as const;

// ============================================================================
// CONFIGURAÇÃO DE MENSAGENS
// ============================================================================

/** Mensagens de issues (em português) */
export const ISSUE_MESSAGES = {
  MISSING_GAME_TYPE: "gameType ausente (será inferido/normalizado).",
  MISSING_TITLE: "title ausente (será preenchido).",
  MISSING_ENTITIES: "scene.entities vazio (jogo não renderiza corretamente).",
  DUPLICATE_ENTITY_IDS: "Existem IDs duplicados em entities (causa bugs em colisão/spawn).",
  INVALID_SYSTEMS: "Há systems não suportados pelo runtime (serão removidos/mapeados).",
  ENTITY_OUT_OF_BOUNDS: "Há entidades fora dos bounds do mundo (serão ajustadas).",
  THEME_NOT_HSL: "Cores do theme não estão em HSL; normalize aplicará defaults.",
} as const;

/** Mensagens de fixes (em português) */
export const FIX_MESSAGES = {
  ADD_PLAYER: "Player ausente → adicionado player padrão.",
  RENAME_DUPLICATE_IDS: "IDs duplicados → renomeados automaticamente.",
  FILTER_OR_MAP_SYSTEMS: "Systems inválidos → removidos/mapeados para módulos suportados.",
  CLAMP_ENTITIES_TO_WORLD: "Entidades fora do mundo → ajustadas para dentro do frame.",
  FILL_DEFAULTS: "visual ausente → será preenchido na normalização.",
} as const;

// ============================================================================
// CONFIGURAÇÃO DE PERFORMANCE
// ============================================================================

/** Configuração de cache */
export const CACHE_CONFIG = {
  MAX_CACHE_SIZE: 100,
  DEFAULT_TTL: 300000, // 5 minutos em ms
} as const;

// ============================================================================
// TIPOS DE CONFIGURAÇÃO
// ============================================================================

export interface SpecLintConfig {
  version: string;
  buildDate: string;
  worldBounds: typeof WORLD_BOUNDS;
  worldMargins: typeof WORLD_MARGINS;
  entitySizes: typeof ENTITY_SIZES;
  playerDefaults: typeof PLAYER_DEFAULTS;
  allowedSystems: typeof ORDAX_ALLOWED_SYSTEMS;
  systemAliases: typeof COMMON_SYSTEM_ALIASES;
  validationLimits: typeof VALIDATION_LIMITS;
  defaultSeverity: typeof DEFAULT_SEVERITY;
  issueMessages: typeof ISSUE_MESSAGES;
  fixMessages: typeof FIX_MESSAGES;
  cacheConfig: typeof CACHE_CONFIG;
}

/** Configuração completa exportada */
export const FULL_CONFIG: SpecLintConfig = {
  version: CONFIG_VERSION,
  buildDate: BUILD_DATE,
  worldBounds: WORLD_BOUNDS,
  worldMargins: WORLD_MARGINS,
  entitySizes: ENTITY_SIZES,
  playerDefaults: PLAYER_DEFAULTS,
  allowedSystems: ORDAX_ALLOWED_SYSTEMS,
  systemAliases: COMMON_SYSTEM_ALIASES,
  validationLimits: VALIDATION_LIMITS,
  defaultSeverity: DEFAULT_SEVERITY,
  issueMessages: ISSUE_MESSAGES,
  fixMessages: FIX_MESSAGES,
  cacheConfig: CACHE_CONFIG,
} as const;