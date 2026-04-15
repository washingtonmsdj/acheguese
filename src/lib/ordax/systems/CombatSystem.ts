/**
 * ⚔️ AAA Combat System — Invincibility frames, damage types, event-driven
 *
 * Features:
 * - i-frames (invincibility after hit) prevents damage spam
 * - Typed entity contract (no `any`)
 * - Configurable collision damage rules via a table (not hardcoded if/else)
 * - Event queue with callbacks for VFX/audio hooks
 * - Reverse-iteration removal (no splice + index shift bugs)
 *
 * @version 2.0.0
 */

import type { OrdaxEntity } from '../types';

// ── Types ───────────────────────────────────────────────────────────────

export type DamageEvent = {
  attackerId: string;
  targetId: string;
  damage: number;
  timestamp: number;
};

export type DamageCallback = (event: DamageEvent) => void;
export type DeathCallback = (entity: OrdaxEntity) => void;

// Collision damage rule: when entityA.type collides with entityB.type
type CollisionRule = {
  attackerType: string;
  targetType: string;
  damageKey: string;       // prop key on attacker to read damage from
  defaultDamage: number;
  removeAttacker: boolean; // e.g. bullet is removed on hit
};

// ── Default rules ───────────────────────────────────────────────────────

const DEFAULT_RULES: CollisionRule[] = [
  { attackerType: 'bullet', targetType: 'enemy',  damageKey: 'damage',        defaultDamage: 25, removeAttacker: true },
  { attackerType: 'enemy',  targetType: 'player', damageKey: 'contactDamage', defaultDamage: 10, removeAttacker: false },
  { attackerType: 'player', targetType: 'enemy',  damageKey: 'meleeDamage',   defaultDamage: 0,  removeAttacker: false },
];

// ── Constants ───────────────────────────────────────────────────────────

const I_FRAME_DURATION = 0.5; // seconds of invincibility after taking damage
const EVENT_RETENTION  = 5000; // ms to keep damage events
const MAX_EVENT_POOL_SIZE = 50;

// ── Object Pool for DamageEvent ─────────────────────────────────────────

const EVENT_POOL: DamageEvent[] = [];

function acquireDamageEvent(): DamageEvent {
  if (EVENT_POOL.length > 0) {
    return EVENT_POOL.pop()!;
  }
  return { attackerId: '', targetId: '', damage: 0, timestamp: 0 };
}

function releaseDamageEvent(event: DamageEvent): void {
  if (EVENT_POOL.length < MAX_EVENT_POOL_SIZE) {
    EVENT_POOL.push(event);
  }
}

// ── System ──────────────────────────────────────────────────────────────

export class CombatSystem {
  private damageEvents: DamageEvent[] = [];
  private entitiesToRemove = new Set<string>();
  private iFrames = new Map<string, number>(); // entityId → remaining i-frame time
  private rules: CollisionRule[];

  // Callbacks for VFX/audio hooks
  private onDamageCallbacks: DamageCallback[] = [];
  private onDeathCallbacks: DeathCallback[] = [];

  constructor(rules?: CollisionRule[]) {
    this.rules = rules ?? DEFAULT_RULES;
  }

  // ── Registration ──────────────────────────────────────────────────────

  onDamage(cb: DamageCallback): void { this.onDamageCallbacks.push(cb); }
  onDeath(cb: DeathCallback): void { this.onDeathCallbacks.push(cb); }

  // ── Update ────────────────────────────────────────────────────────────

  update(dt: number, entities: OrdaxEntity[]): void {
    // Tick i-frames
    for (const [id, remaining] of this.iFrames) {
      const next = remaining - dt;
      if (next <= 0) this.iFrames.delete(id);
      else this.iFrames.set(id, next);
    }

    // Prune old events
    const now = Date.now();
    let writeIdx = 0;
    for (let i = 0; i < this.damageEvents.length; i++) {
      if (now - this.damageEvents[i].timestamp < EVENT_RETENTION) {
        this.damageEvents[writeIdx++] = this.damageEvents[i];
      } else {
        // Release old event back to pool
        releaseDamageEvent(this.damageEvents[i]);
      }
    }
    this.damageEvents.length = writeIdx;

    // Check deaths
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      if (!e.props) continue;
      const hp = typeof e.props.health === 'number' ? e.props.health : undefined;
      if (hp !== undefined && hp <= 0) {
        e.props._justDied = true;
        this.entitiesToRemove.add(e.id);
        for (const cb of this.onDeathCallbacks) { try { cb(e); } catch { /* */ } }
      }
    }

    // Remove dead entities (reverse iteration)
    for (let i = entities.length - 1; i >= 0; i--) {
      if (this.entitiesToRemove.has(entities[i].id)) entities.splice(i, 1);
    }
    this.entitiesToRemove.clear();
  }

  // ── Collision-driven damage ───────────────────────────────────────────

  handleCollisionDamage(entityA: OrdaxEntity, entityB: OrdaxEntity): void {
    for (const rule of this.rules) {
      if (entityA.type === rule.attackerType && entityB.type === rule.targetType) {
        const dmg = typeof entityA.props?.[rule.damageKey] === 'number'
          ? entityA.props[rule.damageKey] as number
          : rule.defaultDamage;
        if (dmg > 0) {
          this.applyDamage(entityA, entityB, dmg);
        }
        if (rule.removeAttacker) this.markForRemoval(entityA.id);
      }
    }
  }

  // ── Apply damage (with i-frames) ──────────────────────────────────────

  applyDamage(attacker: OrdaxEntity, target: OrdaxEntity, damage: number): void {
    if (!target.props) return;

    // i-frame check
    if (this.iFrames.has(target.id)) return;

    const current = typeof target.props.health === 'number' ? target.props.health : 0;
    target.props.health = Math.max(0, current - damage);
    target.props._lastHitTime = Date.now() / 1000;

    // Grant i-frames to player
    if (target.type === 'player') {
      this.iFrames.set(target.id, I_FRAME_DURATION);
    }

    const event = acquireDamageEvent();
    event.attackerId = attacker.id;
    event.targetId = target.id;
    event.damage = damage;
    event.timestamp = Date.now();
    this.damageEvents.push(event);

    for (const cb of this.onDamageCallbacks) { try { cb(event); } catch { /* */ } }
  }

  markForRemoval(entityId: string): void { this.entitiesToRemove.add(entityId); }
  isMarkedForRemoval(entityId: string): boolean { return this.entitiesToRemove.has(entityId); }
  getDamageEvents(): DamageEvent[] { return this.damageEvents; }
  hasIFrames(entityId: string): boolean { return this.iFrames.has(entityId); }

  clear(): void {
    // Release events back to pool before clearing
    for (const event of this.damageEvents) {
      releaseDamageEvent(event);
    }
    this.damageEvents.length = 0;
    this.entitiesToRemove.clear();
    this.iFrames.clear();
  }
}
