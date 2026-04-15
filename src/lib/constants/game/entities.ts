/**
 * Constantes de entidades
 * 
 * Sistema 100% genérico: aceita QUALQUER tipo de entidade
 * Este arquivo mantém apenas entidades padrão para backward compatibility
 */

/**
 * Tipos de entidades padrão para backward compatibility
 * Sistema 100% genérico: qualquer string é aceita como tipo de entidade
 */
export const ENTITY_TYPES = {
  PLAYER: 'player',
  ENEMY: 'enemy',
  PLATFORM: 'platform',
  COIN: 'coin',
  POWERUP: 'powerup',
  PROJECTILE: 'projectile',
  TRIGGER: 'trigger',
  DECORATION: 'decoration',
} as const;

/**
 * Propriedades padrão para entidades
 * Para backward compatibility apenas
 */
export const ENTITY_DEFAULTS = {
  [ENTITY_TYPES.PLAYER]: {
    width: 32,
    height: 32,
    health: 100,
    speed: 260,
    jumpPower: 500,
  },
  [ENTITY_TYPES.ENEMY]: {
    width: 32,
    height: 32,
    health: 50,
    speed: 120,
    damage: 10,
  },
  [ENTITY_TYPES.PLATFORM]: {
    width: 64,
    height: 16,
    isStatic: true,
  },
  [ENTITY_TYPES.COIN]: {
    width: 16,
    height: 16,
    value: 10,
  },
  [ENTITY_TYPES.POWERUP]: {
    width: 24,
    height: 24,
    duration: 10000, // 10 segundos
  },
  [ENTITY_TYPES.PROJECTILE]: {
    width: 8,
    height: 8,
    speed: 400,
    damage: 20,
  },
  [ENTITY_TYPES.TRIGGER]: {
    width: 32,
    height: 32,
    isTrigger: true,
  },
  [ENTITY_TYPES.DECORATION]: {
    width: 32,
    height: 32,
    isStatic: true,
  },
} as const;

/**
 * Valida se um tipo de entidade é padrão
 * Sistema 100% genérico: sempre retorna true para qualquer string
 */
export function isValidEntityType(entityType: string): boolean {
  // Sistema 100% genérico: qualquer string não vazia é válida
  return typeof entityType === 'string' && entityType.trim().length > 0;
}

/**
 * Obtém propriedades padrão para um tipo de entidade
 * Retorna objeto vazio se não for entidade padrão
 */
export function getEntityDefaults(entityType: string): Record<string, unknown> {
  if (ENTITY_DEFAULTS[entityType as keyof typeof ENTITY_DEFAULTS]) {
    return { ...ENTITY_DEFAULTS[entityType as keyof typeof ENTITY_DEFAULTS] };
  }
  
  // Sistema 100% genérico: retorna objeto vazio para entidades customizadas
  return {};
}

/**
 * Lista de tipos de entidade padrão (apenas para backward compatibility)
 * Sistema 100% genérico: não limita tipos de entidade possíveis
 */
export const DEFAULT_ENTITY_TYPES = Object.values(ENTITY_TYPES);

/**
 * Verifica se um tipo de entidade é padrão
 */
export function isDefaultEntityType(entityType: string): boolean {
  return (DEFAULT_ENTITY_TYPES as readonly string[]).includes(entityType);
}

/**
 * Configurações de entidades por gênero
 * Para backward compatibility apenas
 */
export const ENTITIES_BY_GENRE = {
  platformer: [
    ENTITY_TYPES.PLAYER,
    ENTITY_TYPES.ENEMY,
    ENTITY_TYPES.PLATFORM,
    ENTITY_TYPES.COIN,
    ENTITY_TYPES.POWERUP,
  ],
  racing: [
    ENTITY_TYPES.PLAYER,
    ENTITY_TYPES.ENEMY,
    ENTITY_TYPES.COIN,
    ENTITY_TYPES.POWERUP,
  ],
  shooter: [
    ENTITY_TYPES.PLAYER,
    ENTITY_TYPES.ENEMY,
    ENTITY_TYPES.PROJECTILE,
    ENTITY_TYPES.POWERUP,
  ],
  puzzle: [
    ENTITY_TYPES.PLAYER,
    ENTITY_TYPES.PLATFORM,
    ENTITY_TYPES.TRIGGER,
  ],
} as const;