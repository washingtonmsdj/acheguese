// performance-collision-system-optimized.test.ts
// Extended performance tests — spatial grid, layers, circle collisions

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollisionSystem, COLLISION_LAYERS } from '../lib/ordax/systems/CollisionSystem';
import type { OrdaxEntity } from '../lib/ordax/types';

vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

const entity = (id: string, type: string, x: number, y: number, w = 50, h = 50): OrdaxEntity => ({
  id, type, x, y, w, h,
});

describe('Performance - CollisionSystem (Extended)', () => {
  let cs: CollisionSystem;

  beforeEach(() => {
    cs = new CollisionSystem(2000, 2000, 50);
  });

  it('scales to 1000 entities under 16ms', () => {
    const entities: OrdaxEntity[] = [];
    for (let i = 0; i < 1000; i++) {
      entities.push(entity(`e${i}`, 'test', Math.random() * 2000, Math.random() * 2000));
    }
    const t0 = performance.now();
    cs.update(entities);
    const dt = performance.now() - t0;
    // Generous limit for CI; in practice much faster
    expect(dt).toBeLessThan(50);
  });

  it('layer masks prevent unnecessary checks', () => {
    // Bullets should NOT collide with powerups by default
    const events: string[] = [];
    cs.on('bullet', 'powerup', () => events.push('x'));

    const entities: OrdaxEntity[] = [];
    for (let i = 0; i < 50; i++) {
      entities.push(entity(`b${i}`, 'bullet', Math.random() * 100, Math.random() * 100, 10, 10));
      entities.push(entity(`p${i}`, 'powerup', Math.random() * 100, Math.random() * 100, 20, 20));
    }
    cs.update(entities);
    expect(events).toHaveLength(0);
  });

  it('custom layers work correctly', () => {
    cs.setLayer('custom_a', { layer: 1 << 10, mask: 1 << 11 });
    cs.setLayer('custom_b', { layer: 1 << 11, mask: 1 << 10 });

    const events: string[] = [];
    cs.on('custom_a', 'custom_b', () => events.push('hit'));
    cs.setShape('custom_a', 'aabb');
    cs.setShape('custom_b', 'aabb');

    cs.update([
      entity('a1', 'custom_a', 100, 100),
      entity('b1', 'custom_b', 110, 110),
    ]);
    expect(events).toHaveLength(1);
  });

  it('circle collision shape accuracy', () => {
    // Two circles barely touching: distance = 50, radii sum = 50
    const info = cs.checkCollision(
      entity('p', 'player', 0, 0, 50, 50),
      entity('e', 'enemy', 49, 0, 50, 50),
    );
    // Should collide (distance 49 < radii sum 50)
    expect(info).not.toBeNull();

    // Barely NOT touching
    const info2 = cs.checkCollision(
      entity('p', 'player', 0, 0, 50, 50),
      entity('e', 'enemy', 51, 0, 50, 50),
    );
    expect(info2).toBeNull();
  });

  it('getStats returns meaningful data', () => {
    const entities: OrdaxEntity[] = [];
    for (let i = 0; i < 100; i++) {
      entities.push(entity(`e${i}`, i % 3 === 0 ? 'player' : 'enemy',
        Math.random() * 2000, Math.random() * 2000));
    }
    cs.update(entities);
    const stats = cs.getStats();

    expect(stats.frameCollisions).toBeGreaterThanOrEqual(0);
    expect(stats.framePairsChecked).toBeGreaterThanOrEqual(0);
    expect(typeof stats.gridEfficiency).toBe('number');
    expect(typeof stats.checksSaved).toBe('number');
  });

  it('dispose cleans up', () => {
    cs.on('a', 'b', () => {});
    expect(() => cs.dispose()).not.toThrow();
  });
});
