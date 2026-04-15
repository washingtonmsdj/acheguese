/**
 * Registry de Entidades do Compilador Ordax
 * 
 * Sistema dinâmico para gerenciar entidades válidas, removendo hardcodes.
 * Permite adicionar entidades customizadas em tempo de execução.
 */

import { z } from 'zod';

// Schema para validação de entidade
export const EntitySchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.enum(['player', 'enemy', 'environment', 'item', 'objective', 'utility', 'spawn']),
  required: z.boolean().default(false),
  configurable: z.boolean().default(true),
  properties: z.record(z.any()).default({}),
  version: z.string().default('1.0.0'),
});

export type Entity = z.infer<typeof EntitySchema>;

// Entidades padrão (extraídas dos hardcodes originais)
export const DEFAULT_ENTITIES: Entity[] = [
  {
    id: 'player',
    name: 'player',
    description: 'Entidade do jogador controlável',
    category: 'player',
    required: true,
    configurable: true,
    properties: { health: 100, speed: 5 },
  },
  {
    id: 'enemy',
    name: 'enemy',
    description: 'Entidade inimiga controlada por IA',
    category: 'enemy',
    required: false,
    configurable: true,
    properties: { health: 50, damage: 10 },
  },
  {
    id: 'goal',
    name: 'goal',
    description: 'Objetivo ou meta do jogo',
    category: 'objective',
    required: false,
    configurable: true,
    properties: {},
  },
  {
    id: 'obstacle',
    name: 'obstacle',
    description: 'Obstáculo que bloqueia movimento',
    category: 'environment',
    required: false,
    configurable: true,
    properties: { solid: true },
  },
  {
    id: 'powerup',
    name: 'powerup',
    description: 'Item que concede poder ao jogador',
    category: 'item',
    required: false,
    configurable: true,
    properties: { duration: 10 },
  },
  {
    id: 'pickup',
    name: 'pickup',
    description: 'Item coletável',
    category: 'item',
    required: false,
    configurable: true,
    properties: { value: 1 },
  },
  {
    id: 'platform',
    name: 'platform',
    description: 'Plataforma para pulo e movimento',
    category: 'environment',
    required: false,
    configurable: true,
    properties: { movable: false },
  },
  {
    id: 'bullet',
    name: 'bullet',
    description: 'Projétil para jogos de tiro',
    category: 'item',
    required: false,
    configurable: true,
    properties: { damage: 20, speed: 10 },
  },
  {
    id: 'vehicle',
    name: 'vehicle',
    description: 'Veículo controlável',
    category: 'player',
    required: false,
    configurable: true,
    properties: { speed: 8, capacity: 1 },
  },
  {
    id: 'track',
    name: 'track',
    description: 'Trilha ou pista para corrida',
    category: 'environment',
    required: false,
    configurable: true,
    properties: { length: 100 },
  },
  {
    id: 'ball',
    name: 'ball',
    description: 'Bola para jogos esportivos',
    category: 'item',
    required: false,
    configurable: true,
    properties: { bounciness: 0.8 },
  },
  {
    id: 'net',
    name: 'net',
    description: 'Rede para jogos esportivos',
    category: 'environment',
    required: false,
    configurable: true,
    properties: {},
  },
  {
    id: 'paddle',
    name: 'paddle',
    description: 'Raquete ou pá para jogos',
    category: 'item',
    required: false,
    configurable: true,
    properties: { speed: 6 },
  },
  {
    id: 'block',
    name: 'block',
    description: 'Bloco para puzzles ou construção',
    category: 'environment',
    required: false,
    configurable: true,
    properties: { movable: true },
  },
  {
    id: 'coin',
    name: 'coin',
    description: 'Moeda coletável',
    category: 'item',
    required: false,
    configurable: true,
    properties: { value: 1 },
  },
  {
    id: 'key',
    name: 'key',
    description: 'Chave para abrir portas',
    category: 'item',
    required: false,
    configurable: true,
    properties: {},
  },
  {
    id: 'door',
    name: 'door',
    description: 'Porta que pode ser aberta',
    category: 'environment',
    required: false,
    configurable: true,
    properties: { locked: true },
  },
  {
    id: 'checkpoint',
    name: 'checkpoint',
    description: 'Ponto de verificação',
    category: 'objective',
    required: false,
    configurable: true,
    properties: {},
  },
  {
    id: 'spawn-point',
    name: 'spawn_point',
    description: 'Ponto de spawn de entidades',
    category: 'spawn',
    required: false,
    configurable: true,
    properties: {},
  },
  {
    id: 'spawner',
    name: 'spawner',
    description: 'Gerador de entidades',
    category: 'spawn',
    required: false,
    configurable: true,
    properties: { rate: 1 },
  },
  {
    id: 'finish-line',
    name: 'finish_line',
    description: 'Linha de chegada',
    category: 'objective',
    required: false,
    configurable: true,
    properties: {},
  },
  {
    id: 'start-line',
    name: 'start_line',
    description: 'Linha de partida',
    category: 'objective',
    required: false,
    configurable: true,
    properties: {},
  },
];

