// ✅ CONSTANTES DE SISTEMAS E ENTIDADES (Edge Functions)
// Sistema local para evitar imports de src/

export type System = string;
export type Entity = string;

// Sistemas disponíveis na engine
export const AVAILABLE_SYSTEMS: System[] = [
  'PhysicsSystem',
  'CollisionSystem',
  'ParticleSystem',
  'AnimationSystem',
  'AudioSystem',
  'CameraSystem',
  'AISystem',
  'SpawnerSystem',
  'ScoreSystem',
  'UISystem',
  'TimerSystem',
  'DialogueSystem',
  'InventorySystem',
  'SaveSystem',
  'GameStateSystem',
  'InputSystem',
  'TimeSystem',
  'FSMSystem',
  'ViewportSystem',
  'VehicleSystem',
];

// Entidades disponíveis
export const AVAILABLE_ENTITIES: Entity[] = [
  'player',
  'enemy',
  'pickup',
  'obstacle',
  'goal',
  'spawner',
  'track',
  'vehicle',
  'checkpoint',
  'powerup',
  'StartScreen',
  'HUD',
  'GameOverScreen',
  'background',
  'platform',
  'projectile',
  'wall',
  'door',
  'key',
  'coin',
];

// Mapeamento de sistemas por gameType
export const SYSTEMS_BY_GAME_TYPE: Record<string, System[]> = {
  racing: ['PhysicsSystem', 'VehicleSystem', 'CollisionSystem', 'TimerSystem', 'ScoreSystem'],
  shooter: ['PhysicsSystem', 'CollisionSystem', 'AISystem', 'SpawnerSystem', 'ScoreSystem', 'TimerSystem'],
  platformer: ['PhysicsSystem', 'CollisionSystem', 'ScoreSystem'],
  puzzle: ['TimerSystem', 'ScoreSystem'],
  sports: ['PhysicsSystem', 'CollisionSystem', 'TimerSystem', 'ScoreSystem'],
  topdown: ['PhysicsSystem', 'CollisionSystem', 'AISystem', 'SpawnerSystem', 'ScoreSystem', 'TimerSystem'],
};

// Mapeamento de entidades por gameType
export const ENTITIES_BY_GAME_TYPE: Record<string, Entity[]> = {
  racing: ['player', 'goal', 'track', 'vehicle', 'obstacle', 'checkpoint'],
  shooter: ['player', 'enemy', 'pickup', 'spawner', 'projectile'],
  platformer: ['player', 'spawner', 'enemy', 'pickup', 'platform'],
  puzzle: ['player', 'pickup'],
  sports: ['player', 'pickup'],
  topdown: ['player', 'spawner', 'enemy', 'pickup'],
};

// Sistemas obrigatórios para todos os jogos
export const REQUIRED_SYSTEMS_FOR_ALL: System[] = [
  'TimeSystem',
  'FSMSystem',
  'UISystem',
  'InputSystem',
  'SaveSystem',
  'ViewportSystem',
];

// Entidades obrigatórias para todos os jogos
export const REQUIRED_ENTITIES_FOR_ALL: Entity[] = [
  'StartScreen',
  'HUD',
  'GameOverScreen',
];

// Funções helper
export function isValidSystem(system: System): boolean {
  return AVAILABLE_SYSTEMS.includes(system);
}

export function isValidEntity(entity: Entity): boolean {
  return AVAILABLE_ENTITIES.includes(entity);
}

export function getSystemsForGameType(gameType: string): System[] {
  return SYSTEMS_BY_GAME_TYPE[gameType] || [];
}

export function getEntitiesForGameType(gameType: string): Entity[] {
  return ENTITIES_BY_GAME_TYPE[gameType] || [];
}

export function validateSystems(systems: System[]): { valid: boolean; invalid: System[] } {
  const invalid = systems.filter(system => !isValidSystem(system));
  return {
    valid: invalid.length === 0,
    invalid,
  };
}

export function validateEntities(entities: Entity[]): { valid: boolean; invalid: Entity[] } {
  const invalid = entities.filter(entity => !isValidEntity(entity));
  return {
    valid: invalid.length === 0,
    invalid,
  };
}