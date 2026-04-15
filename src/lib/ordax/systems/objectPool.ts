// objectPool.ts
// Object pooling utility to eliminate garbage collection spikes

// ============================================================================
// TYPES
// ============================================================================

export interface PoolStats {
  totalCreated: number;
  totalReused: number;
  currentSize: number;
  maxSize: number;
  hitRate: number; // 0-1
}

export interface PoolConfig<T> {
  create: () => T;
  reset?: (obj: T) => void;
  validate?: (obj: T) => boolean;
  maxSize?: number;
  initialSize?: number;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}

function validatePoolConfig<T>(config: unknown): PoolConfig<T> {
  if (!config || typeof config !== "object") {
    throw new Error("Pool config must be an object");
  }

  const c = config as Record<string, unknown>;

  if (typeof c.create !== "function") {
    throw new Error("create must be a function");
  }

  if (c.reset !== undefined && typeof c.reset !== "function") {
    throw new Error("reset must be a function if provided");
  }

  if (c.validate !== undefined && typeof c.validate !== "function") {
    throw new Error("validate must be a function if provided");
  }

  if (c.maxSize !== undefined && (!isValidNumber(c.maxSize) || c.maxSize < 1)) {
    throw new Error("maxSize must be a positive number");
  }

  if (c.initialSize !== undefined && (!isValidNumber(c.initialSize) || c.initialSize < 0)) {
    throw new Error("initialSize must be a non-negative number");
  }

  return {
    create: c.create as () => T,
    reset: c.reset as ((obj: T) => void) | undefined,
    validate: c.validate as ((obj: T) => boolean) | undefined,
    maxSize: c.maxSize as number | undefined,
    initialSize: c.initialSize as number | undefined,
  };
}

// ============================================================================
// OBJECT POOL
// ============================================================================

export class ObjectPool<T> {
  private pool: T[] = [];
  private config: PoolConfig<T>;
  private stats: PoolStats = {
    totalCreated: 0,
    totalReused: 0,
    currentSize: 0,
    maxSize: 0,
    hitRate: 0,
  };

  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================

  constructor(config: PoolConfig<T>) {
    try {
      this.config = validatePoolConfig<T>(config);
      this.initializePool();
    } catch (error) {
      throw error;
    }
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  private initializePool(): void {
    const initialSize = this.config.initialSize || 0;
    
    for (let i = 0; i < initialSize; i++) {
      const obj = this.config.create();
      this.pool.push(obj);
      this.stats.totalCreated++;
    }
    
    this.stats.currentSize = this.pool.length;
    this.stats.maxSize = this.config.maxSize || Infinity;
    this.updateStats();
  }

  // ==========================================================================
  // OBJECT MANAGEMENT
  // ==========================================================================

  acquire(): T {
    try {
      let obj: T;
      
      if (this.pool.length > 0) {
        // Reuse from pool
        obj = this.pool.pop()!;
        this.stats.totalReused++;
        
        // Reset if function provided
        if (this.config.reset) {
          this.config.reset(obj);
        }
      } else {
        // Create new object
        obj = this.config.create();
        this.stats.totalCreated++;
      }
      
      this.updateStats();
      return obj;
    } catch (error) {
      throw error;
    }
  }

  release(obj: T): void {
    try {
      // Validate object if function provided
      if (this.config.validate && !this.config.validate(obj)) {
        return;
      }
      
      // Check pool size limit
      if (this.pool.length >= this.stats.maxSize) {
        return;
      }
      
      // Reset if function provided
      if (this.config.reset) {
        this.config.reset(obj);
      }
      
      // Add back to pool
      this.pool.push(obj);
      this.updateStats();
    } catch {
      // Silent fail on release errors
    }
  }

  releaseAll(objects: T[]): void {
    for (const obj of objects) {
      this.release(obj);
    }
  }

  // ==========================================================================
  // BATCH OPERATIONS
  // ==========================================================================

  acquireBatch(count: number): T[] {
    const batch: T[] = [];
    
    for (let i = 0; i < count; i++) {
      batch.push(this.acquire());
    }
    
    return batch;
  }

  releaseBatch(objects: T[]): void {
    this.releaseAll(objects);
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  private updateStats(): void {
    this.stats.currentSize = this.pool.length;
    
    const totalOperations = this.stats.totalCreated + this.stats.totalReused;
    this.stats.hitRate = totalOperations > 0 
      ? this.stats.totalReused / totalOperations 
      : 0;
  }

  getStats(): PoolStats {
    return { ...this.stats };
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  clear(): void {
    this.pool = [];
    this.stats.totalCreated = 0;
    this.stats.totalReused = 0;
    this.updateStats();
  }

  getSize(): number {
    return this.pool.length;
  }

  getCapacity(): number {
    return this.stats.maxSize;
  }

  isFull(): boolean {
    return this.pool.length >= this.stats.maxSize;
  }

  isEmpty(): boolean {
    return this.pool.length === 0;
  }

  // ==========================================================================
  // DEBUG
  // ==========================================================================

  debugInfo(): string {
    const stats = this.getStats();
    return `[ObjectPool] Size: ${stats.currentSize}, Created: ${stats.totalCreated}, Reused: ${stats.totalReused}, Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  dispose(): void {
    this.clear();
  }
}

// ============================================================================
// PRE-CONFIGURED POOLS
// ============================================================================

export class ArrayPool<T> extends ObjectPool<T[]> {
  constructor(maxSize: number = 100) {
    super({
      create: () => [],
      reset: (arr) => {
        arr.length = 0; // Clear array efficiently
      },
      maxSize,
      initialSize: Math.floor(maxSize * 0.1), // 10% initial size
    });
  }
}

export class SetPool<T> extends ObjectPool<Set<T>> {
  constructor(maxSize: number = 50) {
    super({
      create: () => new Set<T>(),
      reset: (set) => {
        set.clear();
      },
      maxSize,
      initialSize: Math.floor(maxSize * 0.1),
    });
  }
}

export class MapPool<K, V> extends ObjectPool<Map<K, V>> {
  constructor(maxSize: number = 50) {
    super({
      create: () => new Map<K, V>(),
      reset: (map) => {
        map.clear();
      },
      maxSize,
      initialSize: Math.floor(maxSize * 0.1),
    });
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default ObjectPool;