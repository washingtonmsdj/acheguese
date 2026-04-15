import { WORLD, KEYS } from "./constants";
import { BIOMES } from "./biomes";
import { Pool } from "./pool";
import { KeyboardInput } from "./input";
import { aabbCircle, circleCircle, clamp, rand } from "./math";
import { UPGRADES, costFor } from "./upgrades";
// ✅ CORREÇÃO SSOT: Importar configs de gameplay
import {
  PLAYER_CONFIG,
  COMBAT_CONFIG,
  SPAWN_CONFIG,
  ENEMY_CONFIG,
  ENEMY_SHOOTING,
  SCORE_CONFIG,
  PICKUP_CONFIG,
  UPGRADE_CONFIG,
  PARTICLE_CONFIG,
  BOUNDS_CONFIG,
} from "./config/gameplay.config";
import type {
  BulletState,
  EnemyKind,
  EnemyState,
  GameInput,
  GamePhase,
  GameState,
  Particle,
  PickupState,
  PlayerState,
  UpgradeId,
} from "./types";

type HudSnapshot = {
  phase: GamePhase;
  biomeName: string;
  score: number;
  highScore: number;
  hp: number;
  shield: number;
  shieldMax: number;
  dashCd: number;
  specialCd: number;
  bombCount: number;
  energy: number;
  upgrades: { id: UpgradeId; name: string; level: number; cost: number; maxLevel: number }[];
  wave: number;
  bossActive: boolean;
  bossHp?: number;
  bossHpMax?: number;
};

export class StellarVanguardGame {
  private input = new KeyboardInput();
  private detachInput: (() => void) | null = null;

  private state: GameState;
  private player: PlayerState;

  private bullets = new Pool<BulletState>((id) => ({
    id,
    owner: "player",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    r: COMBAT_CONFIG.BULLET.baseRadius,
    dmg: COMBAT_CONFIG.BULLET.baseDamage,
    guided: false,
    alive: false,
  }));
  private enemies = new Pool<EnemyState>((id) => ({
    id,
    kind: "light",
    x: 0,
    y: 0,
    w: ENEMY_CONFIG.light.size,
    h: ENEMY_CONFIG.light.size,
    vx: 0,
    vy: 0,
    hp: ENEMY_CONFIG.light.hp,
    alive: false,
    phase: 0,
    t: 0,
  }));
  private pickups = new Pool<PickupState>((id) => ({
    id,
    kind: "energy",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    r: PICKUP_CONFIG.RADIUS,
    value: PICKUP_CONFIG.ENERGY_DROP.light,
    alive: false,
  }));
  private particles = new Pool<Particle>((id) => ({
    id,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 0,
    size: PARTICLE_CONFIG.MUZZLE.size,
    color: "hsl(0,0%,100%)",
    alive: false,
  }));

  private spawnT = 0;
  private enemyShotT = 0;
  private uiFlashT = 0;

  constructor() {
    this.state = {
      phase: "start",
      biome: "nebula",
      biomeTime: 0,
      score: 0,
      highScore: this.loadHighScore(),
      wave: 1,
      bossActive: false,
      bossDefeated: false,
    };

    this.player = this.createPlayer();
  }

  mount() {
    this.detachInput = this.input.attach();
  }

  unmount() {
    this.detachInput?.();
    this.detachInput = null;
  }

  getBiome() {
    return BIOMES[this.state.biome];
  }

  getAll() {
    return {
      player: this.player,
      enemies: this.enemies.all(),
      bullets: this.bullets.all(),
      pickups: this.pickups.all(),
      particles: this.particles.all(),
      state: this.state,
      uiFlashT: this.uiFlashT,
    };
  }

  getHud(): HudSnapshot {
    const biomeName = this.getBiome().name;
    const upgrades = UPGRADES.map((u) => {
      const level = this.player.upgrades[u.id] ?? 0;
      const cost = level >= u.maxLevel ? 0 : costFor(u.id, level, u.baseCost);
      return { id: u.id, name: u.name, level, cost, maxLevel: u.maxLevel };
    });
    const boss = this.enemies.all().find((e) => e.alive && e.kind === "boss");
    return {
      phase: this.state.phase,
      biomeName,
      score: this.state.score,
      highScore: this.state.highScore,
      hp: this.player.hp,
      shield: this.player.shield,
      shieldMax: this.player.shieldMax,
      dashCd: this.player.dashCd,
      specialCd: this.player.specialCd,
      bombCount: this.player.bombCount,
      energy: this.player.energy,
      upgrades,
      wave: this.state.wave,
      bossActive: this.state.bossActive,
      bossHp: boss?.hp,
      bossHpMax: boss ? this.bossMaxHp() : undefined,
    };
  }

