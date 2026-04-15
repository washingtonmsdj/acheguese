/**
 * useCollisionSetup - Hook para setup de callbacks de colisão
 * 
 * Extrai toda a lógica de setup de colisões do componente principal,
 * seguindo SSOT (Single Source of Truth) e sem gambiarras.
 */

import { useCallback } from "react";
import { CollisionSystem } from "@/lib/ordax/systems/CollisionSystem";
import { ParticleSystem } from "@/lib/ordax/systems/ParticleSystem";
import { ScoreSystem } from "@/lib/ordax/systems/ScoreSystem";
import { CameraSystem } from "@/lib/ordax/systems/CameraSystem";
import { AISystem } from "@/lib/ordax/systems/AISystem";
import type { OrdaxVisualTheme } from "@/lib/ordax/types";
import type { Spawned, Bullet, AudioSfxId, Buffs } from "../../ordaxCanvasTypes";
import {
  DAMAGE_CONFIG,
  SCORE_CONFIG,
  PARTICLE_CONFIG,
  CAMERA_CONFIG,
  ENEMY_CONFIG,
  BUFFS_CONFIG,
  COLORS_CONFIG,
} from "../../ordaxCanvasConfig";
import { validateEntityId, normalizeColor } from "../../ordaxCanvasUtils";

export type CollisionSetupContext = {
  hasCollisionSystem: boolean;
  hasParticleSystem: boolean;
  hasScoreSystem: boolean;
  hasCameraSystem: boolean;
  hasAISystem: boolean;
  collisionSystemRef: React.MutableRefObject<CollisionSystem>;
  particleSystemRef: React.MutableRefObject<ParticleSystem>;
  scoreSystemRef: React.MutableRefObject<ScoreSystem>;
  cameraSystemRef: React.MutableRefObject<CameraSystem>;
  spawnedRef: React.MutableRefObject<Spawned[]>;
  bulletsRef: React.MutableRefObject<Bullet[]>;
  theme: OrdaxVisualTheme | undefined;
  applyDamage: (amount: number) => void;
  applyBuffs: (kind: string) => void;
  playSfx: (id: AudioSfxId) => void;
};

