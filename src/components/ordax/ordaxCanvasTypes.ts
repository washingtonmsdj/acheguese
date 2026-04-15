/**
 * 🔒 ORDAX CANVAS TYPES - 100% TYPE SAFE
 * 
 * Type guards e tipos explícitos para eliminar `any` e type assertions inseguras.
 * 
 * @version 2.0.0
 * @build 2026-02-16
 */

import type { OrdaxEntity, OrdaxSpec } from "@/lib/ordax/types";

// ============================================================================
// TIPOS PRIMÁRIOS
// ============================================================================

/**
 * Tipo seguro para teclas de jogo
 */
export type GameKey = 
  | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
  | 'w' | 'a' | 's' | 'd'
  | ' ';

/**
 * Mapa de teclas pressionadas
 */
export type Keys = Partial<Record<GameKey, boolean>>;

/**
 * Valida se uma string é uma tecla de jogo válida
 */
export function isGameKey(key: string): key is GameKey {
  const validKeys: GameKey[] = [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'w', 'a', 's', 'd', ' '
  ];
  return validKeys.includes(key as GameKey);
}

/**
 * Valida se um objeto é um mapa de teclas válido
 */
export function isValidKeys(obj: unknown): obj is Keys {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const keys = Object.keys(obj);
  return keys.every(key => isGameKey(key) && typeof (obj as Record<string, unknown>)[key] === 'boolean');
}

// ============================================================================
// TIPOS DE ENTIDADES DO JOGO
// ============================================================================

/**
 * Tipo de spawned (inimigo, powerup, etc.)
 */
export type SpawnedType = 'enemy' | 'asteroid' | 'powerup';

/**
 * Variante de inimigo
 */
export type EnemyVariant = 'scout' | 'tank' | 'sniper';

/**
 * Tipo de powerup
 */
export type PowerupKind = 'shield' | 'spread';

/**
 * Entidade spawned no jogo
 */
export interface Spawned {
  id: string;
  type: SpawnedType;
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  vx?: number;
  hp?: number;
  variant?: EnemyVariant;
  kind?: PowerupKind;
  dead?: boolean;
}

/**
 * Valida se um objeto é um Spawned válido
 */
export function isValidSpawned(obj: unknown): obj is Spawned {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const spawned = obj as Record<string, unknown>;
  
  // Campos obrigatórios
  if (typeof spawned.id !== 'string' || !spawned.id) return false;
  if (typeof spawned.type !== 'string' || !['enemy', 'asteroid', 'powerup'].includes(spawned.type)) return false;
  if (typeof spawned.x !== 'number' || !isFinite(spawned.x)) return false;
  if (typeof spawned.y !== 'number' || !isFinite(spawned.y)) return false;
  if (typeof spawned.w !== 'number' || !isFinite(spawned.w) || spawned.w <= 0) return false;
  if (typeof spawned.h !== 'number' || !isFinite(spawned.h) || spawned.h <= 0) return false;
  if (typeof spawned.vy !== 'number' || !isFinite(spawned.vy)) return false;
  
  // Campos opcionais
  if (spawned.vx !== undefined && (typeof spawned.vx !== 'number' || !isFinite(spawned.vx))) return false;
  if (spawned.hp !== undefined && (typeof spawned.hp !== 'number' || !isFinite(spawned.hp) || spawned.hp < 0)) return false;
  if (spawned.variant !== undefined && !['scout', 'tank', 'sniper'].includes(spawned.variant as string)) return false;
  if (spawned.kind !== undefined && !['shield', 'spread'].includes(spawned.kind as string)) return false;
  if (spawned.dead !== undefined && typeof spawned.dead !== 'boolean') return false;
  
  return true;
}

/**
 * Projétil (bullet)
 */
export interface Bullet {
  id: string;
  type: 'bullet';
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  dead?: boolean;
}

/**
 * Valida se um objeto é um Bullet válido
 */
export function isValidBullet(obj: unknown): obj is Bullet {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const bullet = obj as Record<string, unknown>;
  
  // Campos obrigatórios
  if (typeof bullet.id !== 'string' || !bullet.id) return false;
  if (bullet.type !== 'bullet') return false;
  if (typeof bullet.x !== 'number' || !isFinite(bullet.x)) return false;
  if (typeof bullet.y !== 'number' || !isFinite(bullet.y)) return false;
  if (typeof bullet.w !== 'number' || !isFinite(bullet.w) || bullet.w <= 0) return false;
  if (typeof bullet.h !== 'number' || !isFinite(bullet.h) || bullet.h <= 0) return false;
  if (typeof bullet.vx !== 'number' || !isFinite(bullet.vx)) return false;
  if (typeof bullet.vy !== 'number' || !isFinite(bullet.vy)) return false;
  
  // Campos opcionais
  if (bullet.dead !== undefined && typeof bullet.dead !== 'boolean') return false;
  
  return true;
}