  update(dt: number) {
    const input = this.input.getState();
    const startPressed = this.input.consumePress(["Enter"]);
    const restartPressed = this.input.consumePress(["r", "R", "Enter"]);

    if (this.state.phase === "start") {
      if (startPressed) {
        this.start();
      }
      return;
    }

    if (this.state.phase === "gameover") {
      if (restartPressed) {
        this.reset();
        this.start();
      }
      return;
    }

    // playing
    this.state.biomeTime += dt;
    this.uiFlashT = Math.max(0, this.uiFlashT - dt);

    this.player.iFrames = Math.max(0, this.player.iFrames - dt);
    this.player.dashCd = Math.max(0, this.player.dashCd - dt);
    this.player.specialCd = Math.max(0, this.player.specialCd - dt);
    this.player.fireCd = Math.max(0, this.player.fireCd - dt);
    if (this.player.dashTime > 0) this.player.dashTime = Math.max(0, this.player.dashTime - dt);

    // shield regen
    if ((this.player.upgrades.regen ?? 0) > 0 && this.player.shieldMax > 0) {
      const regen = UPGRADE_CONFIG.REGEN.baseAmount + (this.player.upgrades.regen ?? 0) * UPGRADE_CONFIG.REGEN.perLevel;
      this.player.shield = Math.min(this.player.shieldMax, this.player.shield + regen * dt);
    }

    this.handleMovement(input, dt);
    this.handleCombat(input, dt);
    this.handleSpawning(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updatePickups(dt);
    this.updateParticles(dt);
    this.handleCollisions();
    this.handleUpgradeHotbar();
  }

  private createPlayer(): PlayerState {
    const u: Record<UpgradeId, number> = {
      double_shot: 0,
      spread: 0,
      guided: 0,
      shield: 0,
      regen: 0,
      fire_rate: 0,
      special_cd: 0,
      bomb_plus: 0,
    };

    return {
      x: WORLD.w / 2,
      y: WORLD.h * PLAYER_CONFIG.INITIAL_Y_FACTOR,
      vx: 0,
      vy: 0,
      hp: PLAYER_CONFIG.BASE_HP,
      shield: 0,
      shieldMax: 0,
      iFrames: 0,
      dashCd: 0,
      dashTime: 0,
      specialCd: 0,
      bombCount: PLAYER_CONFIG.BASE_BOMBS,
      energy: 0,
      fireCd: 0,
      fireRate: PLAYER_CONFIG.BASE_FIRE_RATE,
      bulletSpeed: PLAYER_CONFIG.BASE_BULLET_SPEED,
      upgrades: u,
    };
  }

  private start() {
    this.state.phase = "playing";
  }

  private reset() {
    this.state = {
      ...this.state,
      phase: "start",
      biome: "nebula",
      biomeTime: 0,
      score: 0,
      wave: 1,
      bossActive: false,
      bossDefeated: false,
    };
    this.player = this.createPlayer();
    this.spawnT = 0;
    this.enemyShotT = 0;
    this.uiFlashT = 0;
    this.bullets.clear();
    this.enemies.clear();
    this.pickups.clear();
    this.particles.clear();
  }

  private handleMovement(input: GameInput, dt: number) {
    const speed = PLAYER_CONFIG.BASE_SPEED;
    let vx = 0;
    let vy = 0;
    if (input.left) vx -= 1;
    if (input.right) vx += 1;
    if (input.up) vy -= 1;
    if (input.down) vy += 1;
    const len = Math.hypot(vx, vy) || 1;
    vx /= len;
    vy /= len;

    // dash: burst + invencibilidade curta
    const dashPressed = this.input.consumePress(KEYS.dash);
    if (dashPressed && this.player.dashCd <= 0) {
      this.player.dashCd = PLAYER_CONFIG.DASH_COOLDOWN;
      this.player.dashTime = PLAYER_CONFIG.DASH_DURATION;
      this.player.iFrames = Math.max(this.player.iFrames, PLAYER_CONFIG.IFRAME_DURATION);
      this.emitBurst(this.player.x, this.player.y + PLAYER_CONFIG.DASH_BURST_OFFSET, PARTICLE_CONFIG.BURST_COUNT.dash, this.getBiome().theme.primary);
    }
    const dashMul = this.player.dashTime > 0 ? PLAYER_CONFIG.DASH_SPEED_MULTIPLIER : 1;
    this.player.x += vx * speed * dashMul * dt;
    this.player.y += vy * speed * dashMul * dt;
    this.player.x = clamp(this.player.x, PLAYER_CONFIG.EDGE_MARGIN.horizontal, WORLD.w - PLAYER_CONFIG.EDGE_MARGIN.horizontal);
    this.player.y = clamp(this.player.y, PLAYER_CONFIG.EDGE_MARGIN.vertical, WORLD.h - PLAYER_CONFIG.EDGE_MARGIN.vertical);
  }

  private handleCombat(input: GameInput, dt: number) {
    // shooting (hold)
    const fireRateBonus = (this.player.upgrades.fire_rate ?? 0) * COMBAT_CONFIG.FIRE_RATE_BONUS_PER_LEVEL;
    const fireRate = this.player.fireRate + fireRateBonus;
    const interval = fireRate > 0 ? 1 / fireRate : COMBAT_CONFIG.MIN_FIRE_INTERVAL;
    if (input.shoot && this.player.fireCd <= 0) {
      this.player.fireCd = interval;
      this.spawnPlayerShot("primary");
    }

    // special (press)
    const specialPressed = this.input.consumePress(KEYS.special);
    if (specialPressed && this.player.specialCd <= 0) {
      const lvl = this.player.upgrades.special_cd ?? 0;
      const cd = Math.max(COMBAT_CONFIG.SPECIAL_MIN_COOLDOWN, COMBAT_CONFIG.SPECIAL_BASE_COOLDOWN - lvl * COMBAT_CONFIG.SPECIAL_COOLDOWN_REDUCTION);
      this.player.specialCd = cd;
      this.spawnPlayerShot("special");
      this.emitBurst(this.player.x, this.player.y - PLAYER_CONFIG.SPECIAL_BURST_OFFSET, PARTICLE_CONFIG.BURST_COUNT.special, this.getBiome().theme.accent);
    }

    // bomb (press)
    const bombPressed = this.input.consumePress(KEYS.bomb);
    if (bombPressed && this.player.bombCount > 0) {
      this.player.bombCount -= 1;
      this.uiFlashT = COMBAT_CONFIG.BOMB_FLASH_DURATION;
      // clear enemy bullets + damage enemies
      for (const b of this.bullets.all()) {
        if (b.alive && b.owner === "enemy") b.alive = false;
      }
      for (const e of this.enemies.all()) {
        if (!e.alive) continue;
        e.hp -= e.kind === "boss" ? COMBAT_CONFIG.BOMB_BOSS_DAMAGE : COMBAT_CONFIG.BOMB_DAMAGE;
        if (e.hp <= 0) {
          e.alive = false;
          this.onEnemyKilled(e);
        }
      }
      this.emitBurst(WORLD.w / 2, WORLD.h / 2, PARTICLE_CONFIG.BURST_COUNT.bomb, this.getBiome().theme.gold);
    }
  }

  private spawnPlayerShot(kind: "primary" | "special") {
    const t = this.getBiome().theme;
    const guided = (this.player.upgrades.guided ?? 0) > 0;
    const double = (this.player.upgrades.double_shot ?? 0) > 0;
    const spreadLvl = this.player.upgrades.spread ?? 0;
    const bulletSpeed = this.player.bulletSpeed + (kind === "special" ? COMBAT_CONFIG.BULLET.specialSpeedBonus : 0);
    const dmg = kind === "special" ? COMBAT_CONFIG.BULLET.specialDamage : COMBAT_CONFIG.BULLET.baseDamage;

    const spawn = (dx: number, dy: number, vx: number, vy: number) => {
      this.bullets.spawn((b) => {
        b.owner = "player";
        b.x = this.player.x + dx;
        b.y = this.player.y + dy;
        b.vx = vx;
        b.vy = vy;
        b.r = kind === "special" ? COMBAT_CONFIG.BULLET.specialRadius : COMBAT_CONFIG.BULLET.baseRadius;
        b.dmg = dmg;
        b.guided = guided;
      });
      this.particles.spawn((p) => {
        p.x = this.player.x;
        p.y = this.player.y - PLAYER_CONFIG.MUZZLE_FLASH_OFFSET;
        p.vx = rand(PARTICLE_CONFIG.MUZZLE.velocity.x.min, PARTICLE_CONFIG.MUZZLE.velocity.x.max);
        p.vy = rand(PARTICLE_CONFIG.MUZZLE.velocity.y.min, PARTICLE_CONFIG.MUZZLE.velocity.y.max);
        p.maxLife = p.life = PARTICLE_CONFIG.MUZZLE.lifetime;
        p.size = PARTICLE_CONFIG.MUZZLE.size;
        p.color = kind === "special" ? t.accent : t.primary;
      });
    };

    if (spreadLvl > 0) {
      const spread = spreadLvl === 1 ? COMBAT_CONFIG.SPREAD.angle1 : COMBAT_CONFIG.SPREAD.angle2;
      const speedReduction = spreadLvl === 1 ? COMBAT_CONFIG.SPREAD.speedReduction.level1 : COMBAT_CONFIG.SPREAD.speedReduction.level2;
      spawn(0, -COMBAT_CONFIG.SPREAD.bulletSpawnOffsetY, -COMBAT_CONFIG.SPREAD.sideVelocity, -bulletSpeed * (1 - speedReduction));
      spawn(0, -COMBAT_CONFIG.SPREAD.bulletSpawnOffsetY, 0, -bulletSpeed);
      spawn(0, -COMBAT_CONFIG.SPREAD.bulletSpawnOffsetY, COMBAT_CONFIG.SPREAD.sideVelocity, -bulletSpeed * (1 - speedReduction));
      if (double) {
        spawn(-COMBAT_CONFIG.SPREAD.spreadOffset, -COMBAT_CONFIG.SPREAD.bulletSpawnOffsetY, 0, -bulletSpeed);
        spawn(COMBAT_CONFIG.SPREAD.spreadOffset, -COMBAT_CONFIG.SPREAD.bulletSpawnOffsetY, 0, -bulletSpeed);
      }
      return;
    }

    if (double) {
      spawn(-COMBAT_CONFIG.SPREAD.doubleOffset, -COMBAT_CONFIG.SPREAD.bulletSpawnOffsetY, 0, -bulletSpeed);
      spawn(COMBAT_CONFIG.SPREAD.doubleOffset, -COMBAT_CONFIG.SPREAD.bulletSpawnOffsetY, 0, -bulletSpeed);
      return;
    }
    spawn(0, -COMBAT_CONFIG.SPREAD.bulletSpawnOffsetY, 0, -bulletSpeed);
  }

  private handleSpawning(dt: number) {
    // wave scaling via score
    this.state.wave = 1 + Math.floor(this.state.score / SPAWN_CONFIG.WAVE_SCORE_INTERVAL);

    if (!this.state.bossActive && !this.state.bossDefeated && this.state.score >= SPAWN_CONFIG.BOSS_GATE_SCORE) {
      this.spawnBoss();
      this.state.bossActive = true;
      return;
    }

    if (this.state.bossActive) return;

    this.spawnT += dt;
    const rate = SPAWN_CONFIG.BASE_SPAWN_RATE + this.state.wave * SPAWN_CONFIG.WAVE_RATE_INCREASE;
    const interval = 1 / rate;
    if (this.spawnT < interval) return;
    this.spawnT = 0;

    const roll = Math.random();
    const kind: EnemyKind = roll < SPAWN_CONFIG.SPAWN_PROBABILITY.light ? "light" : roll < SPAWN_CONFIG.SPAWN_PROBABILITY.medium ? "medium" : "heavy";
    const x = rand(SPAWN_CONFIG.SPAWN_MARGIN, WORLD.w - SPAWN_CONFIG.SPAWN_MARGIN);
    const y = SPAWN_CONFIG.SPAWN_Y;
    const enemyCfg = ENEMY_CONFIG[kind];
    const baseVy = enemyCfg.baseSpeed;
    const vy = baseVy + this.state.wave * enemyCfg.speedPerWave;
    const w = enemyCfg.size;
    const h = w;
    const hp = enemyCfg.hp;
    const vx = rand(enemyCfg.velocityRange.min, enemyCfg.velocityRange.max);

    this.enemies.spawn((e) => {
      e.kind = kind;
      e.x = x;
      e.y = y;
      e.w = w;
      e.h = h;
      e.vx = vx;
      e.vy = vy;
      e.hp = hp;
      e.t = 0;
      e.phase = 0;
    });
  }

  private spawnBoss() {
    const hp = this.bossMaxHp();
    const bossCfg = ENEMY_CONFIG.boss;
    this.enemies.spawn((e) => {
      e.kind = "boss";
      e.x = WORLD.w / 2;
      e.y = ENEMY_CONFIG.boss.initialY;
      e.w = bossCfg.size.width;
      e.h = bossCfg.size.height;
      e.vx = 0;
      e.vy = bossCfg.entrySpeed;
      e.hp = hp;
      e.phase = 0;
      e.t = 0;
    });
  }

  private bossMaxHp() {
    return ENEMY_CONFIG.boss.baseHp;
  }

  private updateEnemies(dt: number) {
    this.enemyShotT += dt;
    const shootInterval = Math.max(ENEMY_SHOOTING.MIN_INTERVAL, ENEMY_SHOOTING.BASE_INTERVAL - this.state.wave * ENEMY_SHOOTING.INTERVAL_REDUCTION_PER_WAVE);

    const enemies = this.enemies.all();
    for (const e of enemies) {
      if (!e.alive) continue;
      e.t += dt;

      if (e.kind === "boss") {
        const bossCfg = ENEMY_CONFIG.boss;
        // enter then patrol
        if (e.y < bossCfg.entryY) {
          e.y += e.vy * dt;
        } else {
          e.y = bossCfg.entryY + Math.sin(e.t * bossCfg.patrolFrequency.y) * bossCfg.patrolAmplitude.y;
          e.x = WORLD.w / 2 + Math.sin(e.t * bossCfg.patrolFrequency.x) * bossCfg.patrolAmplitude.x;
        }

        // phases based on hp
        const hpPct = e.hp / this.bossMaxHp();
        e.phase = hpPct > bossCfg.phaseThresholds[0] ? 0 : hpPct > bossCfg.phaseThresholds[1] ? 1 : 2;

        // boss shooting
        if (this.enemyShotT >= shootInterval * ENEMY_SHOOTING.BOSS.intervalMultiplier) {
          this.enemyShotT = 0;
          this.spawnBossPattern(e);
        }
        continue;
      }

      // drift + bounce
      const enemyCfg = ENEMY_CONFIG[e.kind];
      e.x = clamp(e.x + e.vx * dt, enemyCfg.bounceMargin, WORLD.w - enemyCfg.bounceMargin);
      e.y += e.vy * dt;
      if (e.x <= enemyCfg.bounceMargin || e.x >= WORLD.w - enemyCfg.bounceMargin) e.vx *= -1;

      // enemy shooting (simple)
      if (this.enemyShotT >= shootInterval) {
        const enemyCfg = ENEMY_CONFIG[e.kind];
        if (Math.random() < enemyCfg.shootProbability) {
          this.spawnEnemyShot(e);
        }
      }

      // despawn offscreen
      if (e.y > WORLD.h + BOUNDS_CONFIG.ENEMY_DESPAWN_MARGIN) e.alive = false;
    }

    if (this.enemyShotT >= shootInterval) this.enemyShotT = 0;
  }

  private spawnEnemyShot(e: EnemyState) {
    if (e.kind === "boss") return; // Boss usa spawnBossPattern
    const dy = ENEMY_SHOOTING.BASE_BULLET_SPEED + this.state.wave * ENEMY_SHOOTING.SPEED_INCREASE_PER_WAVE;
    const enemyCfg = ENEMY_CONFIG[e.kind];
    const spread = enemyCfg.spreadCount;
    for (let i = 0; i < spread; i++) {
      const ang = spread === 1 ? Math.PI / 2 : Math.PI / 2 + (i - (spread - 1) / 2) * ENEMY_SHOOTING.SPREAD_ANGLE;
      const vx = Math.cos(ang) * dy;
      const vy = Math.sin(ang) * dy;
      this.bullets.spawn((b) => {
        b.owner = "enemy";
        b.x = e.x;
        b.y = e.y + e.h * ENEMY_CONFIG[e.kind].shootOffsetY;
        b.vx = vx;
        b.vy = vy;
        b.r = ENEMY_SHOOTING.BULLET_RADIUS;
        b.dmg = ENEMY_SHOOTING.DAMAGE[e.kind] ?? ENEMY_SHOOTING.DAMAGE.light;
        b.guided = false;
      });
    }
  }

  private spawnBossPattern(boss: EnemyState) {
    const phase = boss.phase ?? 0;
    const bossCfg = ENEMY_SHOOTING.BOSS;
    const speed = bossCfg.bulletSpeed;
    if (phase === 0) {
      // cone
      const pattern = bossCfg.patterns.cone;
      for (let i = -2; i <= 2; i++) {
        const ang = Math.PI / 2 + i * pattern.angleSpread;
        this.spawnBossBullet(boss, Math.cos(ang) * speed, Math.sin(ang) * speed, bossCfg.baseDamage);
      }
      return;
    }
    if (phase === 1) {
      // ring burst
      const pattern = bossCfg.patterns.ring;
      for (let i = 0; i < pattern.count; i++) {
        const ang = (i / pattern.count) * Math.PI * 2;
        this.spawnBossBullet(boss, Math.cos(ang) * (speed * pattern.speedMultiplier), Math.sin(ang) * (speed * pattern.speedMultiplier), bossCfg.baseDamage);
      }
      return;
    }
    // phase 2: aimed + side shots
    const pattern = bossCfg.patterns.aimed;
    const dx = this.player.x - boss.x;
    const dy = this.player.y - boss.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    this.spawnBossBullet(boss, ux * (speed * pattern.speedMultiplier), uy * (speed * pattern.speedMultiplier), bossCfg.increasedDamage);
    this.spawnBossBullet(boss, -pattern.sideSpeed.x, pattern.sideSpeed.y, bossCfg.baseDamage);
    this.spawnBossBullet(boss, pattern.sideSpeed.x, pattern.sideSpeed.y, bossCfg.baseDamage);
  }

  private spawnBossBullet(boss: EnemyState, vx: number, vy: number, dmg: number) {
    this.bullets.spawn((b) => {
      b.owner = "enemy";
      b.x = boss.x;
      b.y = boss.y + boss.h * 0.5;
      b.vx = vx;
      b.vy = vy;
      b.r = ENEMY_SHOOTING.BOSS.bulletRadius;
      b.dmg = dmg;
      b.guided = false;
    });
  }

  private updateBullets(dt: number) {
    const enemies = this.enemies.all().filter((e) => e.alive);
    for (const b of this.bullets.all()) {
      if (!b.alive) continue;

      // simple guidance: nudge toward nearest enemy
      if (b.owner === "player" && b.guided) {
        const target = nearestEnemy(enemies, b.x, b.y);
        if (target) {
          const dx = target.x - b.x;
          const dy = target.y - b.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          b.vx = b.vx * (1 - COMBAT_CONFIG.BULLET.guidanceStrength) + ux * COMBAT_CONFIG.BULLET.guidanceSpeed * COMBAT_CONFIG.BULLET.guidanceStrength;
          b.vy = b.vy * (1 - COMBAT_CONFIG.BULLET.guidanceStrength) + uy * COMBAT_CONFIG.BULLET.guidanceSpeed * COMBAT_CONFIG.BULLET.guidanceStrength;
        }
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y < -BOUNDS_CONFIG.DESPAWN_MARGIN || b.y > WORLD.h + BOUNDS_CONFIG.DESPAWN_MARGIN || b.x < -BOUNDS_CONFIG.DESPAWN_MARGIN || b.x > WORLD.w + BOUNDS_CONFIG.DESPAWN_MARGIN) {
        b.alive = false;
      }
    }
  }

  private updatePickups(dt: number) {
    for (const p of this.pickups.all()) {
      if (!p.alive) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += PICKUP_CONFIG.GRAVITY * dt;
      if (p.y > WORLD.h + BOUNDS_CONFIG.ENEMY_DESPAWN_MARGIN) p.alive = false;
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles.all()) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= PARTICLE_CONFIG.GENERAL.damping;
      p.vy *= PARTICLE_CONFIG.GENERAL.damping;
    }
  }

