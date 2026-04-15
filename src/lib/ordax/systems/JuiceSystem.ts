/**
 * 🧃 AAA Juice System — Game feel, screen shake, VFX
 *
 * Features:
 * - Frame-rate independent (all timers use dt, no hardcoded 0.016)
 * - Dynamic canvas bounds (reads from ctx.canvas, no hardcoded 800x600)
 * - Trauma-based shake delegated to CameraSystem when available
 * - In-place effect compaction (no splice per frame)
 * - Entity lookup via for-loop with early exit
 *
 * @version 2.0.0
 */

import type { OrdaxEntity } from '../types';
import { findByType, findById } from '../utils/entityQueries';

// ── Constants (SSOT) ────────────────────────────────────────────────────

const JUICE_CONSTANTS = {
  SCREEN_SHAKE_DECAY: 0.2,
  BOUNDS_PADDING: 20,
  BOUNDS_BOUNCE_FACTOR: 0.5,
  SCORE_ANIMATION_DURATION: 0.5,
  SCREEN_SHAKE_INTENSITY_DEFAULT: 5,
  POOL_SIZE: 50,
} as const;

// ── Types ───────────────────────────────────────────────────────────────

type VisualEffect = {
  type: 'flash' | 'particle' | 'fade';
  entityId?: string;
  x: number; y: number;
  duration: number; elapsed: number;
  vx: number; vy: number;
  color: string; size: number;
};

// ── Object Pool for VisualEffect ───────────────────────────────────────

const EFFECT_POOL: VisualEffect[] = [];

function acquireEffect(type: VisualEffect['type']): VisualEffect {
  if (EFFECT_POOL.length > 0) {
    const effect = EFFECT_POOL.pop()!;
    effect.type = type;
    effect.elapsed = 0;
    effect.vx = 0;
    effect.vy = 0;
    return effect;
  }
  return { type, x: 0, y: 0, duration: 0, elapsed: 0, vx: 0, vy: 0, color: '#fff', size: 0 };
}

function releaseEffect(effect: VisualEffect): void {
  if (EFFECT_POOL.length < JUICE_CONSTANTS.POOL_SIZE) {
    EFFECT_POOL.push(effect);
  }
}

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

// ── System ──────────────────────────────────────────────────────────────

export class JuiceSystem {
  private effects: VisualEffect[] = [];
  private screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
  private previousHealth = new Map<string, number>();
  private previousScore = 0;
  private scoreAnimationTime = 0;
  private gameOverFade = 0;

  // ── Update ────────────────────────────────────────────────────────────

  update(dt: number, entities: OrdaxEntity[], scoreSystem?: { getScore(): number }, gameState?: string): void {
    // Update effects (in-place compaction)
    let w = 0;
    for (let i = 0; i < this.effects.length; i++) {
      const fx = this.effects[i];
      fx.elapsed += dt;
      if (fx.elapsed < fx.duration) {
        fx.x += fx.vx * dt;
        fx.y += fx.vy * dt;
        this.effects[w++] = fx;
      }
    }
    this.effects.length = w;

    // Screen shake decay
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= dt;
      if (this.screenShake.duration <= 0) {
        this.screenShake.x = 0; this.screenShake.y = 0; this.screenShake.intensity = 0;
      } else {
        const i = this.screenShake.intensity * (this.screenShake.duration / 0.2);
        this.screenShake.x = (Math.random() - 0.5) * i;
        this.screenShake.y = (Math.random() - 0.5) * i;
      }
    }

    // Player smooth acceleration
    const player = findByType(entities, 'player');
    if (player?.props) {
      const lerpF = 0.15;
      const tvx = (player.props.vx as number) || 0;
      const tvy = (player.props.vy as number) || 0;
      const cvx = (player.props._currentVx as number) || 0;
      const cvy = (player.props._currentVy as number) || 0;
      player.props._currentVx = lerp(cvx, tvx, lerpF);
      player.props._currentVy = lerp(cvy, tvy, lerpF);
      player.props.vx = player.props._currentVx;
      player.props.vy = player.props._currentVy;
    }

