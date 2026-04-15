/**
 * SpatialGrid — AAA-grade spatial partitioning for collision broad-phase.
 *
 * Key optimizations vs previous version:
 * - Lazy cell creation (no pre-allocation of empty cells)
 * - clear() just wipes maps instead of re-initializing grid
 * - No per-entity updateStats() — stats computed on demand
 * - No unnecessary padding in getEntityCells — entities only occupy their actual cells
 * - getCollisionCandidates uses flat loop with pair dedup via sorted-id string
 */

import type { OrdaxEntity } from "../types";

// Re-export the collidable constraint so other files can import from here
export interface CollidableEntity extends OrdaxEntity {
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
}

export interface GridConfig {
  cellSize: number;
  width: number;
  height: number;
}

export interface SpatialGridStats {
  totalCells: number;
  occupiedCells: number;
  entitiesPerCell: { min: number; max: number; avg: number };
  checksSaved: number;
  efficiency: number;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function cellKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

// ─── SpatialGrid ────────────────────────────────────────────────────────────

export class SpatialGrid {
  private cells = new Map<string, Set<CollidableEntity>>();
  private config: GridConfig;

  // Reusable sets to avoid per-frame alloc
  private _candidateSet = new Set<CollidableEntity>();
  private _pairSet = new Set<string>();
  // Reusable array for cell entity iteration (avoids Array.from allocation)
  private _cellEntityBuffer: CollidableEntity[] = [];

  private lastChecksSaved = 0;
  private lastEfficiency = 0;

  constructor(config: GridConfig) {
    if (!config || config.cellSize <= 0 || config.width <= 0 || config.height <= 0) {
      throw new Error("[SpatialGrid] Invalid config");
    }
    this.config = { ...config };
  }

  // ── Entity management ─────────────────────────────────────────────────────

  addEntity(entity: CollidableEntity): void {
    const cs = this.config.cellSize;
    const hw = entity.w / 2;
    const hh = entity.h / 2;

    const minCX = Math.floor((entity.x - hw) / cs);
    const maxCX = Math.floor((entity.x + hw) / cs);
    const minCY = Math.floor((entity.y - hh) / cs);
    const maxCY = Math.floor((entity.y + hh) / cs);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const key = cellKey(cx, cy);
        let set = this.cells.get(key);
        if (!set) {
          set = new Set();
          this.cells.set(key, set);
        }
        set.add(entity);
      }
    }
  }

  /**
   * Broad-phase: returns candidate collision pairs using spatial locality.
   * Avoids allocating per-entity candidate arrays — iterates cells directly.
   */
  getCollisionCandidates(entities: CollidableEntity[]): Array<[CollidableEntity, CollidableEntity]> {
    const pairs: Array<[CollidableEntity, CollidableEntity]> = [];
    const seen = this._pairSet;
    seen.clear();

    // For each cell that has >1 entity, test all pairs within
    for (const cellEntities of this.cells.values()) {
      if (cellEntities.size < 2) continue;

      // Copy to reusable buffer instead of Array.from (zero-allocation)
      const buffer = this._cellEntityBuffer;
      buffer.length = 0;
      for (const e of cellEntities) {
        buffer.push(e);
      }

      const len = buffer.length;
      for (let i = 0; i < len; i++) {
        const a = buffer[i];
        for (let j = i + 1; j < len; j++) {
          const b = buffer[j];
          const pairKey = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
          if (!seen.has(pairKey)) {
            seen.add(pairKey);
            pairs.push([a, b]);
          }
        }
      }
    }

    // Stats
    const bruteForce = (entities.length * (entities.length - 1)) / 2;
    this.lastChecksSaved = Math.max(0, bruteForce - pairs.length);
    this.lastEfficiency = bruteForce > 0 ? 1 - pairs.length / bruteForce : 0;

    return pairs;
  }

  /** Fast clear — just wipe maps, no re-init */
  clear(): void {
    this.cells.clear();
  }

  getConfig(): GridConfig {
    return { ...this.config };
  }

  getStats(): SpatialGridStats {
    let occupied = 0;
    let totalE = 0;
    let minE = Infinity;
    let maxE = 0;

    for (const set of this.cells.values()) {
      if (set.size > 0) {
        occupied++;
        totalE += set.size;
        if (set.size < minE) minE = set.size;
        if (set.size > maxE) maxE = set.size;
      }
    }

    const cols = Math.ceil(this.config.width / this.config.cellSize);
    const rows = Math.ceil(this.config.height / this.config.cellSize);

    return {
      totalCells: cols * rows,
      occupiedCells: occupied,
      entitiesPerCell: {
        min: occupied > 0 ? minE : 0,
        max: maxE,
        avg: occupied > 0 ? totalE / occupied : 0,
      },
      checksSaved: this.lastChecksSaved,
      efficiency: this.lastEfficiency,
    };
  }

  dispose(): void {
    this.cells.clear();
    this._candidateSet.clear();
    this._pairSet.clear();
    this._cellEntityBuffer.length = 0;
  }

  // ── Debug ─────────────────────────────────────────────────────────────────

  debugDraw(
    ctx: CanvasRenderingContext2D,
    options: { showGrid?: boolean; showEntities?: boolean; showStats?: boolean } = {},
  ): void {
    const { showGrid = true, showStats = true } = options;
    const cs = this.config.cellSize;

    if (showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      for (const [key, set] of this.cells) {
        const [cx, cy] = key.split(",").map(Number);
        const x = cx * cs;
        const y = cy * cs;
        ctx.strokeRect(x, y, cs, cs);
        if (set.size > 0) {
          ctx.fillStyle = `rgba(0,255,0,${Math.min(0.4, set.size / 8)})`;
          ctx.fillRect(x, y, cs, cs);
        }
      }
    }

    if (showStats) {
      const s = this.getStats();
      ctx.fillStyle = "white";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      const lines = [
        `Cells: ${s.occupiedCells}/${s.totalCells}`,
        `Eff: ${(s.efficiency * 100).toFixed(1)}%`,
        `Saved: ${s.checksSaved}`,
      ];
      let y = 20;
      for (const l of lines) {
        ctx.fillText(l, 10, y);
        y += 14;
      }
    }
  }
}

export default SpatialGrid;
