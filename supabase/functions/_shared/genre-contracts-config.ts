// Genre Contracts Configuration - Edge Functions
// 100% data-driven, no hardcodes

import {
  SYSTEM_NAMES
} from "./constants/validation-rules-constants.ts";

import {
  ERROR_MESSAGES,
  DEFAULT_VALUES,
} from "./constants/genre-contracts-constants.ts";

const ENTITY_NAMES = {
  PLAYER: 'player',
  ENEMY: 'enemy',
  BULLET: 'bullet',
  PICKUP: 'pickup',
  OBSTACLE: 'obstacle',
  GOAL: 'goal',
  SPAWNER: 'spawner',
  TRACK: 'track',
  VEHICLE: 'vehicle',
  CHECKPOINT: 'checkpoint',
  POWERUP: 'powerup',
  PLATFORM: 'platform',
  COIN: 'coin',
  DOOR: 'door',
  KEY: 'key',
  BALL: 'ball',
  NET: 'net',
  PADDLE: 'paddle',
  BLOCK: 'block',
} as const;

// Types
export interface GenreContractDefinition {
  requiredSystems: readonly string[];
  requiredEntities: readonly string[];
  optionalSystems?: readonly string[];
  optionalEntities?: readonly string[];
  description: string;
  examples: readonly string[];
  config?: Record<string, unknown>;
}

export type OrdaxGameType = string;
export type ValidSystem = string;
export type ValidEntity = string;

// Genre contracts
// ⚠️ IMPORTANT: requiredSystems are injected into the spec by the normalizer
// when fillMissingSystems=true. Keep them comprehensive per genre.
export const GENRE_CONTRACTS: Record<string, GenreContractDefinition> = {
  racing: {
    requiredSystems: [
      SYSTEM_NAMES.PHYSICS_SYSTEM,
      SYSTEM_NAMES.COLLISION_SYSTEM,
      SYSTEM_NAMES.TIMER_SYSTEM,
      SYSTEM_NAMES.VEHICLE_SYSTEM,
      SYSTEM_NAMES.UI_SYSTEM,
      SYSTEM_NAMES.SCORE_SYSTEM,
      SYSTEM_NAMES.CAMERA_SYSTEM,
    ],
    requiredEntities: [ENTITY_NAMES.PLAYER, ENTITY_NAMES.GOAL, ENTITY_NAMES.TRACK, ENTITY_NAMES.VEHICLE],
    optionalSystems: [
      SYSTEM_NAMES.AUDIO_SYSTEM,
      SYSTEM_NAMES.PARTICLE_SYSTEM,
      SYSTEM_NAMES.ANIMATION_SYSTEM,
      SYSTEM_NAMES.SPAWNER_SYSTEM,
    ],
    optionalEntities: [ENTITY_NAMES.OBSTACLE, ENTITY_NAMES.CHECKPOINT, ENTITY_NAMES.POWERUP],
    description: "Jogo de corrida com veículos controláveis",
    examples: ["Corrida de carros", "Corrida contra o tempo"],
  },
  shooter: {
    requiredSystems: [
      SYSTEM_NAMES.PHYSICS_SYSTEM,
      SYSTEM_NAMES.COLLISION_SYSTEM,
      SYSTEM_NAMES.AI_SYSTEM,
      SYSTEM_NAMES.UI_SYSTEM,
      SYSTEM_NAMES.SCORE_SYSTEM,
      SYSTEM_NAMES.TIMER_SYSTEM,
      SYSTEM_NAMES.SPAWNER_SYSTEM,
      SYSTEM_NAMES.CAMERA_SYSTEM,
    ],
    requiredEntities: [ENTITY_NAMES.PLAYER, ENTITY_NAMES.ENEMY, ENTITY_NAMES.BULLET],
    optionalSystems: [
      SYSTEM_NAMES.AUDIO_SYSTEM,
      SYSTEM_NAMES.PARTICLE_SYSTEM,
      SYSTEM_NAMES.ANIMATION_SYSTEM,
    ],
    optionalEntities: [ENTITY_NAMES.POWERUP, ENTITY_NAMES.OBSTACLE],
    description: "Jogo de tiro com inimigos e IA",
    examples: ["Shooter 2D", "Survival shooter"],
  },
  platformer: {
    requiredSystems: [
      SYSTEM_NAMES.PHYSICS_SYSTEM,
      SYSTEM_NAMES.COLLISION_SYSTEM,
      SYSTEM_NAMES.UI_SYSTEM,
      SYSTEM_NAMES.SCORE_SYSTEM,
      SYSTEM_NAMES.TIMER_SYSTEM,
      SYSTEM_NAMES.CAMERA_SYSTEM,
    ],
    requiredEntities: [ENTITY_NAMES.PLAYER, ENTITY_NAMES.PLATFORM],
    optionalSystems: [
      SYSTEM_NAMES.AUDIO_SYSTEM,
      SYSTEM_NAMES.PARTICLE_SYSTEM,
      SYSTEM_NAMES.ANIMATION_SYSTEM,
      SYSTEM_NAMES.AI_SYSTEM,
      SYSTEM_NAMES.SPAWNER_SYSTEM,
    ],
    optionalEntities: [ENTITY_NAMES.ENEMY, ENTITY_NAMES.COIN, ENTITY_NAMES.POWERUP],
    description: "Jogo de plataforma com física de pulo",
    examples: ["Plataforma 2D", "Plataforma com colecionáveis"],
  },
  puzzle: {
    requiredSystems: [
      SYSTEM_NAMES.TIMER_SYSTEM,
      SYSTEM_NAMES.UI_SYSTEM,
      SYSTEM_NAMES.SCORE_SYSTEM,
    ],
    requiredEntities: [ENTITY_NAMES.PLAYER],
    optionalSystems: [
      SYSTEM_NAMES.PHYSICS_SYSTEM,
      SYSTEM_NAMES.COLLISION_SYSTEM,
      SYSTEM_NAMES.AUDIO_SYSTEM,
      SYSTEM_NAMES.ANIMATION_SYSTEM,
      SYSTEM_NAMES.PARTICLE_SYSTEM,
    ],
    optionalEntities: [ENTITY_NAMES.BLOCK, ENTITY_NAMES.KEY, ENTITY_NAMES.DOOR],
    description: "Jogo de puzzle com mecânicas de lógica",
    examples: ["Puzzle de blocos", "Jogo de lógica"],
  },
  sports: {
    requiredSystems: [
      SYSTEM_NAMES.PHYSICS_SYSTEM,
      SYSTEM_NAMES.COLLISION_SYSTEM,
      SYSTEM_NAMES.UI_SYSTEM,
      SYSTEM_NAMES.SCORE_SYSTEM,
      SYSTEM_NAMES.TIMER_SYSTEM,
    ],
    requiredEntities: [ENTITY_NAMES.PLAYER, ENTITY_NAMES.BALL],
    optionalSystems: [
      SYSTEM_NAMES.AUDIO_SYSTEM,
      SYSTEM_NAMES.PARTICLE_SYSTEM,
      SYSTEM_NAMES.ANIMATION_SYSTEM,
      SYSTEM_NAMES.AI_SYSTEM,
    ],
    optionalEntities: [ENTITY_NAMES.NET, ENTITY_NAMES.PADDLE, ENTITY_NAMES.GOAL],
    description: "Jogo esportivo com física de bola",
    examples: ["Futebol", "Tênis"],
  },
  topdown: {
    requiredSystems: [
      SYSTEM_NAMES.PHYSICS_SYSTEM,
      SYSTEM_NAMES.COLLISION_SYSTEM,
      SYSTEM_NAMES.AI_SYSTEM,
      SYSTEM_NAMES.UI_SYSTEM,
      SYSTEM_NAMES.SCORE_SYSTEM,
      SYSTEM_NAMES.TIMER_SYSTEM,
      SYSTEM_NAMES.SPAWNER_SYSTEM,
      SYSTEM_NAMES.CAMERA_SYSTEM,
    ],
    requiredEntities: [ENTITY_NAMES.PLAYER, ENTITY_NAMES.ENEMY],
    optionalSystems: [
      SYSTEM_NAMES.AUDIO_SYSTEM,
      SYSTEM_NAMES.PARTICLE_SYSTEM,
      SYSTEM_NAMES.ANIMATION_SYSTEM,
    ],
    optionalEntities: [ENTITY_NAMES.BULLET, ENTITY_NAMES.POWERUP, ENTITY_NAMES.OBSTACLE],
    description: "Jogo top-down com visão de cima",
    examples: ["Top-down shooter", "RPG top-down"],
  },
};