  private handleCollisions() {
    // bullets -> enemies
    for (const b of this.bullets.all()) {
      if (!b.alive || b.owner !== "player") continue;
      for (const e of this.enemies.all()) {
        if (!e.alive) continue;
        if (aabbCircle(e.x, e.y, e.w, e.h, b.x, b.y, b.r)) {
          b.alive = false;
          e.hp -= b.dmg;
          this.emitHit(b.x, b.y);
          if (e.hp <= 0) {
            e.alive = false;
            this.onEnemyKilled(e);
          }
          break;
        }
      }
    }

    // enemy bullets -> player
    for (const b of this.bullets.all()) {
      if (!b.alive || b.owner !== "enemy") continue;
      if (this.player.iFrames > 0) continue;
      if (circleCircle(this.player.x, this.player.y, 12, b.x, b.y, b.r)) {
        b.alive = false;
        this.applyDamage(b.dmg);
        this.emitHit(this.player.x, this.player.y);
      }
    }

    // enemies -> player
    for (const e of this.enemies.all()) {
      if (!e.alive || e.kind === "boss") continue;
      if (this.player.iFrames > 0) continue;
      // treat player as circle
      if (aabbCircle(e.x, e.y, e.w, e.h, this.player.x, this.player.y, PLAYER_CONFIG.COLLISION_RADIUS)) {
        e.alive = false;
        this.applyDamage(COMBAT_CONFIG.COLLISION_DAMAGE[e.kind] ?? COMBAT_CONFIG.COLLISION_DAMAGE.light);
        this.emitBurst(e.x, e.y, PARTICLE_CONFIG.BURST_COUNT.enemyCollision, this.getBiome().theme.accent);
      }
    }

    // pickups -> player
    for (const p of this.pickups.all()) {
      if (!p.alive) continue;
      if (circleCircle(this.player.x, this.player.y, PLAYER_CONFIG.PICKUP_RADIUS, p.x, p.y, p.r)) {
        p.alive = false;
        this.player.energy += p.value;
        this.state.score += SCORE_CONFIG.PICKUP_COLLECTED;
        this.emitBurst(p.x, p.y, 12, this.getBiome().theme.gold);
      }
    }

    // boss defeated
    if (this.state.bossActive) {
      const boss = this.enemies.all().find((e) => e.alive && e.kind === "boss");
      if (!boss) {
        this.state.bossActive = false;
        this.state.bossDefeated = true;
        this.state.score += SCORE_CONFIG.BOSS_DEFEATED_BONUS;
        this.emitBurst(WORLD.w / 2, ENEMY_CONFIG.boss.entryY, PARTICLE_CONFIG.BURST_COUNT.bossDefeat, this.getBiome().theme.primary);
      }
    }
  }

