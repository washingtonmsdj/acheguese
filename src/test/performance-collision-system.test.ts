// performance-collision-system.test.ts
// Performance benchmarks for CollisionSystem

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollisionSystem } from '../lib/ordax/systems/CollisionSystem';
import type { OrdaxEntity } from '../lib/ordax/types';

vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

const entity = (id: string, type: string, x: number, y: number, w = 50, h = 50): OrdaxEntity => ({
  id, type, x, y, w, h,
});

describe('Performance - CollisionSystem', () => {
  let cs: CollisionSystem;

  beforeEach(() => {
    cs = new CollisionSystem(2000, 2000, 100);
  });

  it('benchmarks different entity counts', () => {
    const volumes = [10, 50, 100, 200, 500];
    const results: Array<{ n: number; ms: number }> = [];

    for (const n of volumes) {
      const entities: OrdaxEntity[] = [];
      for (let i = 0; i < n; i++) {
        entities.push(entity(`e${i}`, 'test', Math.random() * 2000, Math.random() * 2000));
      }
      const t0 = performance.now();
      cs.update(entities);
      results.push({ n, ms: performance.now() - t0 });
    }

    // 500 entities should still be under 16ms
    const last = results[results.length - 1];
    expect(last.ms).toBeLessThan(16);
  });

  it('demonstrates stable frame times over 100 frames', () => {
    const entities: OrdaxEntity[] = [];
    for (let i = 0; i < 100; i++) {
      entities.push(entity(`e${i}`, 'test', Math.random() * 2000, Math.random() * 2000));
    }

    const times: number[] = [];
    for (let f = 0; f < 100; f++) {
      entities.forEach(e => { e.x += Math.random() * 2 - 1; e.y += Math.random() * 2 - 1; });
      const t0 = performance.now();
      cs.update(entities);
      times.push(performance.now() - t0);
    }

    const avg = times.reduce((a, b) => a + b) / times.length;
    const max = Math.max(...times);
    expect(avg).toBeLessThan(10);
    expect(max / Math.max(avg, 0.01)).toBeLessThan(50); // CI can have JIT warmup spikes
  });

  it('measures callback overhead', () => {
    const entities: OrdaxEntity[] = [];
    for (let i = 0; i < 100; i++) {
      entities.push(entity(`e${i}`, i % 2 === 0 ? 'player' : 'enemy',
        Math.random() * 2000, Math.random() * 2000));
    }

    // Without callbacks
    const t0 = performance.now();
    cs.update(entities);
    const noCallback = performance.now() - t0;

    // With callbacks
    let count = 0;
    cs.on('player', 'enemy', () => { count++; });
    const t1 = performance.now();
    cs.update(entities);
    const withCallback = performance.now() - t1;

    // Callback overhead should be modest
    expect(withCallback).toBeLessThan(noCallback * 5 + 1);

    cs.clearCallbacks();
  });

  it('handles slow callbacks gracefully', () => {
    cs.on('player', 'enemy', () => {
      const start = performance.now();
      while (performance.now() - start < 20) { /* block */ }
    });

    const entities = [
      entity('p', 'player', 100, 100),
      entity('e', 'enemy', 110, 110),
    ];

    // Should not throw
    expect(() => cs.update(entities)).not.toThrow();

    cs.clearCallbacks();
  });

  it('cluster scenario shows spatial grid efficiency', () => {
    const entities: OrdaxEntity[] = [];
    for (let c = 0; c < 4; c++) {
      for (let i = 0; i < 50; i++) {
        entities.push(entity(`c${c}_${i}`, 'test',
          c * 1000 + Math.random() * 100,
          500 + Math.random() * 100));
      }
    }

    cs.update(entities);
    const stats = cs.getStats();
    expect(stats.gridEfficiency).toBeGreaterThan(0.5);
    expect(stats.checksSaved).toBeGreaterThan(0);
  });
});
