/**
 * Registry de Sistemas do Compilador Ordax
 * 
 * Sistema dinâmico para gerenciar sistemas válidos, removendo hardcodes.
 * Permite adicionar sistemas customizados em tempo de execução.
 */

import { z } from 'zod';

// Schema para validação de sistema
export const SystemSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.enum(['physics', 'rendering', 'audio', 'ui', 'ai', 'gameplay', 'utility', 'constitutional']),
  required: z.boolean().default(false),
  configurable: z.boolean().default(true),
  dependencies: z.array(z.string()).default([]),
  version: z.string().default('1.0.0'),
});

export type System = z.infer<typeof SystemSchema>;

// Sistemas padrão (extraídos dos hardcodes originais)
export const DEFAULT_SYSTEMS: System[] = [
  {
    id: 'physics-system',
    name: 'PhysicsSystem',
    description: 'Sistema de física para movimento e colisões',
    category: 'physics',
    required: true,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'collision-system',
    name: 'CollisionSystem',
    description: 'Sistema de detecção e resolução de colisões',
    category: 'physics',
    required: true,
    configurable: true,
    dependencies: ['physics-system'],
  },
  {
    id: 'particle-system',
    name: 'ParticleSystem',
    description: 'Sistema de partículas para efeitos visuais',
    category: 'rendering',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'animation-system',
    name: 'AnimationSystem',
    description: 'Sistema de animação para sprites e modelos',
    category: 'rendering',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'audio-system',
    name: 'AudioSystem',
    description: 'Sistema de áudio para sons e música',
    category: 'audio',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'camera-system',
    name: 'CameraSystem',
    description: 'Sistema de câmera para controle de visão',
    category: 'rendering',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'ai-system',
    name: 'AISystem',
    description: 'Sistema de IA para comportamento de inimigos',
    category: 'ai',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'spawner-system',
    name: 'SpawnerSystem',
    description: 'Sistema de spawn de entidades',
    category: 'gameplay',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'score-system',
    name: 'ScoreSystem',
    description: 'Sistema de pontuação',
    category: 'gameplay',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'ui-system',
    name: 'UISystem',
    description: 'Sistema de interface do usuário',
    category: 'ui',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'timer-system',
    name: 'TimerSystem',
    description: 'Sistema de temporizadores',
    category: 'utility',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'dialogue-system',
    name: 'DialogueSystem',
    description: 'Sistema de diálogos',
    category: 'gameplay',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'inventory-system',
    name: 'InventorySystem',
    description: 'Sistema de inventário',
    category: 'gameplay',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'save-system',
    name: 'SaveSystem',
    description: 'Sistema de salvamento',
    category: 'utility',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'game-state-system',
    name: 'GameStateSystem',
    description: 'Sistema de estados do jogo (FSM constitucional)',
    category: 'constitutional',
    required: true,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'input-system',
    name: 'InputSystem',
    description: 'Sistema de input (constitucional)',
    category: 'constitutional',
    required: true,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'time-system',
    name: 'TimeSystem',
    description: 'Sistema de tempo',
    category: 'utility',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'fsm-system',
    name: 'FSMSystem',
    description: 'Sistema de máquina de estados finitos',
    category: 'gameplay',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'vehicle-system',
    name: 'VehicleSystem',
    description: 'Sistema de veículos',
    category: 'physics',
    required: false,
    configurable: true,
    dependencies: ['physics-system'],
  },
  {
    id: 'viewport-system',
    name: 'ViewportSystem',
    description: 'Sistema de viewport',
    category: 'rendering',
    required: false,
    configurable: true,
    dependencies: [],
  },
  {
    id: 'spawn-system',
    name: 'SpawnSystem',
    description: 'Sistema de spawn',
    category: 'gameplay',
    required: false,
    configurable: true,
    dependencies: [],
  },
];

// Registry dinâmico
class SystemRegistry {
  private systems: Map<string, System> = new Map();
  private nameToId: Map<string, string> = new Map();

  constructor() {
    this.initializeDefaultSystems();
  }

  private initializeDefaultSystems(): void {
    for (const system of DEFAULT_SYSTEMS) {
      this.registerSystem(system);
    }
  }

  /**
   * Registra um novo sistema
   */
  registerSystem(system: System): boolean {
    try {
      const validatedSystem = SystemSchema.parse(system);
      
      // Verifica se ID já existe
      if (this.systems.has(validatedSystem.id)) {
        console.warn(`System with ID ${validatedSystem.id} already exists`);
        return false;
      }

      // Verifica se nome já existe
      if (this.nameToId.has(validatedSystem.name)) {
        console.warn(`System with name ${validatedSystem.name} already exists`);
        return false;
      }

      // Adiciona ao registry
      this.systems.set(validatedSystem.id, validatedSystem);
      this.nameToId.set(validatedSystem.name, validatedSystem.id);

      return true;
    } catch (error) {
      console.error('Failed to register system:', error);
      return false;
    }
  }

  /**
   * Obtém sistema por ID
   */
  getSystemById(id: string): System | undefined {
    return this.systems.get(id);
  }