// Cache
const genreContractCache = new Map<string, GenreContractDefinition>();

export function getGenreContract(genre: string): GenreContractDefinition | null {
  if (genreContractCache.has(genre)) return genreContractCache.get(genre)!;
  const contract = GENRE_CONTRACTS[genre] || null;
  if (contract) genreContractCache.set(genre, contract);
  return contract;
}

export function getAllGenres(): string[] {
  return Object.keys(GENRE_CONTRACTS);
}

export function isValidSystem(system: string): boolean {
  return Object.values(SYSTEM_NAMES).includes(system);
}

export function isValidEntity(entity: string): boolean {
  return Object.values(ENTITY_NAMES).includes(entity);
}

export function validateSystems(systems: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const s of systems) {
    (isValidSystem(s) ? valid : invalid).push(s);
  }
  return { valid, invalid };
}

export function validateEntities(entities: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const e of entities) {
    (isValidEntity(e) ? valid : invalid).push(e);
  }
  return { valid, invalid };
}

export function addCustomGenreContract(genre: string, contract: GenreContractDefinition): boolean {
  if (!genre?.trim() || !contract.requiredSystems?.length || !contract.requiredEntities?.length) return false;
  GENRE_CONTRACTS[genre] = contract;
  genreContractCache.delete(genre);
  return true;
}

export function clearGenreContractCache(): void {
  genreContractCache.clear();
}

export { ERROR_MESSAGES, SYSTEM_NAMES };