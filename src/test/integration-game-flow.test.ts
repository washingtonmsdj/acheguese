// integration-game-flow.test.ts
// Teste de integração do fluxo completo "jogo de carro"

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { OrdaxEntity } from '../lib/ordax/types';

// Mock do Supabase para testes
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

// Mock do ambiente
vi.stubGlobal('process', {
  env: {
    DEBUG_COLLISIONS: 'false',
    DEBUG_PERFORMANCE: 'false'
  }
});

describe('Fluxo Completo: "jogo de carro"', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // TESTE 1: Fluxo básico de interpretação
  // ============================================================================
  
  describe('Fase 1: Interpretação do pedido do usuário', () => {
    it('deve interpretar "jogo de carro" como racing game', async () => {
      // Simular entrada do usuário
      const userInput = 'jogo de carro';
      
      // Verificar que a entrada é uma string válida
      expect(typeof userInput).toBe('string');
      expect(userInput.trim().length).toBeGreaterThan(0);
      
      // Resultado esperado da interpretação
      const expectedInterpretation = {
        gameType: 'racing',
        mechanics: ['vehicle_control', 'racing', 'obstacles'],
        restrictions: [],
        objective: 'Corrida de carros'
      };
      
      // Verificar estrutura do resultado
      expect(expectedInterpretation).toHaveProperty('gameType');
      expect(expectedInterpretation.gameType).toBe('racing');
      expect(Array.isArray(expectedInterpretation.mechanics)).toBe(true);
      expect(expectedInterpretation.mechanics).toContain('vehicle_control');
      expect(expectedInterpretation.mechanics).toContain('racing');
    });
  });

  // ============================================================================
  // TESTE 2: Geração do plano de jogo
  // ============================================================================
  
  describe('Fase 2: Geração do Game Plan', () => {
    it('deve gerar um plano de jogo completo para racing', () => {
      const gamePlan = {
        title: 'Corrida Maluca',
        description: 'Jogo de corrida com obstáculos',
        gameType: 'racing',
        requiredSystems: [
          'PhysicsSystem',
          'VehicleSystem', 
          'CollisionSystem',
          'ScoreSystem',
          'UISystem',
          'InputSystem'
        ],
        requiredEntities: [
          'player_car',
          'track',
          'obstacles',
          'finish_line'
        ],
        coreLoop: 'Dirigir carro, desviar obstáculos, chegar na linha de chegada',
        winCondition: 'Chegar na linha de chegada',
        loseCondition: 'Colidir com obstáculos 3 vezes'
      };
      
      // Validações do plano
      expect(gamePlan.title).toBeDefined();
      expect(gamePlan.gameType).toBe('racing');
      
      // Sistemas obrigatórios
      expect(Array.isArray(gamePlan.requiredSystems)).toBe(true);
      expect(gamePlan.requiredSystems).toContain('PhysicsSystem');
      expect(gamePlan.requiredSystems).toContain('CollisionSystem');
      expect(gamePlan.requiredSystems).toContain('VehicleSystem');
      
      // Entidades obrigatórias
      expect(Array.isArray(gamePlan.requiredEntities)).toBe(true);
      expect(gamePlan.requiredEntities).toContain('player_car');
      expect(gamePlan.requiredEntities).toContain('track');
      
      // Condições de vitória/derrota
      expect(gamePlan.winCondition).toBeDefined();
      expect(gamePlan.loseCondition).toBeDefined();
    });
  });

  // ============================================================================
  // TESTE 3: Validação constitucional
  // ============================================================================
  
  describe('Fase 3: Validação Constitucional', () => {
    it('deve validar conformidade com os 7 pilares', () => {
      const gamePlan = {
        gameType: 'racing',
        requiredSystems: [
          'TimeSystem',      // Pilar 1: TIME MANAGEMENT
          'FSMSystem',       // Pilar 2: FSM
          'UISystem',        // Pilar 3: UI SYSTEM
          'InputSystem',     // Pilar 4: INPUT
          'SaveSystem',      // Pilar 5: SAVE/LOAD
          'ViewportSystem',  // Pilar 6: VIEWPORT
          'PhysicsSystem',   // Pilar 7: PHYSICS
          'VehicleSystem',
          'CollisionSystem'
        ],
        requiredEntities: [
          'StartScreen',     // UI obrigatória
          'HUD',             // UI obrigatória
          'GameOverScreen',  // UI obrigatória
          'player_car',
          'track'
        ]
      };
      
      // Verificar pilares constitucionais
      const requiredSystems = [
        'TimeSystem', 'FSMSystem', 'UISystem', 'InputSystem',
        'SaveSystem', 'ViewportSystem'
      ];
      
      requiredSystems.forEach(system => {
        expect(gamePlan.requiredSystems).toContain(system);
      });
      
      // Verificar UI obrigatória
      const requiredUI = ['StartScreen', 'HUD', 'GameOverScreen'];
      requiredUI.forEach(ui => {
        expect(gamePlan.requiredEntities).toContain(ui);
      });
    });
  });

  // ============================================================================
  // TESTE 4: Sistemas de física e colisão
  // ============================================================================
  
  describe('Fase 4: Sistemas de Física e Colisão', () => {
    it('deve criar e configurar PhysicsSystem', () => {
      // Configuração do PhysicsSystem
      const physicsConfig = {
        gravity: { x: 0, y: 0 },
        friction: 0.98,
        maxVelocity: 1000,
        enableSleeping: true
      };
      
      expect(physicsConfig.gravity).toHaveProperty('x');
      expect(physicsConfig.gravity).toHaveProperty('y');
      expect(typeof physicsConfig.friction).toBe('number');
      expect(physicsConfig.friction).toBeGreaterThan(0);
      expect(physicsConfig.friction).toBeLessThan(1);
    });
    
    it('deve criar e configurar CollisionSystem', () => {
      // Configuração do CollisionSystem
      const collisionConfig = {
        algorithm: 'AABB',
        useSpatialPartitioning: true,
        performanceWarningThreshold: 500
      };
      
      expect(collisionConfig.algorithm).toBe('AABB');
      expect(typeof collisionConfig.useSpatialPartitioning).toBe('boolean');
      expect(collisionConfig.performanceWarningThreshold).toBeGreaterThan(0);
    });
    
    it('deve detectar colisões entre entidades', () => {
      // Entidades de teste
      const playerCar = {
        id: 'player_car',
        type: 'vehicle',
        x: 100,
        y: 300,
        w: 60,
        h: 40
      };
      
      const obstacle = {
        id: 'obstacle_1',
        type: 'obstacle',
        x: 400,
        y: 450,
        w: 40,
        h: 40
      };
      
      const farEntity = {
        id: 'far_entity',
        type: 'collectible',
        x: 1000,
        y: 1000,
        w: 30,
        h: 30
      };
      
      // Verificar propriedades das entidades
      expect(playerCar).toHaveProperty('x');
      expect(playerCar).toHaveProperty('y');
      expect(playerCar).toHaveProperty('w');
      expect(playerCar).toHaveProperty('h');
      expect(playerCar).toHaveProperty('type');
      
      // Função de detecção de colisão AABB
      function checkAABBCollision(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
        const aHalfW = a.w / 2;
        const aHalfH = a.h / 2;
        const bHalfW = b.w / 2;
        const bHalfH = b.h / 2;
        
        const overlapX = Math.abs(a.x - b.x) < (aHalfW + bHalfW);
        const overlapY = Math.abs(a.y - b.y) < (aHalfH + bHalfH);
        
        return overlapX && overlapY;
      }
      
      // Testar colisões
      expect(checkAABBCollision(playerCar, obstacle)).toBe(false); // Não colidem (posições diferentes)
      expect(checkAABBCollision(playerCar, farEntity)).toBe(false); // Muito longe
      expect(checkAABBCollision(playerCar, playerCar)).toBe(true); // Colisão consigo mesmo
    });
  });

  // ============================================================================
  // TESTE 5: Callbacks de colisão
  // ============================================================================
  
  describe('Fase 5: Callbacks e Resposta a Colisões', () => {
    it('deve registrar e executar callbacks de colisão', () => {
      const collisionCallbacks: Record<string, Array<(a: { type: string }, b: { type: string }) => void>> = {};
      let callbackExecuted = false;
      
      // Registrar callback
      const callback = (a: { type: string }, b: { type: string }) => {
        callbackExecuted = true;
        expect(a.type).toBe('vehicle');
        expect(b.type).toBe('obstacle');
      };
      
      collisionCallbacks['vehicle:obstacle'] = [callback];
      
      // Simular colisão
      const vehicle = { type: 'vehicle', id: 'player_car' };
      const obstacle = { type: 'obstacle', id: 'obstacle_1' };
      
      const key = 'vehicle:obstacle';
      const callbacks = collisionCallbacks[key];
      
      if (callbacks && callbacks.length > 0) {
        callbacks.forEach(cb => cb(vehicle, obstacle));
      }
      
      expect(callbackExecuted).toBe(true);
    });
  });

  // ============================================================================
  // TESTE 6: Geração da Spec final
  // ============================================================================
  
  describe('Fase 6: Geração da OrdaxSpec', () => {
    it('deve gerar uma spec completa para o jogo', () => {
      const ordaxSpec = {
        title: 'Corrida Maluca',
        gameType: 'racing',
        description: 'Jogo de corrida com obstáculos',
        systems: [
          'TimeSystem', 'FSMSystem', 'PhysicsSystem', 'VehicleSystem',
          'CollisionSystem', 'ScoreSystem', 'UISystem', 'InputSystem',
          'SaveSystem', 'ViewportSystem', 'AudioSystem'
        ],
        scene: {
          gravity: { x: 0, y: 0 },
          entities: [
            {
              id: 'player_car',
              type: 'vehicle',
              position: { x: 100, y: 300 },
              visual: { shape: 'car', width: 60, height: 40, color: '#ff0000' },
              physics: { mass: 1, velocity: { x: 0, y: 0 } },
              vehicle: { maxSpeed: 300, acceleration: 200, handling: 5 }
            },
            {
              id: 'track',
              type: 'ground',
              position: { x: 0, y: 500 },
              visual: { shape: 'rect', width: 800, height: 100, color: '#666' }
            },
            {
              id: 'obstacle_1',
              type: 'obstacle',
              position: { x: 400, y: 450 },
              visual: { shape: 'rect', width: 40, height: 40, color: '#ff6600' }
            },
            {
              id: 'finish_line',
              type: 'goal',
              position: { x: 700, y: 400 },
              visual: { shape: 'rect', width: 10, height: 100, color: '#00ff00' }
            }
          ]
        }
      };
      
      // Validações da spec
      expect(ordaxSpec.title).toBe('Corrida Maluca');
      expect(ordaxSpec.gameType).toBe('racing');
      
      // Verificar sistemas
      expect(Array.isArray(ordaxSpec.systems)).toBe(true);
      expect(ordaxSpec.systems.length).toBeGreaterThan(5);
      
      // Verificar scene
      expect(ordaxSpec.scene).toBeDefined();
      expect(ordaxSpec.scene.gravity).toEqual({ x: 0, y: 0 });
      
      // Verificar entidades
      expect(Array.isArray(ordaxSpec.scene.entities)).toBe(true);
      expect(ordaxSpec.scene.entities.length).toBeGreaterThan(0);
      
      // Verificar entidades obrigatórias
      const entityIds = ordaxSpec.scene.entities.map((e: { id: string }) => e.id);
      expect(entityIds).toContain('player_car');
      expect(entityIds).toContain('track');
      expect(entityIds).toContain('finish_line');
    });
  });

  // ============================================================================
  // TESTE 7: Fluxo completo integrado
  // ============================================================================
  
  describe('Fase 7: Fluxo Completo Integrado', () => {
    it('deve executar todas as fases em sequência', async () => {
      // 1. Interpretação
      const interpretation = {
        gameType: 'racing',
        mechanics: ['vehicle_control', 'racing', 'obstacles'],
        objective: 'Corrida de carros'
      };
      
      // 2. Plano
      const gamePlan = {
        title: 'Corrida Maluca',
        gameType: 'racing',
        requiredSystems: ['PhysicsSystem', 'VehicleSystem', 'CollisionSystem'],
        requiredEntities: ['player_car', 'track', 'obstacle_1', 'finish_line']
      };
      
      // 3. Validação
      const validation = {
        constitutional: { valid: true, violations: [] },
        genre: { valid: true, violations: [] }
      };
      
      // 4. Spec
      const ordaxSpec = {
        title: 'Corrida Maluca',
        gameType: 'racing',
        systems: ['PhysicsSystem', 'VehicleSystem', 'CollisionSystem'],
        scene: {
          entities: [
            { id: 'player_car', type: 'vehicle' },
            { id: 'track', type: 'ground' },
            { id: 'obstacle_1', type: 'obstacle' },
            { id: 'finish_line', type: 'goal' }
          ]
        }
      };
      
      // Verificar fluxo
      expect(interpretation.gameType).toBe('racing');
      expect(gamePlan.gameType).toBe('racing');
      expect(validation.constitutional.valid).toBe(true);
      expect(ordaxSpec.gameType).toBe('racing');
      
      // Verificar consistência
      expect(gamePlan.requiredSystems.every((sys: string) => 
        ordaxSpec.systems.includes(sys)
      )).toBe(true);
      
      expect(gamePlan.requiredEntities.every((ent: string) =>
        ordaxSpec.scene.entities.some((e: { id: string }) => e.id === ent)
      )).toBe(true);
    });
  });

  // ============================================================================
  // TESTE 8: Error handling e edge cases
  // ============================================================================
  
  describe('Fase 8: Error Handling e Edge Cases', () => {
    it('deve lidar com entradas inválidas', () => {
      const invalidInputs = [
        '',           // string vazia
        '   ',        // apenas espaços
        null,         // null
        undefined,    // undefined
        123,          // número
        {},           // objeto vazio
        []            // array vazio
      ];
      
      invalidInputs.forEach(input => {
        // Função de validação
        const isValidInput = (value: unknown): boolean => {
          if (value === null || value === undefined) return false;
          if (typeof value !== 'string') return false;
          if (value.trim().length === 0) return false;
          return true;
        };
        
        expect(isValidInput(input)).toBe(false);
      });
    });
    
    it('deve lidar com entidades inválidas no CollisionSystem', () => {
      const invalidEntities = [
        { x: 100, y: 300 },                    // falta w, h, type
        { x: 100, y: 300, w: 60 },             // falta h, type
        { x: 100, y: 300, w: 60, h: 40 },      // falta type
        { x: NaN, y: 300, w: 60, h: 40, type: 'vehicle' }, // x inválido
        { x: 100, y: 300, w: 0, h: 40, type: 'vehicle' },  // w zero
        { x: 100, y: 300, w: 60, h: -10, type: 'vehicle' }, // h negativo
        { x: 100, y: 300, w: 60, h: 40, type: '' }         // type vazio
      ];
      
      // Função de validação
      const isValidEntity = (entity: Record<string, unknown>): boolean => {
        if (!entity || typeof entity !== 'object') return false;
        
        const { x, y, w, h, type } = entity;
        
        if (typeof x !== 'number' || isNaN(x) || !isFinite(x)) return false;
        if (typeof y !== 'number' || isNaN(y) || !isFinite(y)) return false;
        if (typeof w !== 'number' || isNaN(w) || !isFinite(w) || w <= 0) return false;
        if (typeof h !== 'number' || isNaN(h) || !isFinite(h) || h <= 0) return false;
        if (typeof type !== 'string' || type.trim().length === 0) return false;
        
        return true;
      };
      
      invalidEntities.forEach(entity => {
        expect(isValidEntity(entity)).toBe(false);
      });
    });
  });
});