// Registry dinâmico
class EntityRegistry {
  private entities: Map<string, Entity> = new Map();
  private nameToId: Map<string, string> = new Map();

  constructor() {
    this.initializeDefaultEntities();
  }

  private initializeDefaultEntities(): void {
    for (const entity of DEFAULT_ENTITIES) {
      this.registerEntity(entity);
    }
  }

  /**
   * Registra uma nova entidade
   */
  registerEntity(entity: Entity): boolean {
    try {
      const validatedEntity = EntitySchema.parse(entity);
      
      // Verifica se ID já existe
      if (this.entities.has(validatedEntity.id)) {
        console.warn(`Entity with ID ${validatedEntity.id} already exists`);
        return false;
      }

      // Verifica se nome já existe
      if (this.nameToId.has(validatedEntity.name)) {
        console.warn(`Entity with name ${validatedEntity.name} already exists`);
        return false;
      }

      // Adiciona ao registry
      this.entities.set(validatedEntity.id, validatedEntity);
      this.nameToId.set(validatedEntity.name, validatedEntity.id);

      return true;
    } catch (error) {
      console.error('Failed to register entity:', error);
      return false;
    }
  }

  /**
   * Obtém entidade por ID
   */
  getEntityById(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  /**
   * Obtém entidade por nome
   */
  getEntityByName(name: string): Entity | undefined {
    const id = this.nameToId.get(name);
    return id ? this.entities.get(id) : undefined;
  }

  /**
   * Verifica se entidade é válida
   */
  isValidEntity(name: string): boolean {
    return this.nameToId.has(name);
  }

  /**
   * Obtém todas as entidades
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Obtém entidades por categoria
   */
  getEntitiesByCategory(category: Entity['category']): Entity[] {
    return this.getAllEntities().filter(entity => entity.category === category);
  }

  /**
   * Obtém entidades obrigatórias
   */
  getRequiredEntities(): Entity[] {
    return this.getAllEntities().filter(entity => entity.required);
  }

  /**
   * Obtém entidades configuráveis
   */
  getConfigurableEntities(): Entity[] {
    return this.getAllEntities().filter(entity => entity.configurable);
  }

  /**
   * Obtém nomes de todas as entidades
   */
  getAllEntityNames(): string[] {
    return Array.from(this.nameToId.keys());
  }

  /**
   * Valida array de nomes de entidades
   */
  validateEntityNames(entityNames: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const name of entityNames) {
      if (this.isValidEntity(name)) {
        valid.push(name);
      } else {
        invalid.push(name);
      }
    }

    return { valid, invalid };
  }

  /**
   * Remove entidade do registry
   */
  removeEntity(id: string): boolean {
    const entity = this.entities.get(id);
    if (!entity) {
      return false;
    }

    // Remove dos maps
    this.entities.delete(id);
    this.nameToId.delete(entity.name);

    return true;
  }

  /**
   * Atualiza entidade existente
   */
  updateEntity(id: string, updates: Partial<Entity>): boolean {
    const existingEntity = this.entities.get(id);
    if (!existingEntity) {
      return false;
    }

    try {
      const updatedEntity = EntitySchema.parse({
        ...existingEntity,
        ...updates,
        id, // Garante que ID não mude
      });

      // Se nome mudou, atualiza nameToId
      if (updatedEntity.name !== existingEntity.name) {
        this.nameToId.delete(existingEntity.name);
        this.nameToId.set(updatedEntity.name, id);
      }

      this.entities.set(id, updatedEntity);
      return true;
    } catch (error) {
      console.error('Failed to update entity:', error);
      return false;
    }
  }