  private onEnemyKilled(e: EnemyState) {
    const t = this.getBiome().theme;
    const base = SCORE_CONFIG.ENEMY_KILL[e.kind] ?? SCORE_CONFIG.ENEMY_KILL.light;
    this.state.score += base;

    // energy drop
    const drop = PICKUP_CONFIG.ENERGY_DROP[e.kind] ?? PICKUP_CONFIG.ENERGY_DROP.light;
    this.pickups.spawn((p) => {
      p.kind = "energy";
      p.x = e.x;
      p.y = e.y;
      p.vx = rand(PICKUP_CONFIG.INITIAL_VELOCITY.x.min, PICKUP_CONFIG.INITIAL_VELOCITY.x.max);
      p.vy = rand(PICKUP_CONFIG.INITIAL_VELOCITY.y.min, PICKUP_CONFIG.INITIAL_VELOCITY.y.max);
      p.r = PICKUP_CONFIG.RADIUS;
      p.value = drop;
    });

    const burstCount = e.kind === "heavy" ? PARTICLE_CONFIG.BURST_COUNT.enemyHeavy : PARTICLE_CONFIG.BURST_COUNT.enemyLight;
    this.emitBurst(e.x, e.y, burstCount, t.accent);
  }

  private emitHit(x: number, y: number) {
    const t = this.getBiome().theme;
    this.particles.spawn((p) => {
      p.x = x;
      p.y = y;
      p.vx = rand(PARTICLE_CONFIG.HIT.velocity.min, PARTICLE_CONFIG.HIT.velocity.max);
      p.vy = rand(PARTICLE_CONFIG.HIT.velocity.min, PARTICLE_CONFIG.HIT.velocity.max);
      p.maxLife = p.life = PARTICLE_CONFIG.HIT.lifetime;
      p.size = PARTICLE_CONFIG.HIT.size;
      p.color = t.primary;
    });
  }

