/**
 * FASE 11: Game Evolution Engine - Tests
 */

import { describe, it, expect } from 'vitest';
import type { GameGenome } from '../game-genome';
import {
  mutateGenome,
  scoreGenome,
  evolveGenomeSync,
  selectGenomes,
} from './index';

describe('Evolution Engine', () => {
  const mockGenome: GameGenome = {
    // Campos canônicos obrigatórios
    genre: 'topdown-shooter',
    themes: ['space', 'arcade'],
    difficulty: 'normal',
    speed: 'normal',
    boss: false,
    progression: {
      winCondition: 'score',
      winTarget: 1000,
      loseCondition: 'health',
      loseTarget: 0,
    },
    enemyTypes: [
      {
        archetype: 'basic',
        count: 10,
        behavior: 'chase',
      },
    ],
    mechanics: ['shooting', 'dodging'],
    ui: {
      hud: ['score', 'lives'],
      screens: ['start', 'gameover'],
    },

    // Campos legados usados pelo Evolution Engine
    player: {
      speed: 300,
      health: 100,
      damage: 10,
      fireRate: 0.5,
    },
    enemies: {
      spawnRate: 1.5,
      maxActive: 10,
      baseHealth: 50,
      baseSpeed: 150,
      baseDamage: 10,
      types: [
        { id: 'basic', health: 50, speed: 150, damage: 10 },
      ],
    },
    world: {
      bounds: { width: 800, height: 600 },
      gravity: 0,
      friction: 0.1,
    },
    rules: {
      difficulty: 0.5,
      winCondition: { type: 'score', score: 1000 },
      loseCondition: { type: 'lives', lives: 3 },
    },
    powerups: [],
    projectiles: [],
    obstacles: [],
    visual: {},
    version: '1.0.0-test',
    timestamp: Date.now(),
  };

  describe('mutateGenome', () => {
    it('deve gerar mutações válidas', () => {
      const { genome, mutations } = mutateGenome(mockGenome, 12345, 0.5);

      expect(mutations.length).toBeGreaterThan(0);
      expect(genome).toBeDefined();
      expect(genome).not.toBe(mockGenome); // Novo objeto
    });

    it('deve ser determinístico com seed', () => {
      const result1 = mutateGenome(mockGenome, 12345, 0.5);
      const result2 = mutateGenome(mockGenome, 12345, 0.5);

      expect(result1.mutations).toEqual(result2.mutations);
    });

    it('deve respeitar agressividade', () => {
      const low = mutateGenome(mockGenome, 12345, 0.1);
      const high = mutateGenome(mockGenome, 12345, 0.9);

      // Alta agressividade = mais mutações
      expect(high.mutations.length).toBeGreaterThanOrEqual(low.mutations.length);
    });

    it('nunca deve gerar valores negativos', () => {
      const { genome } = mutateGenome(mockGenome, 12345, 1.0);

      expect(genome.player?.speed).toBeGreaterThanOrEqual(0);
      expect(genome.player?.health).toBeGreaterThanOrEqual(0);
      expect(genome.enemies?.spawnRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('scoreGenome', () => {
    it('deve calcular score válido', () => {
      const score = scoreGenome(mockGenome);

      expect(score.total).toBeGreaterThanOrEqual(0);
      expect(score.total).toBeLessThanOrEqual(100);
      expect(score.breakdown.fun).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.difficulty).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.chaos).toBeGreaterThanOrEqual(0);
      expect(score.breakdown.readability).toBeGreaterThanOrEqual(0);
    });

    it('deve detectar penalidades', () => {
      const badGenome: GameGenome = {
        ...mockGenome,
        player: { ...mockGenome.player!, health: 5 }, // Muito fraco
      };

      const score = scoreGenome(badGenome);
      expect(score.penalties.length).toBeGreaterThan(0);
    });

    it('deve detectar bônus', () => {
      const goodGenome: GameGenome = {
        ...mockGenome,
        enemies: {
          ...mockGenome.enemies!,
          types: [
            { id: 'basic', health: 50, speed: 150, damage: 10 },
            { id: 'fast', health: 30, speed: 250, damage: 5 },
            { id: 'tank', health: 100, speed: 100, damage: 15 },
          ],
        },
      };

      const score = scoreGenome(goodGenome);
      expect(score.bonuses.length).toBeGreaterThan(0);
    });
  });

  describe('evolveGenomeSync', () => {
    it('deve gerar múltiplas variações', () => {
      const result = evolveGenomeSync(mockGenome, {
        generations: 5,
        aggressiveness: 0.5,
        seed: 12345,
      });

      expect(result.variants.length).toBe(5);
      expect(result.original).toEqual(mockGenome);
    });

    it('deve incluir scores em todas variações', () => {
      const result = evolveGenomeSync(mockGenome, {
        generations: 3,
        aggressiveness: 0.5,
      });

      result.variants.forEach(variant => {
        expect(variant.score).toBeDefined();
        expect(variant.score.total).toBeGreaterThanOrEqual(0);
        expect(variant.mutations.length).toBeGreaterThan(0);
      });
    });

    it('deve manter estatísticas', () => {
      const result = evolveGenomeSync(mockGenome, {
        generations: 10,
        aggressiveness: 0.5,
      });

      expect(result.stats.totalGenerated).toBe(10);
      expect(result.stats.validGenerated).toBe(10);
    });
  });

  describe('selectGenomes', () => {
    const variants = evolveGenomeSync(mockGenome, {
      generations: 10,
      aggressiveness: 0.5,
      seed: 12345,
    }).variants.map(v => ({ genome: v.genome, score: v.score }));

    it('deve selecionar top-k', () => {
      const selected = selectGenomes(variants, {
        strategy: 'top-k',
        count: 3,
      });

      expect(selected.length).toBe(3);
      
      // Deve estar ordenado por score
      for (let i = 0; i < selected.length - 1; i++) {
        expect(selected[i].score.total).toBeGreaterThanOrEqual(
          selected[i + 1].score.total
        );
      }
    });

    it('deve selecionar por roleta', () => {
      const selected = selectGenomes(variants, {
        strategy: 'roulette',
        count: 5,
        seed: 12345,
      });

      expect(selected.length).toBe(5);
    });

    it('deve selecionar por pareto', () => {
      const selected = selectGenomes(variants, {
        strategy: 'pareto',
        count: 5,
      });

      expect(selected.length).toBeGreaterThan(0);
      expect(selected.length).toBeLessThanOrEqual(5);
    });

    it('não deve selecionar mais que disponível', () => {
      const selected = selectGenomes(variants, {
        strategy: 'top-k',
        count: 100,
      });

      expect(selected.length).toBe(variants.length);
    });
  });

  describe('Garantias do Sistema', () => {
    it('nunca deve quebrar contratos', () => {
      const { genome } = mutateGenome(mockGenome, 12345, 1.0);

      // Estrutura básica mantida
      expect(genome.player).toBeDefined();
      expect(genome.enemies).toBeDefined();
      expect(genome.world).toBeDefined();
      expect(genome.rules).toBeDefined();
    });

    it('deve manter tipos corretos', () => {
      const { genome } = mutateGenome(mockGenome, 12345, 1.0);

      expect(typeof genome.player?.speed).toBe('number');
      expect(typeof genome.player?.health).toBe('number');
      expect(typeof genome.enemies?.spawnRate).toBe('number');
      expect(Array.isArray(genome.enemies?.types)).toBe(true);
    });

    it('evolução deve ser reproduzível', () => {
      const result1 = evolveGenomeSync(mockGenome, {
        generations: 5,
        aggressiveness: 0.5,
        seed: 99999,
      });

      const result2 = evolveGenomeSync(mockGenome, {
        generations: 5,
        aggressiveness: 0.5,
        seed: 99999,
      });

      expect(result1.variants.length).toBe(result2.variants.length);
      
      // Mesmas mutações
      for (let i = 0; i < result1.variants.length; i++) {
        expect(result1.variants[i].mutations).toEqual(
          result2.variants[i].mutations
        );
      }
    });
  });
});
