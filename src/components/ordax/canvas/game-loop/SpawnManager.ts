/**
 * SpawnManager - Handles spawning of enemies, asteroids, and powerups (DATA-DRIVEN)
 * 
 * ✅ REFATORADO: Agora 100% data-driven, lê configurações da spec
 * 
 * Responsibilities:
 * - Enemy spawning with wave-based difficulty
 * - Asteroid spawning
 * - Powerup spawning (shield, spread, etc)
 * - Enemy variants (scout, tank, sniper, etc)
 * - Spawn timing and rates
 */

import type { OrdaxEntity, SpawnerConfig } from "@/lib/ordax/types";

type SpawnType = { type: string; chance: number; [key: string]: unknown };
type SpawnVariant = { name: string; chance: number; [key: string]: unknown };
import { WORLD } from "../constants";

type Spawned = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  vx?: number;
  hp?: number;
  variant?: string;
  kind?: string;
  dead?: boolean;
};

type SpawnManagerParams = {
  dt: number;
  spawners: OrdaxEntity[];
  spawnTimerRef: React.MutableRefObject<number>;
  powerupTimerRef: React.MutableRefObject<number>;
  spawnedRef: React.MutableRefObject<Spawned[]>;
  buffsRef: React.MutableRefObject<{ shield: number; spread: number }>;
  hasScoreSystem: boolean;
  scoreSystemRef: React.MutableRefObject<any>;
  spawnerConfig?: SpawnerConfig; // ✅ NEW: Config from spec
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// ✅ NEW: Default config (fallback)
const DEFAULT_SPAWNER_CONFIG: Required<SpawnerConfig> = {
  spawnRate: 1.5,
  waveScoreInterval: 200,
  waveRateIncrease: 0.25,
  spawnTypes: [
    {
      type: "enemy",
      chance: 0.45,
      chancePerWave: 0.06,
      maxChance: 0.85,
      variants: [
        { name: "scout", chance: 0.55, size: 24, hp: 1, speed: 90, speedPerWave: 8, speedVariation: 35 },
        { name: "tank", chance: 0.30, size: 30, hp: 2, speed: 70, speedPerWave: 6, speedVariation: 20 },
        { name: "sniper", chance: 0.15, size: 22, hp: 1, speed: 85, speedPerWave: 7, speedVariation: 25, lateralSpeed: 60 }
      ]
    },
    {
      type: "asteroid",
      chance: 0.55,
      size: { base: 20, variation: 18 },
      hp: 1,
      speed: { base: 70, perWave: 6, variation: 30 }
    }
  ],
  powerups: {
    enabled: true,
    interval: 6.5,
    chance: 0.22,
    types: [
      { kind: "shield", chance: 0.5 },
      { kind: "spread", chance: 0.5 }
    ]
  }
};

export class SpawnManager {
  /**
   * Update spawners - spawn enemies, asteroids, and powerups (DATA-DRIVEN)
   */
  updateSpawners(params: SpawnManagerParams): void {
    const {
      dt,
      spawners,
      spawnTimerRef,
      powerupTimerRef,
      spawnedRef,
      buffsRef,
      hasScoreSystem,
      scoreSystemRef,
      spawnerConfig,
    } = params;

    if (spawners.length === 0) return;

    spawnTimerRef.current += dt;
    powerupTimerRef.current += dt;

    const sp = spawners[0];
    
    // ✅ CORREÇÃO: Ler config da spec ou usar default
    const config = spawnerConfig || DEFAULT_SPAWNER_CONFIG;
    const baseRate = config.spawnRate ?? DEFAULT_SPAWNER_CONFIG.spawnRate;
    const waveScoreInterval = config.waveScoreInterval ?? DEFAULT_SPAWNER_CONFIG.waveScoreInterval;
    const waveRateIncrease = config.waveRateIncrease ?? DEFAULT_SPAWNER_CONFIG.waveRateIncrease;

    // Waves + difficulty: scale by score
    const score = hasScoreSystem ? scoreSystemRef.current.getScore() : 0;
    const wave = 1 + Math.floor(score / waveScoreInterval);
    const rate = baseRate + wave * waveRateIncrease;
    const interval = 1 / rate;

    // Spawn enemies/asteroids
    if (spawnTimerRef.current >= interval) {
      spawnTimerRef.current = 0;
      const sx = sp.x + (Math.random() - 0.5) * sp.w;

      this.spawnObject(sx, wave, config as Required<SpawnerConfig>, spawnedRef);
    }

    // Powerups
    if (config.powerups?.enabled) {
      this.spawnPowerup(sp, powerupTimerRef, buffsRef, spawnedRef, config as Required<SpawnerConfig>);
    }
  }

  /**
   * Spawn an object (enemy, asteroid, etc) based on config
   */
  private spawnObject(
    sx: number,
    wave: number,
    config: SpawnerConfig,
    spawnedRef: React.MutableRefObject<Spawned[]>
  ): void {
    const spawnTypes = config.spawnTypes ?? DEFAULT_SPAWNER_CONFIG.spawnTypes;
    
    // Calculate total chance
    let totalChance = 0;
    const adjustedTypes = spawnTypes.map(st => {
      let chance = st.chance ?? 0;
      if (st.chancePerWave) {
        chance = Math.min(st.maxChance ?? 1, chance + wave * st.chancePerWave);
      }
      totalChance += chance;
      return { ...st, adjustedChance: chance };
    });

    // Normalize chances
    const normalizedTypes = adjustedTypes.map(st => ({
      ...st,
      normalizedChance: st.adjustedChance / totalChance
    }));

    // Pick a spawn type
    const roll = Math.random();
    let cumulative = 0;
    let selectedType: typeof normalizedTypes[0] | null = null;
    
    for (const st of normalizedTypes) {
      cumulative += st.normalizedChance;
      if (roll < cumulative) {
        selectedType = st;
        break;
      }
    }

    if (!selectedType) selectedType = normalizedTypes[0];

    // Spawn the object
    if (selectedType.variants && selectedType.variants.length > 0) {
      this.spawnVariant(sx, wave, selectedType, spawnedRef);
    } else {
      this.spawnSimple(sx, wave, selectedType, spawnedRef);
    }
  }

  /**
   * Spawn an object with variants (e.g., enemy with scout/tank/sniper)
   */
  private spawnVariant(
    sx: number,
    wave: number,
    spawnType: SpawnType & { adjustedChance: number; normalizedChance: number },
    spawnedRef: React.MutableRefObject<Spawned[]>
  ): void {
    const variants = spawnType.variants!;
    
    // Pick a variant
    const roll = Math.random();
    let cumulative = 0;
    let selectedVariant: SpawnVariant | null = null;
    
    for (const v of variants) {
      cumulative += v.chance;
      if (roll < cumulative) {
        selectedVariant = v;
        break;
      }
    }

    if (!selectedVariant) selectedVariant = variants[0];

    // Calculate speed
    const baseSpeed = selectedVariant.speed ?? 90;
    const speedPerWave = selectedVariant.speedPerWave ?? 0;
    const speedVariation = selectedVariant.speedVariation ?? 0;
    const speed = baseSpeed + wave * speedPerWave + Math.random() * speedVariation;

    // Calculate size
    const size = selectedVariant.size ?? 24;

    // Calculate HP
    const hp = selectedVariant.hp ?? 1;

    // Calculate lateral movement
    const lateralSpeed = selectedVariant.lateralSpeed ?? 0;
    const vx = lateralSpeed > 0
      ? (Math.random() < 0.5 ? -lateralSpeed : lateralSpeed)
      : (Math.random() - 0.5) * 90;

    spawnedRef.current.push({
      id: `spawn_${Date.now()}_${Math.random()}`,
      type: spawnType.type,
      x: clamp(sx, 0, WORLD.w),
      y: -30,
      w: size,
      h: size,
      vy: speed,
      vx,
      hp,
      variant: selectedVariant.name,
      dead: false,
    });
  }

  /**
   * Spawn a simple object (e.g., asteroid)
   */
  private spawnSimple(
    sx: number,
    wave: number,
    spawnType: SpawnType & { adjustedChance: number; normalizedChance: number },
    spawnedRef: React.MutableRefObject<Spawned[]>
  ): void {
    // Calculate speed
    let speed: number;
    if (typeof spawnType.speed === "object") {
      const base = spawnType.speed.base ?? 70;
      const perWave = spawnType.speed.perWave ?? 0;
      const variation = spawnType.speed.variation ?? 0;
      speed = base + wave * perWave + Math.random() * variation;
    } else {
      speed = spawnType.speed ?? 70;
    }

    // Calculate size
    let size: number;
    if (typeof spawnType.size === "object") {
      const base = spawnType.size.base ?? 20;
      const variation = spawnType.size.variation ?? 0;
      size = base + Math.random() * variation;
    } else {
      size = spawnType.size ?? 20;
    }

    // Calculate HP
    const hp = spawnType.hp ?? 1;

    spawnedRef.current.push({
      id: `spawn_${Date.now()}_${Math.random()}`,
      type: spawnType.type,
      x: clamp(sx, 0, WORLD.w),
      y: -30,
      w: size,
      h: size,
      vy: speed,
      vx: 0,
      hp,
      dead: false,
    });
  }

  /**
   * Spawn powerups
   */
  private spawnPowerup(
    sp: OrdaxEntity,
    powerupTimerRef: React.MutableRefObject<number>,
    buffsRef: React.MutableRefObject<{ shield: number; spread: number }>,
    spawnedRef: React.MutableRefObject<Spawned[]>,
    config: Required<SpawnerConfig>
  ): void {
    const powerupConfig = config.powerups!;
    const interval = powerupConfig.interval ?? 6.5;
    const chance = powerupConfig.chance ?? 0.22;

    // Only spawn if no active buffs
    const hasAnyBuff = buffsRef.current.shield > 0 || buffsRef.current.spread > 0;
    if (hasAnyBuff) return;

    if (powerupTimerRef.current >= interval && Math.random() < chance) {
      powerupTimerRef.current = 0;

      // Pick a powerup type
      const types = powerupConfig.types ?? [{ kind: "shield", chance: 0.5 }, { kind: "spread", chance: 0.5 }];
      const roll = Math.random();
      let cumulative = 0;
      let selectedKind = types[0].kind;

      for (const t of types) {
        cumulative += t.chance;
        if (roll < cumulative) {
          selectedKind = t.kind;
          break;
        }
      }

      spawnedRef.current.push({
        id: `pu_${Date.now()}`,
        type: "powerup",
        kind: selectedKind,
        x: clamp(sp.x + (Math.random() - 0.5) * sp.w, 30, WORLD.w - 30),
        y: -20,
        w: 20,
        h: 20,
        vy: 85,
        vx: (Math.random() - 0.5) * 40,
        dead: false,
      });
    }
  }

  /**
   * Update spawned objects - move and remove off-screen/dead objects
   */
  updateSpawnedObjects(
    dt: number,
    spawnedRef: React.MutableRefObject<Spawned[]>
  ): void {
    spawnedRef.current = spawnedRef.current.filter((e) => {
      e.y += e.vy * dt;
      if (e.vx) {
        e.x = clamp(e.x + e.vx * dt, 10, WORLD.w - 10);
        // Simple bounce to keep things on-screen
        if (e.x <= 10 || e.x >= WORLD.w - 10) e.vx *= -1;
      }
      return e.y < WORLD.h + 50 && !e.dead;
    });
  }
}