  /**
   * Limpa registry (mantém entidades padrão)
   */
  clearCustomEntities(): void {
    const defaultIds = new Set(DEFAULT_ENTITIES.map(e => e.id));
    
    // Remove entidades não padrão
    for (const [id, entity] of this.entities.entries()) {
      if (!defaultIds.has(id)) {
        this.entities.delete(id);
        this.nameToId.delete(entity.name);
      }
    }
  }

  /**
   * Exporta configuração atual
   */
  exportConfiguration(): Entity[] {
    return this.getAllEntities();
  }

  /**
   * Importa configuração
   */
  importConfiguration(entities: Entity[]): { success: number; failed: number } {
    let success = 0;
    let failed = 0;

    for (const entity of entities) {
      if (this.registerEntity(entity)) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Busca entidades por propriedade
   */
  searchEntitiesByProperty(property: string, value: unknown): Entity[] {
    return this.getAllEntities().filter(entity => 
      entity.properties && entity.properties[property] === value
    );
  }

  /**
   * Obtém estatísticas do registry
   */
  getStatistics(): {
    total: number;
    byCategory: Record<string, number>;
    required: number;
    configurable: number;
  } {
    const allEntities = this.getAllEntities();
    const byCategory: Record<string, number> = {};

    for (const entity of allEntities) {
      byCategory[entity.category] = (byCategory[entity.category] || 0) + 1;
    }

    return {
      total: allEntities.length,
      byCategory,
      required: allEntities.filter(e => e.required).length,
      configurable: allEntities.filter(e => e.configurable).length,
    };
  }
}

// Instância global do registry
export const entityRegistry = new EntityRegistry();

// Funções utilitárias para backward compatibility
export function isValidEntity(entity: string): boolean {
  return entityRegistry.isValidEntity(entity);
}

export function validateEntities(entities: string[]): { valid: string[]; invalid: string[] } {
  return entityRegistry.validateEntityNames(entities);
}

export function getAllEntityNames(): string[] {
  return entityRegistry.getAllEntityNames();
}

export function getEntityByName(name: string): Entity | undefined {
  return entityRegistry.getEntityByName(name);
}

// Type para backward compatibility
export type ValidEntity = string; // Qualquer string é válida no sistema 100% genérico

// Exportar entidades padrão como constantes
export const ENTITY_NAMES = {
  PLAYER: 'player',
  ENEMY: 'enemy',
  GOAL: 'goal',
  OBSTACLE: 'obstacle',
  POWERUP: 'powerup',
  PICKUP: 'pickup',
  PLATFORM: 'platform',
  BULLET: 'bullet',
  VEHICLE: 'vehicle',
  TRACK: 'track',
  BALL: 'ball',
  NET: 'net',
  PADDLE: 'paddle',
  BLOCK: 'block',
  COIN: 'coin',
  KEY: 'key',
  DOOR: 'door',
  CHECKPOINT: 'checkpoint',
  SPAWN_POINT: 'spawn_point',
  SPAWNER: 'spawner',
  FINISH_LINE: 'finish_line',
  START_LINE: 'start_line',
} as const;

// Funções helper para uso comum
export function getPlayerEntities(): Entity[] {
  return entityRegistry.getEntitiesByCategory('player');
}

export function getEnemyEntities(): Entity[] {
  return entityRegistry.getEntitiesByCategory('enemy');
}

export function getItemEntities(): Entity[] {
  return entityRegistry.getEntitiesByCategory('item');
}

export function getEnvironmentEntities(): Entity[] {
  return entityRegistry.getEntitiesByCategory('environment');
}

export function getObjectiveEntities(): Entity[] {
  return entityRegistry.getEntitiesByCategory('objective');
}

// Cache para performance
const validationCache = new Map<string, boolean>();

export function isValidEntityCached(entity: string): boolean {
  if (validationCache.has(entity)) {
    return validationCache.get(entity)!;
  }

  const isValid = entityRegistry.isValidEntity(entity);
  validationCache.set(entity, isValid);
  return isValid;
}

export function clearValidationCache(): void {
  validationCache.clear();
}