export function useCollisionSetup() {
  const setupCollisionCallbacks = useCallback((ctx: CollisionSetupContext) => {
    if (!ctx.hasCollisionSystem) return;

    const collision = ctx.collisionSystemRef.current;

    // Player vs Enemy collision
    collision.on("player", "enemy", (player, enemy, _info) => {
      if (!validateEntityId(enemy.id)) return;

      const spawned = ctx.spawnedRef.current.find((s) => s.id === enemy.id);
      if (spawned && !spawned.dead) {
        spawned.dead = true;
        ctx.applyDamage(DAMAGE_CONFIG.ENEMY_COLLISION);

        if (ctx.hasParticleSystem) {
          const particleColor = normalizeColor(ctx.theme?.accent, COLORS_CONFIG.PARTICLE.ENEMY);
          ctx.particleSystemRef.current.emit(enemy.x, enemy.y, PARTICLE_CONFIG.COUNT.ENEMY_HIT, {
            life: PARTICLE_CONFIG.LIFE.ENEMY_HIT,
            speed: PARTICLE_CONFIG.SPEED.ENEMY_HIT,
            size: PARTICLE_CONFIG.SIZE.ENEMY_HIT,
            color: particleColor,
            spread: PARTICLE_CONFIG.SPREAD.ENEMY_HIT,
            direction: 0,
          });
        }

        if (ctx.hasCameraSystem) {
          ctx.cameraSystemRef.current.shake(
            CAMERA_CONFIG.SHAKE.ENEMY_COLLISION.INTENSITY,
            CAMERA_CONFIG.SHAKE.ENEMY_COLLISION.DURATION
          );
        }
      }
    });

    // Player vs Asteroid collision
    collision.on("player", "asteroid", (player, asteroid, _info) => {
      if (!validateEntityId(asteroid.id)) return;

      const spawned = ctx.spawnedRef.current.find((s) => s.id === asteroid.id);
      if (spawned && !spawned.dead) {
        spawned.dead = true;
        ctx.applyDamage(DAMAGE_CONFIG.ASTEROID_COLLISION);

        if (ctx.hasParticleSystem) {
          ctx.particleSystemRef.current.emit(asteroid.x, asteroid.y, PARTICLE_CONFIG.COUNT.ASTEROID_HIT, {
            life: PARTICLE_CONFIG.LIFE.ASTEROID_HIT,
            speed: PARTICLE_CONFIG.SPEED.ASTEROID_HIT,
            size: PARTICLE_CONFIG.SIZE.ASTEROID_HIT,
            color: COLORS_CONFIG.PARTICLE.ASTEROID,
            spread: PARTICLE_CONFIG.SPREAD.ASTEROID_HIT,
            direction: 0,
          });
        }

        if (ctx.hasScoreSystem) {
          ctx.scoreSystemRef.current.addScore(SCORE_CONFIG.ASTEROID, "asteroid");
          ctx.playSfx("score");
        }

        if (ctx.hasCameraSystem) {
          ctx.cameraSystemRef.current.shake(
            CAMERA_CONFIG.SHAKE.ASTEROID_COLLISION.INTENSITY,
            CAMERA_CONFIG.SHAKE.ASTEROID_COLLISION.DURATION
          );
        }
      }
    });

    // Bullet vs Enemy collision
    collision.on("bullet", "enemy", (bullet, enemy, _info) => {
      if (!validateEntityId(bullet.id) || !validateEntityId(enemy.id)) return;

      const b = ctx.bulletsRef.current.find((x) => x.id === bullet.id);
      const s = ctx.spawnedRef.current.find((x) => x.id === enemy.id);
      if (b && !b.dead) b.dead = true;

      if (s && !s.dead) {
        if (s.variant === "tank" && (s.hp ?? ENEMY_CONFIG.HP.TANK) > 1) {
          s.hp = (s.hp ?? ENEMY_CONFIG.HP.TANK) - 1;
        } else {
          s.dead = true;
        }
      }

      if (ctx.hasParticleSystem) {
        const particleColor = normalizeColor(ctx.theme?.accent, COLORS_CONFIG.PARTICLE.ENEMY);
        ctx.particleSystemRef.current.emit(enemy.x, enemy.y, PARTICLE_CONFIG.COUNT.BULLET_ENEMY, {
          life: PARTICLE_CONFIG.LIFE.BULLET_ENEMY,
          speed: PARTICLE_CONFIG.SPEED.BULLET_ENEMY,
          size: PARTICLE_CONFIG.SIZE.BULLET_ENEMY,
          color: particleColor,
          spread: PARTICLE_CONFIG.SPREAD.BULLET_ENEMY,
          direction: 0,
        });

        // Multi-layer explosion on enemy death
        if (s?.dead) {
          emitExplosionParticles(ctx.particleSystemRef.current, enemy.x, enemy.y, s.variant, ctx.theme);
        }
      }

      if (ctx.hasScoreSystem) {
        if (s?.dead) ctx.scoreSystemRef.current.addScore(SCORE_CONFIG.ENEMY, "enemy");
        ctx.playSfx("score");
      }

      if (ctx.hasCameraSystem) {
        const shakeIntensity = s?.dead
          ? CAMERA_CONFIG.SHAKE.ENEMY_DEATH.INTENSITY
          : CAMERA_CONFIG.SHAKE.BULLET_HIT.INTENSITY;
        const shakeDuration = s?.dead
          ? CAMERA_CONFIG.SHAKE.ENEMY_DEATH.DURATION
          : CAMERA_CONFIG.SHAKE.BULLET_HIT.DURATION;
        ctx.cameraSystemRef.current.shake(shakeIntensity, shakeDuration);
      }
    });

    // Bullet vs Asteroid collision
    collision.on("bullet", "asteroid", (bullet, asteroid, _info) => {
      if (!validateEntityId(bullet.id) || !validateEntityId(asteroid.id)) return;

      const b = ctx.bulletsRef.current.find((x) => x.id === bullet.id);
      const s = ctx.spawnedRef.current.find((x) => x.id === asteroid.id);
      if (b && !b.dead) b.dead = true;
      if (s && !s.dead) s.dead = true;

      if (ctx.hasParticleSystem) {
        ctx.particleSystemRef.current.emit(asteroid.x, asteroid.y, PARTICLE_CONFIG.COUNT.BULLET_ASTEROID, {
          life: PARTICLE_CONFIG.LIFE.BULLET_ASTEROID,
          speed: PARTICLE_CONFIG.SPEED.BULLET_ASTEROID,
          size: PARTICLE_CONFIG.SIZE.BULLET_ASTEROID,
          color: COLORS_CONFIG.PARTICLE.ASTEROID_BULLET,
          spread: PARTICLE_CONFIG.SPREAD.BULLET_ASTEROID,
          direction: 0,
        });
      }

      if (ctx.hasScoreSystem) {
        ctx.scoreSystemRef.current.addScore(SCORE_CONFIG.ASTEROID, "asteroid");
        ctx.playSfx("score");
      }
    });

    // Powerups
    collision.on("player", "powerup", (player, powerup, _info) => {
      if (!validateEntityId(powerup.id)) return;

      const s = ctx.spawnedRef.current.find((x) => x.id === powerup.id);
      if (!s || s.dead) return;
      s.dead = true;

      ctx.applyBuffs(s.kind);
      ctx.playSfx("powerup");

      if (ctx.hasParticleSystem) {
        const primaryColor = normalizeColor(ctx.theme?.primary, COLORS_CONFIG.PARTICLE.PRIMARY);
        ctx.particleSystemRef.current.emit(s.x, s.y, PARTICLE_CONFIG.COUNT.POWERUP, {
          life: PARTICLE_CONFIG.LIFE.POWERUP,
          speed: PARTICLE_CONFIG.SPEED.POWERUP,
          size: PARTICLE_CONFIG.SIZE.POWERUP,
          color: primaryColor,
          spread: PARTICLE_CONFIG.SPREAD.POWERUP,
          direction: 0,
        });
      }
    });
  }, []);

  return { setupCollisionCallbacks };
}