// ============================================================================
// TIPOS DE ESTADO DO JOGO
// ============================================================================

/**
 * Estado do escudo
 */
export interface ShieldState {
  value: number;
  max: number;
  regenPerSec: number;
}

/**
 * Valida se um objeto é um ShieldState válido
 */
export function isValidShieldState(obj: unknown): obj is ShieldState {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const shield = obj as Record<string, unknown>;
  
  if (typeof shield.value !== 'number' || !isFinite(shield.value) || shield.value < 0) return false;
  if (typeof shield.max !== 'number' || !isFinite(shield.max) || shield.max <= 0) return false;
  if (typeof shield.regenPerSec !== 'number' || !isFinite(shield.regenPerSec) || shield.regenPerSec < 0) return false;
  
  return true;
}

/**
 * Buffs ativos
 */
export interface Buffs {
  shield: number;
  spread: number;
}

/**
 * Valida se um objeto é um Buffs válido
 */
export function isValidBuffs(obj: unknown): obj is Buffs {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const buffs = obj as Record<string, unknown>;
  
  if (typeof buffs.shield !== 'number' || !isFinite(buffs.shield) || buffs.shield < 0) return false;
  if (typeof buffs.spread !== 'number' || !isFinite(buffs.spread) || buffs.spread < 0) return false;
  
  return true;
}

// ============================================================================
// TIPOS DE ÁUDIO
// ============================================================================

/**
 * Tipo de som de fallback
 */
export type FallbackSfxKind = 'shoot' | 'hit' | 'power' | 'score' | 'gameover';

/**
 * Tipo de som do sistema de áudio
 */
export type AudioSfxId = 'shoot' | 'collision' | 'score' | 'gameOver' | 'powerup';

/**
 * Mapeamento de IDs de som para tipos de fallback
 */
export const SOUND_MAPPING: Record<AudioSfxId, FallbackSfxKind> = {
  shoot: 'shoot',
  collision: 'hit',
  score: 'score',
  gameOver: 'gameover',
  powerup: 'power'
} as const;

/**
 * Valida se um ID de som é válido
 */
export function isValidAudioSfxId(id: string): id is AudioSfxId {
  return id in SOUND_MAPPING;
}

/**
 * Valida se um tipo de fallback é válido
 */
export function isValidFallbackSfxKind(kind: string): kind is FallbackSfxKind {
  return ['shoot', 'hit', 'power', 'score', 'gameover'].includes(kind);
}

// ============================================================================
// TIPOS DE SISTEMAS — delegados ao SSOT lib/ordax/constants.ts
// ============================================================================

import { ORDAX_ALLOWED_SYSTEMS, isValidSystem } from "@/lib/ordax/constants";

/**
 * Nomes dos sistemas suportados — SSOT: lib/ordax/constants.ts
 */
export type SystemName = typeof ORDAX_ALLOWED_SYSTEMS[number];

/**
 * Valida se um nome de sistema é válido — delega ao SSOT
 */
export function isValidSystemName(name: string): name is SystemName {
  return isValidSystem(name);
}

// ============================================================================
// TIPOS DE VALIDAÇÃO
// ============================================================================

/**
 * Resultado de validação
 */
export interface ValidationResult<T> {
  isValid: boolean;
  value: T;
  error?: string;
}

/**
 * Cria um resultado de validação válido
 */
export function createValidResult<T>(value: T): ValidationResult<T> {
  return { isValid: true, value };
}

/**
 * Cria um resultado de validação inválido
 */
export function createInvalidResult<T>(error: string, fallbackValue: T): ValidationResult<T> {
  return { isValid: false, value: fallbackValue, error };
}

// ============================================================================
// TYPE GUARDS PARA ORDAX SPEC
// ============================================================================

/**
 * Valida se um objeto é uma OrdaxSpec válida
 */
export function isValidOrdaxSpec(obj: unknown): obj is OrdaxSpec {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const spec = obj as Record<string, unknown>;
  
  // Campos obrigatórios mínimos
  if (spec.gameType === undefined) return false;
  if (spec.title === undefined) return false;
  
  // Scene é opcional mas se existir deve ter estrutura válida
  if (spec.scene !== undefined) {
    if (typeof spec.scene !== 'object' || spec.scene === null) return false;
    const scene = spec.scene as Record<string, unknown>;
    if (scene.entities !== undefined && !Array.isArray(scene.entities)) return false;
  }
  
  return true;
}

