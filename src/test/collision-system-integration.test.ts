// collision-system-integration.test.ts
// Integration test for the AAA CollisionSystem

import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionSystem } from '../lib/ordax/systems/CollisionSystem';
import type { OrdaxEntity } from '../lib/ordax/types';

const entity = (id: string, type: string, x: number, y: number, w = 50, h = 50): OrdaxEntity => ({
  id, type, x, y, w, h,
});

describe('CollisionSystem - Integration', () => {
  let cs: CollisionSystem;

  beforeEach(() => {
    cs = new CollisionSystem(2000, 2000, 100);
  });

  // ── Instantiation ────────────────────────────────────────────────────────

  describe('Instantiation', () => {
    it('creates an instance', () => {
      expect(cs).toBeDefined();
      expect(cs).toBeInstanceOf(CollisionSystem);
    });
  });

  // ── Callback management ──────────────────────────────────────────────────

  describe('Callback Management', () => {
    it('registers and fires callbacks', () => {
      const events: string[] = [];
      cs.on('player', 'enemy', (a, b) => { events.push(`${a.type}→${b.type}`); });

      cs.update([
        entity('p1', 'player', 100, 100),
        entity('e1', 'enemy', 110, 110),
      ]);

      expect(events).toHaveLength(1);
      expect(events[0]).toBe('player→enemy');
    });

    it('fires both forward and reverse callbacks', () => {
      const events: string[] = [];
      cs.on('player', 'enemy', (a, b) => { events.push('fwd'); });
      cs.on('enemy', 'player', (a, b) => { events.push('rev'); });

      cs.update([
        entity('p1', 'player', 100, 100),
        entity('e1', 'enemy', 110, 110),
      ]);

      expect(events).toContain('fwd');
      expect(events).toContain('rev');
    });

    it('removes callbacks with off()', () => {
      const cb = () => {};
      cs.on('a', 'b', cb);
      cs.off('a', 'b', cb);
      // No throw on update
      expect(() => cs.update([])).not.toThrow();
    });

    it('clears all callbacks', () => {
      cs.on('a', 'b', () => {});
      cs.on('c', 'd', () => {});
      cs.clearCallbacks();
      // Should not fire any callbacks
      const events: string[] = [];
      cs.on('player', 'enemy', () => events.push('x'));
      // re-register after clear to confirm clear worked
      cs.clearCallbacks();
      cs.update([entity('p', 'player', 100, 100), entity('e', 'enemy', 110, 110)]);
      expect(events).toHaveLength(0);
    });
  });

  // ── AABB Collision detection ─────────────────────────────────────────────

  describe('AABB Collision Detection', () => {
    it('detects overlapping entities', () => {
      const info = cs.checkCollision(
        entity('a', 'wall', 100, 100, 50, 50),
        entity('b', 'wall', 125, 125, 50, 50),
      );
      expect(info).not.toBeNull();
    });

    it('does not detect separated entities', () => {
      const info = cs.checkCollision(
        entity('a', 'wall', 100, 100, 50, 50),
        entity('b', 'wall', 500, 500, 50, 50),
      );
      expect(info).toBeNull();
    });

    it('returns null for zero-dimension entities', () => {
      const info = cs.checkCollision(
        entity('a', 'wall', 100, 100, 0, 50),
        entity('b', 'wall', 100, 100, 50, 50),
      );
      expect(info).toBeNull();
    });
  });

  // ── Circle Collision detection ───────────────────────────────────────────

  describe('Circle Collision Detection', () => {
    it('detects overlapping circles (player vs enemy)', () => {
      // player and enemy default to circle shape
      const info = cs.checkCollision(
        entity('p', 'player', 100, 100, 40, 40),
        entity('e', 'enemy', 130, 100, 40, 40),
      );
      expect(info).not.toBeNull();
    });

    it('does not detect separated circles', () => {
      const info = cs.checkCollision(
        entity('p', 'player', 100, 100, 20, 20),
        entity('e', 'enemy', 200, 100, 20, 20),
      );
      expect(info).toBeNull();
    });
  });

  // ── Collision Info (MTV) ─────────────────────────────────────────────────

  describe('Collision Info and MTV', () => {
    it('provides MTV for AABB collision', () => {
      const info = cs.checkCollision(
        entity('a', 'wall', 100, 100, 50, 50),
        entity('b', 'wall', 130, 100, 50, 50),
      );
      expect(info).not.toBeNull();
      expect(info!.mtvX).not.toBe(0);
      expect(info!.distance).toBeGreaterThan(0);
    });

    it('provides MTV for circle collision', () => {
      const info = cs.checkCollision(
        entity('p', 'player', 100, 100, 40, 40),
        entity('e', 'enemy', 120, 100, 40, 40),
      );
      expect(info).not.toBeNull();
      expect(Math.abs(info!.mtvX) + Math.abs(info!.mtvY)).toBeGreaterThan(0);
    });
  });

  // ── Layer masks ──────────────────────────────────────────────────────────

  describe('Collision Layer Masks', () => {
    it('filters collisions by layer mask (bullet does NOT hit powerup)', () => {
      const events: string[] = [];
      cs.on('bullet', 'powerup', () => events.push('hit'));

      cs.update([
        entity('b', 'bullet', 100, 100, 10, 10),
        entity('p', 'powerup', 100, 100, 30, 30),
      ]);

      // bullet mask does NOT include POWERUP layer → should NOT fire
      expect(events).toHaveLength(0);
    });

    it('allows collisions matching layer mask (bullet hits enemy)', () => {
      const events: string[] = [];
      cs.on('bullet', 'enemy', () => events.push('hit'));

      cs.update([
        entity('b', 'bullet', 100, 100, 10, 10),
        entity('e', 'enemy', 100, 100, 30, 30),
      ]);

      expect(events).toHaveLength(1);
    });
  });

  // ── Update with many entities ────────────────────────────────────────────

  describe('Update with multiple entities', () => {
    it('returns correct collision count', () => {
      const entities = [
        entity('p', 'player', 100, 100),
        entity('e1', 'enemy', 120, 110),  // collides with player
        entity('e2', 'enemy', 500, 500),  // isolated
      ];
      const count = cs.update(entities);
      expect(count).toBe(1);
    });

    it('handles empty and single-entity arrays', () => {
      expect(cs.update([])).toBe(0);
      expect(cs.update([entity('a', 'player', 0, 0)])).toBe(0);
    });

    it('filters invalid entities (NaN, Infinity, zero dim)', () => {
      const entities = [
        entity('ok1', 'player', 100, 100),
        { id: 'bad', type: 'enemy', x: NaN, y: 100, w: 50, h: 50 } as OrdaxEntity,
        entity('ok2', 'enemy', 500, 500),
      ];
      // Should not throw
      expect(() => cs.update(entities)).not.toThrow();
    });

    it('skips spawner entities', () => {
      const entities = [
        entity('p', 'player', 100, 100),
        entity('sp', 'spawner', 100, 100, 0, 0),
      ];
      expect(cs.update(entities)).toBe(0);
    });
  });

  // ── Error resilience ─────────────────────────────────────────────────────

  describe('Error Resilience', () => {
    it('continues after a callback throws', () => {
      const results: string[] = [];
      cs.on('player', 'enemy', () => { throw new Error('boom'); });
      cs.on('player', 'enemy', () => { results.push('ok'); });

      expect(() => cs.update([
        entity('p', 'player', 100, 100),
        entity('e', 'enemy', 110, 110),
      ])).not.toThrow();

      expect(results).toContain('ok');
    });
  });

  // ── Performance ──────────────────────────────────────────────────────────

  describe('Performance', () => {
    it('handles 200 entities within 16ms frame budget', () => {
      const entities: OrdaxEntity[] = [];
      for (let i = 0; i < 200; i++) {
        entities.push(entity(`e${i}`, i % 2 === 0 ? 'player' : 'enemy',
          Math.random() * 2000, Math.random() * 2000, 50, 50));
      }
      const t0 = performance.now();
      cs.update(entities);
      const dt = performance.now() - t0;
      expect(dt).toBeLessThan(16);
    });

    it('spatial grid reduces checks vs brute force', () => {
      // Create 4 distant clusters of 25 entities each
      const entities: OrdaxEntity[] = [];
      for (let c = 0; c < 4; c++) {
        for (let i = 0; i < 25; i++) {
          entities.push(entity(`c${c}_e${i}`, 'enemy',
            c * 1000 + Math.random() * 100, 500 + Math.random() * 100, 50, 50));
        }
      }
      cs.update(entities);
      const stats = cs.getStats();
      expect(stats.checksSaved).toBeGreaterThan(0);
      expect(stats.gridEfficiency).toBeGreaterThan(0.5);
    });
  });

  // ── Cleanup ──────────────────────────────────────────────────────────────

  describe('Cleanup', () => {
    it('dispose does not throw', () => {
      cs.on('a', 'b', () => {});
      expect(() => cs.dispose()).not.toThrow();
    });
  });
});