function emitExplosionParticles(
  particleSystem: ParticleSystem,
  x: number,
  y: number,
  variant: string | undefined,
  theme: OrdaxVisualTheme | undefined
) {
  // Layer 1: Core explosion
  particleSystem.emit(x, y, PARTICLE_CONFIG.EXPLOSION.LAYER_1.count, {
    life: PARTICLE_CONFIG.EXPLOSION.LAYER_1.life,
    speed: PARTICLE_CONFIG.EXPLOSION.LAYER_1.speed,
    size: PARTICLE_CONFIG.EXPLOSION.LAYER_1.size,
    endSize: PARTICLE_CONFIG.EXPLOSION.LAYER_1.endSize,
    color: PARTICLE_CONFIG.EXPLOSION.LAYER_1.color,
    endColor: PARTICLE_CONFIG.EXPLOSION.LAYER_1.endColor,
    spread: PARTICLE_CONFIG.EXPLOSION.LAYER_1.spread,
    direction: PARTICLE_CONFIG.EXPLOSION.LAYER_1.direction,
    gravity: PARTICLE_CONFIG.EXPLOSION.LAYER_1.gravity,
  });

  // Layer 2: Fire ring
  particleSystem.emit(x, y, PARTICLE_CONFIG.EXPLOSION.LAYER_2.count, {
    life: PARTICLE_CONFIG.EXPLOSION.LAYER_2.life,
    speed: PARTICLE_CONFIG.EXPLOSION.LAYER_2.speed,
    size: PARTICLE_CONFIG.EXPLOSION.LAYER_2.size,
    endSize: PARTICLE_CONFIG.EXPLOSION.LAYER_2.endSize,
    color: PARTICLE_CONFIG.EXPLOSION.LAYER_2.color,
    endColor: PARTICLE_CONFIG.EXPLOSION.LAYER_2.endColor,
    spread: PARTICLE_CONFIG.EXPLOSION.LAYER_2.spread,
    direction: PARTICLE_CONFIG.EXPLOSION.LAYER_2.direction,
    gravity: PARTICLE_CONFIG.EXPLOSION.LAYER_2.gravity,
  });

  // Layer 3: Hot white core flash
  particleSystem.emit(x, y, PARTICLE_CONFIG.EXPLOSION.LAYER_3.count, {
    life: PARTICLE_CONFIG.EXPLOSION.LAYER_3.life,
    speed: PARTICLE_CONFIG.EXPLOSION.LAYER_3.speed,
    size: PARTICLE_CONFIG.EXPLOSION.LAYER_3.size,
    endSize: PARTICLE_CONFIG.EXPLOSION.LAYER_3.endSize,
    color: PARTICLE_CONFIG.EXPLOSION.LAYER_3.color,
    spread: PARTICLE_CONFIG.EXPLOSION.LAYER_3.spread,
    direction: PARTICLE_CONFIG.EXPLOSION.LAYER_3.direction,
  });

  // Layer 4: Smoke trail
  particleSystem.emit(x, y, PARTICLE_CONFIG.EXPLOSION.LAYER_4.count, {
    life: PARTICLE_CONFIG.EXPLOSION.LAYER_4.life,
    speed: PARTICLE_CONFIG.EXPLOSION.LAYER_4.speed,
    size: PARTICLE_CONFIG.EXPLOSION.LAYER_4.size,
    endSize: PARTICLE_CONFIG.EXPLOSION.LAYER_4.endSize,
    color: PARTICLE_CONFIG.EXPLOSION.LAYER_4.color,
    endColor: PARTICLE_CONFIG.EXPLOSION.LAYER_4.endColor,
    spread: PARTICLE_CONFIG.EXPLOSION.LAYER_4.spread,
    direction: PARTICLE_CONFIG.EXPLOSION.LAYER_4.direction,
    gravity: PARTICLE_CONFIG.EXPLOSION.LAYER_4.gravity,
  });

  // Layer 5: Colored sparks
  const sparkColor =
    variant === "tank"
      ? "hsl(200, 90%, 60%)"
      : variant === "sniper"
      ? "hsl(280, 90%, 65%)"
      : PARTICLE_CONFIG.EXPLOSION.LAYER_5.color;

  particleSystem.emit(x, y, PARTICLE_CONFIG.EXPLOSION.LAYER_5.count, {
    life: PARTICLE_CONFIG.EXPLOSION.LAYER_5.life,
    speed: PARTICLE_CONFIG.EXPLOSION.LAYER_5.speed,
    size: PARTICLE_CONFIG.EXPLOSION.LAYER_5.size,
    endSize: PARTICLE_CONFIG.EXPLOSION.LAYER_5.endSize,
    color: sparkColor,
    spread: PARTICLE_CONFIG.EXPLOSION.LAYER_5.spread,
    direction: PARTICLE_CONFIG.EXPLOSION.LAYER_5.direction,
    gravity: PARTICLE_CONFIG.EXPLOSION.LAYER_5.gravity,
  });
}