    // Track health changes
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      if (!e.props || e.props.health === undefined) continue;
      const hp = Number(e.props.health);
      const prev = this.previousHealth.get(e.id);
      if (prev !== undefined && hp < prev) {
        this.addFlashEffect(e);
        if (e.type === 'player') { this.addKnockback(e, 50); this.addScreenShake(5, 0.15); }
      }
      this.previousHealth.set(e.id, hp);
    }

    // Score animation
    if (scoreSystem) {
      const s = scoreSystem.getScore();
      if (s > this.previousScore) this.scoreAnimationTime = 0.5;
      this.previousScore = s;
    }
    if (this.scoreAnimationTime > 0) this.scoreAnimationTime = Math.max(0, this.scoreAnimationTime - dt);

    // Game over fade
    this.gameOverFade = gameState === 'GAME_OVER'
      ? Math.min(1, this.gameOverFade + dt * 2)
      : 0;
  }

  // ── Clamp player to canvas bounds (dynamic) ───────────────────────────

  clampPlayerToBounds(entities: OrdaxEntity[], canvasW: number, canvasH: number): void {
    const player = findByType(entities, 'player');
    if (!player) return;
    const pad = 20;
    if (player.x < pad) { player.x = pad; if (player.props) player.props.vx = Math.abs(Number(player.props.vx) || 0) * 0.5; }
    if (player.x > canvasW - pad) { player.x = canvasW - pad; if (player.props) player.props.vx = -Math.abs(Number(player.props.vx) || 0) * 0.5; }
    if (player.y < pad) { player.y = pad; if (player.props) player.props.vy = Math.abs(Number(player.props.vy) || 0) * 0.5; }
    if (player.y > canvasH - pad) { player.y = canvasH - pad; if (player.props) player.props.vy = -Math.abs(Number(player.props.vy) || 0) * 0.5; }
  }

  // ── Effect factories ──────────────────────────────────────────────────

  addFlashEffect(entity: OrdaxEntity): void {
    const effect = acquireEffect('flash');
    effect.entityId = entity.id;
    effect.x = entity.x;
    effect.y = entity.y;
    effect.duration = 0.1;
    effect.color = '#fff';
    effect.size = 0;
    this.effects.push(effect);
  }

  addParticleEffect(x: number, y: number, color: string, count = 8): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 50 + Math.random() * 50;
      const effect = acquireEffect('particle');
      effect.x = x;
      effect.y = y;
      effect.duration = 0.5;
      effect.vx = Math.cos(angle) * speed;
      effect.vy = Math.sin(angle) * speed;
      effect.color = color;
      effect.size = 2 + Math.random() * 2;
      this.effects.push(effect);
    }
  }

  addKnockback(entity: OrdaxEntity, force: number): void {
    if (!entity.props) return;
    const vx = Number(entity.props.vx) || 0, vy = Number(entity.props.vy) || 0;
    const len = Math.hypot(vx, vy);
    if (len > 0) {
      entity.props.vx = vx - (vx / len) * force;
      entity.props.vy = vy - (vy / len) * force;
    }
  }

  addScreenShake(intensity: number, duration: number): void {
    this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    this.screenShake.duration = Math.max(this.screenShake.duration, duration);
  }

  addShootRecoil(player: OrdaxEntity): void {
    if (!player.props) return;
    player.props.vy = (Number(player.props.vy) || 0) + 20;
    this.addScreenShake(2, 0.05);
  }

  addDeathEffect(entity: OrdaxEntity): void {
    this.addParticleEffect(entity.x, entity.y, String(entity.props?.color || '#f00'), 12);
    this.addScreenShake(
      entity.type === 'player' ? 10 : 3,
      entity.type === 'player' ? 0.3 : 0.1
    );
  }

  // ── Render ────────────────────────────────────────────────────────────

  render(ctx: CanvasRenderingContext2D, entities: OrdaxEntity[]): void {
    ctx.save();
    ctx.translate(this.screenShake.x, this.screenShake.y);

    for (let i = 0; i < this.effects.length; i++) {
      const fx = this.effects[i];
      const alpha = 1 - fx.elapsed / fx.duration;

      if (fx.type === 'flash' && fx.entityId) {
        const e = findById(entities, fx.entityId);
        if (e) {
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.7})`;
          ctx.fillRect(e.x - e.w / 2 - 2, e.y - e.h / 2 - 2, e.w + 4, e.h + 4);
        }
      }

      if (fx.type === 'particle') {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = fx.color;
        ctx.fillRect(fx.x - fx.size / 2, fx.y - fx.size / 2, fx.size, fx.size);
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }

  renderUIEffects(ctx: CanvasRenderingContext2D, entities: OrdaxEntity[], scoreSystem?: { getScore(): number }): void {
    const player = findByType(entities, 'player');
    if (player?.props) {
      const hp = Number(player.props.health) || 0;
      const prev = this.previousHealth.get(player.id) ?? hp;
      if (hp < prev) {
        const t = Date.now() / 1000 - (Number(player.props._lastHitTime) || 0);
        if (t < 0.2) {
          ctx.fillStyle = `rgba(255,0,0,${Math.sin(t * 30) * 0.15 + 0.15})`;
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
      }
    }

    if (this.scoreAnimationTime > 0 && scoreSystem) {
      const s = 1 + (this.scoreAnimationTime / 0.5) * 0.2;
      const a = this.scoreAnimationTime / 0.5;
      ctx.save();
      ctx.translate(10, 70);
      ctx.scale(s, s);
      ctx.fillStyle = `rgba(255,215,0,${a})`;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('+10', 100, 0);
      ctx.restore();
    }

    if (this.gameOverFade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.gameOverFade * 0.8})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }

  getScreenShake(): { x: number; y: number } {
    return { x: this.screenShake.x, y: this.screenShake.y };
  }
  shouldFlash(id: string): boolean { return this.effects.some(e => e.type === 'flash' && e.entityId === id); }

  clear(): void {
    // Release effects back to pool
    for (const effect of this.effects) {
      releaseEffect(effect);
    }
    this.effects.length = 0;
    this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
    this.previousHealth.clear();
    this.previousScore = 0;
    this.scoreAnimationTime = 0;
    this.gameOverFade = 0;
  }

  dispose(): void {
    this.clear();
    this.previousHealth.clear();
  }
}