  /**
   * Obtém sistema por nome
   */
  getSystemByName(name: string): System | undefined {
    const id = this.nameToId.get(name);
    return id ? this.systems.get(id) : undefined;
  }

  /**
   * Verifica se sistema é válido
   */
  isValidSystem(name: string): boolean {
    return this.nameToId.has(name);
  }

  /**
   * Obtém todos os sistemas
   */
  getAllSystems(): System[] {
    return Array.from(this.systems.values());
  }

  /**
   * Obtém sistemas por categoria
   */
  getSystemsByCategory(category: System['category']): System[] {
    return this.getAllSystems().filter(system => system.category === category);
  }

  /**
   * Obtém sistemas obrigatórios
   */
  getRequiredSystems(): System[] {
    return this.getAllSystems().filter(system => system.required);
  }

  /**
   * Obtém sistemas configuráveis
   */
  getConfigurableSystems(): System[] {
    return this.getAllSystems().filter(system => system.configurable);
  }

  /**
   * Obtém nomes de todos os sistemas
   */
  getAllSystemNames(): string[] {
    return Array.from(this.nameToId.keys());
  }

  /**
   * Valida array de nomes de sistemas
   */
  validateSystemNames(systemNames: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const name of systemNames) {
      if (this.isValidSystem(name)) {
        valid.push(name);
      } else {
        invalid.push(name);
      }
    }

    return { valid, invalid };
  }

  /**
   * Remove sistema do registry
   */
  removeSystem(id: string): boolean {
    const system = this.systems.get(id);
    if (!system) {
      return false;
    }

    // Remove dos maps
    this.systems.delete(id);
    this.nameToId.delete(system.name);

    return true;
  }

  /**
   * Atualiza sistema existente
   */
  updateSystem(id: string, updates: Partial<System>): boolean {
    const existingSystem = this.systems.get(id);
    if (!existingSystem) {
      return false;
    }

    try {
      const updatedSystem = SystemSchema.parse({
        ...existingSystem,
        ...updates,
        id, // Garante que ID não mude
      });

      // Se nome mudou, atualiza nameToId
      if (updatedSystem.name !== existingSystem.name) {
        this.nameToId.delete(existingSystem.name);
        this.nameToId.set(updatedSystem.name, id);
      }

      this.systems.set(id, updatedSystem);
      return true;
    } catch (error) {
      console.error('Failed to update system:', error);
      return false;
    }
  }

  /**
   * Limpa registry (mantém sistemas padrão)
   */
  clearCustomSystems(): void {
    const defaultIds = new Set(DEFAULT_SYSTEMS.map(s => s.id));
    
    // Remove sistemas não padrão
    for (const [id, system] of this.systems.entries()) {
      if (!defaultIds.has(id)) {
        this.systems.delete(id);
        this.nameToId.delete(system.name);
      }
    }
  }

  /**
   * Exporta configuração atual
   */
  exportConfiguration(): System[] {
    return this.getAllSystems();
  }

  /**
   * Importa configuração
   */
  importConfiguration(systems: System[]): { success: number; failed: number } {
    let success = 0;
    let failed = 0;

    for (const system of systems) {
      if (this.registerSystem(system)) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }
}

// Instância global do registry
export const systemRegistry = new SystemRegistry();

// Funções utilitárias para backward compatibility
export function isValidSystem(system: string): boolean {
  return systemRegistry.isValidSystem(system);
}

export function validateSystems(systems: string[]): { valid: string[]; invalid: string[] } {
  return systemRegistry.validateSystemNames(systems);
}

export function getAllSystemNames(): string[] {
  return systemRegistry.getAllSystemNames();
}

export function getSystemByName(name: string): System | undefined {
  return systemRegistry.getSystemByName(name);
}

// Type para backward compatibility
export type ValidSystem = string; // Qualquer string é válida no sistema 100% genérico

// Exportar sistemas padrão como constantes
export const SYSTEM_NAMES = {
  PHYSICS_SYSTEM: 'PhysicsSystem',
  COLLISION_SYSTEM: 'CollisionSystem',
  PARTICLE_SYSTEM: 'ParticleSystem',
  ANIMATION_SYSTEM: 'AnimationSystem',
  AUDIO_SYSTEM: 'AudioSystem',
  CAMERA_SYSTEM: 'CameraSystem',
  AI_SYSTEM: 'AISystem',
  SPAWNER_SYSTEM: 'SpawnerSystem',
  SCORE_SYSTEM: 'ScoreSystem',
  UI_SYSTEM: 'UISystem',
  TIMER_SYSTEM: 'TimerSystem',
  DIALOGUE_SYSTEM: 'DialogueSystem',
  INVENTORY_SYSTEM: 'InventorySystem',
  SAVE_SYSTEM: 'SaveSystem',
  GAME_STATE_SYSTEM: 'GameStateSystem',
  INPUT_SYSTEM: 'InputSystem',
  TIME_SYSTEM: 'TimeSystem',
  FSM_SYSTEM: 'FSMSystem',
  VEHICLE_SYSTEM: 'VehicleSystem',
  VIEWPORT_SYSTEM: 'ViewportSystem',
  SPAWN_SYSTEM: 'SpawnSystem',
} as const;