/**
 * Valida se um objeto é uma OrdaxEntity válida
 */
export function isValidOrdaxEntity(obj: unknown): obj is OrdaxEntity {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const entity = obj as Record<string, unknown>;
  
  // Campos obrigatórios
  if (typeof entity.id !== 'string' || !entity.id) return false;
  if (typeof entity.type !== 'string' || !entity.type) return false;
  if (typeof entity.x !== 'number' || !isFinite(entity.x)) return false;
  if (typeof entity.y !== 'number' || !isFinite(entity.y)) return false;
  if (typeof entity.w !== 'number' || !isFinite(entity.w) || entity.w <= 0) return false;
  if (typeof entity.h !== 'number' || !isFinite(entity.h) || entity.h <= 0) return false;
  
  return true;
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO SEGURA
// ============================================================================

/**
 * Valida e obtém a entidade do jogador de forma segura
 */
export function getPlayerEntitySafe(entities: OrdaxEntity[]): OrdaxEntity | null {
  if (!Array.isArray(entities)) return null;
  
  const player = entities.find(e => 
    e.type === 'player' || e.id === 'player'
  );
  
  return player && isValidOrdaxEntity(player) ? player : null;
}

/**
 * Valida e obtém spawners de forma segura.
 * Spawners são entidades de controle invisíveis — NÃO exigem w/h > 0.
 */
export function getSpawnersSafe(entities: OrdaxEntity[]): OrdaxEntity[] {
  if (!Array.isArray(entities)) return [];
  
  return entities.filter(e => {
    if (!e || typeof e !== 'object') return false;
    if (e.type !== 'spawner') return false;
    if (typeof e.id !== 'string' || !e.id) return false;
    if (typeof e.x !== 'number' || !isFinite(e.x)) return false;
    if (typeof e.y !== 'number' || !isFinite(e.y)) return false;
    // w/h can be 0 for spawners (invisible control entities)
    if (typeof e.w !== 'number' || !isFinite(e.w)) return false;
    if (typeof e.h !== 'number' || !isFinite(e.h)) return false;
    return true;
  });
}

/**
 * Valida se um sistema está habilitado de forma segura
 */
export function isSystemEnabledSafe(systems: string[] | undefined, systemName: SystemName): boolean {
  if (!Array.isArray(systems)) return false;
  
  return systems.some(s => s === systemName);
}

// ============================================================================
// CONSTANTES DE VALIDAÇÃO
// ============================================================================

/**
 * Limites de validação
 */
export const VALIDATION_LIMITS = {
  MIN_HEALTH: 0,
  MAX_HEALTH: 1000,
  MIN_SHIELD: 0,
  MAX_SHIELD: 1000,
  MIN_DAMAGE: 0,
  MAX_DAMAGE: 1000,
  MIN_VELOCITY: -1000,
  MAX_VELOCITY: 1000,
  MIN_DIMENSION: 1,
  MAX_DIMENSION: 10000,
  MIN_COORDINATE: -10000,
  MAX_COORDINATE: 10000,
} as const;

/**
 * Mensagens de erro de validação
 */
export const VALIDATION_ERRORS = {
  INVALID_SPEC: 'Spec inválida ou malformada',
  INVALID_ENTITY: 'Entidade inválida ou malformada',
  INVALID_SPAWNED: 'Spawned inválido ou malformado',
  INVALID_BULLET: 'Bullet inválido ou malformado',
  INVALID_KEYS: 'Mapa de teclas inválido',
  INVALID_SHIELD: 'Estado de escudo inválido',
  INVALID_BUFFS: 'Buffs inválidos',
  INVALID_AUDIO_ID: 'ID de áudio inválido',
  INVALID_SYSTEM_NAME: 'Nome de sistema inválido',
} as const;

// ============================================================================
// TIPOS DE DEBUG
// ============================================================================

/**
 * Informações de debug do canvas
 * SSOT: este tipo substitui canvas/types.ts
 */
export type DebugInfo = {
  systems: {
    physics: boolean;
    collision: boolean;
    particles: boolean;
    particleCount: number;
    score: boolean;
    ai: boolean;
    camera: boolean;
    audio: boolean;
    ui: boolean;
    timer: boolean;
    animation: boolean;
  };
  entities: {
    total: number;
    spawned: number;
  };
  player: {
    health: number;
    x: number;
    y: number;
  } | null;
  score: {
    current: number;
    multiplier: number;
    combo: number;
  } | null;
};

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  OrdaxEntity,
  OrdaxSpec,
};