  private emitBurst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      this.particles.spawn((p) => {
        p.x = x;
        p.y = y;
        p.vx = rand(PARTICLE_CONFIG.BURST.velocity.min, PARTICLE_CONFIG.BURST.velocity.max);
        p.vy = rand(PARTICLE_CONFIG.BURST.velocity.min, PARTICLE_CONFIG.BURST.velocity.max);
        p.maxLife = p.life = rand(PARTICLE_CONFIG.BURST.lifetime.min, PARTICLE_CONFIG.BURST.lifetime.max);
        p.size = rand(PARTICLE_CONFIG.BURST.size.min, PARTICLE_CONFIG.BURST.size.max);
        p.color = color;
      });
    }
  }

  private applyDamage(amount: number) {
    // iFrames
    this.player.iFrames = COMBAT_CONFIG.DAMAGE_IFRAME_DURATION;

    // shield first
    if (this.player.shield > 0) {
      const absorbed = Math.min(this.player.shield, amount);
      this.player.shield = Math.max(0, this.player.shield - absorbed);
      amount -= absorbed;
      if (amount <= 0) return;
    }
    this.player.hp = Math.max(0, this.player.hp - amount);
    if (this.player.hp <= 0) {
      this.onGameOver();
    }
  }

  private onGameOver() {
    this.state.phase = "gameover";
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      this.saveHighScore(this.state.highScore);
    }
  }

  private handleUpgradeHotbar() {
    // Compra rápida 1..8
    const digits = ["1","2","3","4","5","6","7","8"] as const;
    for (let i = 0; i < digits.length; i++) {
      if (this.input.consumePress([digits[i]])) {
        const up = UPGRADES[i];
        if (!up) return;
        this.tryBuyUpgrade(up.id);
      }
    }
  }

  private tryBuyUpgrade(id: UpgradeId) {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return;
    const current = this.player.upgrades[id] ?? 0;
    if (current >= def.maxLevel) return;
    const cost = costFor(id, current, def.baseCost);
    if (this.player.energy < cost) return;
    this.player.energy -= cost;
    this.player.upgrades[id] = current + 1;
    this.uiFlashT = 0.18;

    // apply effects
    if (id === "shield") {
      this.player.shieldMax = UPGRADE_CONFIG.SHIELD.baseAmount + (this.player.upgrades.shield ?? 0) * UPGRADE_CONFIG.SHIELD.perLevel;
      this.player.shield = Math.max(this.player.shield, this.player.shieldMax);
    }
    if (id === "bomb_plus") {
      // cap bombs for MVP
      const extra = this.player.upgrades.bomb_plus ?? 0;
      this.player.bombCount = Math.min(UPGRADE_CONFIG.BOMB_PLUS.maxBombs, PLAYER_CONFIG.BASE_BOMBS + extra);
    }
  }

  private loadHighScore(): number {
    try {
      const raw = localStorage.getItem("stellar_vanguard_highscore");
      const n = raw ? Number(raw) : 0;
      return Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  }

  private saveHighScore(v: number) {
    try {
      localStorage.setItem("stellar_vanguard_highscore", String(v));
    } catch {
      // ignore
    }
  }
}

function nearestEnemy(enemies: EnemyState[], x: number, y: number): EnemyState | null {
  let best: EnemyState | null = null;
  let bestD = Infinity;
  for (const e of enemies) {
    if (!e.alive) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}
