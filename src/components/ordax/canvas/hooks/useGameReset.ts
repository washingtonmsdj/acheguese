/**
 * useGameReset - Hook para função de reset do jogo
 *
 * Extrai toda a lógica de reset do componente principal,
 * seguindo SSOT (Single Source of Truth) e sem gambiarras.
 */

import { useCallback, useRef, useEffect } from "react";
import type { OrdaxEntity, OrdaxSpec } from "@/lib/ordax/types";
import type { ShieldState, Spawned, Bullet, Buffs } from "../../ordaxCanvasTypes";
import { isValidOrdaxEntity, validateShieldState as validateShieldStateUtil } from "../../ordaxCanvasTypes";
import { validateShieldProps, logStructured, logErrorWithContext } from "../../ordaxCanvasUtils";
import {
  PHYSICS_CONFIG,
  CAMERA_CONFIG,
  VALIDATION_CONFIG,
} from "../../ordaxCanvasConfig";
import { validateWorldDimensions } from "../../ordaxCanvasUtils";
import { PhysicsSystem } from "@/lib/ordax/systems/PhysicsSystem";
import { ScoreSystem } from "@/lib/ordax/systems/ScoreSystem";
import { ParticleSystem } from "@/lib/ordax/systems/ParticleSystem";
import { TimerSystem } from "@/lib/ordax/systems/TimerSystem";
import { CameraSystem } from "@/lib/ordax/systems/CameraSystem";
import { AudioSystem } from "@/lib/ordax/systems/AudioSystem";

export type GameResetContext = {
  validatedSpec: OrdaxSpec | null;
  sceneEntities: OrdaxEntity[];
  initialPlayer: OrdaxEntity | null;
  gameType: string;
  runtimeEntitiesRef: React.MutableRefObject<OrdaxEntity[]>;
  shieldRef: React.MutableRefObject<ShieldState | null>;
  spawnedRef: React.MutableRefObject<Spawned[]>;
  bulletsRef: React.MutableRefObject<Bullet[]>;
  spawnTimerRef: React.MutableRefObject<number>;
  powerupTimerRef: React.MutableRefObject<number>;
  fireCooldownRef: React.MutableRefObject<number>;
  buffsRef: React.MutableRefObject<Buffs>;
  lastTRef: React.MutableRefObject<number>;
  gameOverRef: React.MutableRefObject<boolean>;
  hasPhysicsSystem: boolean;
  hasScoreSystem: boolean;
  hasParticleSystem: boolean;
  hasTimerSystem: boolean;
  hasCameraSystem: boolean;
  hasAudioSystem: boolean;
  physicsSystemRef: React.MutableRefObject<PhysicsSystem>;
  scoreSystemRef: React.MutableRefObject<ScoreSystem>;
  particleSystemRef: React.MutableRefObject<ParticleSystem>;
  timerSystemRef: React.MutableRefObject<TimerSystem>;
  cameraSystemRef: React.MutableRefObject<CameraSystem>;
  audioSystemRef: React.MutableRefObject<AudioSystem>;
};

export type GameResetResult = {
  reset: () => void;
  resetRef: React.MutableRefObject<() => void>;
};

export function useGameReset(ctx: GameResetContext): GameResetResult {
  const resetRef = useRef<() => void>(() => undefined);

  const reset = useCallback(() => {
    if (!ctx.validatedSpec?.scene?.entities) {
      logStructured('warn', 'Reset chamado sem spec válida');
      return;
    }

    ctx.gameOverRef.current = false;
    logStructured('info', 'Reset do jogo iniciado', { gameType: ctx.gameType });

    // ============================================================================
    // SSOT: INICIALIZA ENTIDADES RUNTIME COM VALIDAÇÃO
    // ============================================================================
    ctx.runtimeEntitiesRef.current = ctx.sceneEntities
      .filter(e => {
        if (!e || typeof e !== 'object') return false;
        if (typeof e.id !== 'string' || !e.id) return false;
        if (typeof e.type !== 'string' || !e.type) return false;
        if (typeof e.x !== 'number' || !isFinite(e.x)) return false;
        if (typeof e.y !== 'number' || !isFinite(e.y)) return false;
        // Spawners are control entities and can have w/h = 0
        if (e.type === 'spawner') return true;
        return isValidOrdaxEntity(e);
      })
      .map(e => ({
        ...e,
        props: e.props ? { ...e.props } : undefined
      }));

    logStructured('info', 'Entidades runtime inicializadas', {
      count: ctx.runtimeEntitiesRef.current.length,
      originalCount: ctx.sceneEntities.length
    });

    // ============================================================================
    // INICIALIZA ESTADO DO JOGADOR COM VALIDAÇÃO
    // ============================================================================
    if (ctx.initialPlayer) {
      const shieldProps = validateShieldProps(
        ctx.initialPlayer.props?.shield,
        ctx.initialPlayer.props?.shieldRegen
      );

      ctx.shieldRef.current = shieldProps.isValid
        ? {
            value: shieldProps.max,
            max: shieldProps.max,
            regenPerSec: shieldProps.regen
          }
        : null;

      logStructured('info', 'Estado do jogador inicializado', {
        hasShield: shieldProps.isValid,
        shieldMax: shieldProps.max,
        shieldRegen: shieldProps.regen
      });
    } else {
      ctx.shieldRef.current = null;
      logStructured('warn', 'Jogador não encontrado na spec');
    }

    // ============================================================================
    // RESETA ESTADO DO JOGO
    // ============================================================================
    ctx.spawnedRef.current = [];
    ctx.bulletsRef.current = [];
    ctx.spawnTimerRef.current = 0;
    ctx.powerupTimerRef.current = 0;
    ctx.fireCooldownRef.current = 0;
    ctx.buffsRef.current = { shield: 0, spread: 0 };
    ctx.lastTRef.current = performance.now();

    // ============================================================================
    // RESETA SISTEMAS
    // ============================================================================
    if (ctx.hasScoreSystem) {
      try {
        ctx.scoreSystemRef.current.reset();
        ctx.scoreSystemRef.current.loadHighScore();
        logStructured('info', 'Sistema de pontuação resetado');
      } catch (error) {
        logErrorWithContext(error, 'Erro ao resetar sistema de pontuação');
      }
    }

    if (ctx.hasParticleSystem) {
      try {
        ctx.particleSystemRef.current.clear();
        logStructured('info', 'Sistema de partículas resetado');
      } catch (error) {
        logErrorWithContext(error, 'Erro ao resetar sistema de partículas');
      }
    }

    if (ctx.hasTimerSystem) {
      try {
        ctx.timerSystemRef.current.clear();
        logStructured('info', 'Sistema de timer resetado');
      } catch (error) {
        logErrorWithContext(error, 'Erro ao resetar sistema de timer');
      }
    }

    if (ctx.hasPhysicsSystem) {
      try {
        ctx.physicsSystemRef.current.clear();
        logStructured('info', 'Sistema de física resetado');
      } catch (error) {
        logErrorWithContext(error, 'Erro ao resetar sistema de física');
      }
    }

    // ============================================================================
    // CONFIGURA FÍSICA DO JOGADOR
    // ============================================================================
    if (ctx.hasPhysicsSystem && ctx.initialPlayer?.id) {
      try {
        const mass = ctx.gameType === "racing"
          ? PHYSICS_CONFIG.MASS.RACING
          : PHYSICS_CONFIG.MASS.DEFAULT;

        const friction = ctx.gameType === "racing"
          ? PHYSICS_CONFIG.FRICTION.RACING
          : PHYSICS_CONFIG.FRICTION.DEFAULT;

        const restitution = PHYSICS_CONFIG.RESTITUTION.DEFAULT;

        ctx.physicsSystemRef.current.register(ctx.initialPlayer.id, mass, friction, restitution);
        ctx.physicsSystemRef.current.setMaxVelocity(
          ctx.initialPlayer.id,
          PHYSICS_CONFIG.MAX_VELOCITY.X,
          PHYSICS_CONFIG.MAX_VELOCITY.Y
        );

        logStructured('info', 'Física do jogador configurada', {
          mass, friction, restitution,
          maxVelocityX: PHYSICS_CONFIG.MAX_VELOCITY.X,
          maxVelocityY: PHYSICS_CONFIG.MAX_VELOCITY.Y
        });
      } catch (error) {
        logErrorWithContext(error, 'Erro ao configurar física do jogador');
      }
    }

    // ============================================================================
    // CONFIGURA CÂMERA
    // ============================================================================
    if (ctx.hasCameraSystem && ctx.initialPlayer?.id && validateWorldDimensions(VALIDATION_CONFIG.WORLD.WIDTH, VALIDATION_CONFIG.WORLD.HEIGHT)) {
      try {
        ctx.cameraSystemRef.current.follow("player", CAMERA_CONFIG.FOLLOW_SMOOTHNESS);
        ctx.cameraSystemRef.current.setBounds(
          CAMERA_CONFIG.BOUNDS.X,
          CAMERA_CONFIG.BOUNDS.Y,
          CAMERA_CONFIG.BOUNDS.W,
          CAMERA_CONFIG.BOUNDS.H
        );

        logStructured('info', 'Câmera configurada', {
          followSmoothness: CAMERA_CONFIG.FOLLOW_SMOOTHNESS,
          bounds: CAMERA_CONFIG.BOUNDS
        });
      } catch (error) {
        logErrorWithContext(error, 'Erro ao configurar câmera');
      }
    }

    // ============================================================================
    // TOCA MÚSICA
    // ============================================================================
    if (ctx.hasAudioSystem && ctx.validatedSpec?.audio?.music) {
      try {
        ctx.audioSystemRef.current.playMusic("bgm");
        logStructured('info', 'Música iniciada');
      } catch (error) {
        logErrorWithContext(error, 'Erro ao tocar música');
      }
    }

    logStructured('info', 'Reset do jogo completado');
  }, [
    ctx.validatedSpec,
    ctx.sceneEntities,
    ctx.initialPlayer,
    ctx.gameType,
    ctx.runtimeEntitiesRef,
    ctx.shieldRef,
    ctx.spawnedRef,
    ctx.bulletsRef,
    ctx.spawnTimerRef,
    ctx.powerupTimerRef,
    ctx.fireCooldownRef,
    ctx.buffsRef,
    ctx.lastTRef,
    ctx.gameOverRef,
    ctx.hasPhysicsSystem,
    ctx.hasScoreSystem,
    ctx.hasParticleSystem,
    ctx.hasTimerSystem,
    ctx.hasCameraSystem,
    ctx.hasAudioSystem,
    ctx.physicsSystemRef,
    ctx.scoreSystemRef,
    ctx.particleSystemRef,
    ctx.timerSystemRef,
    ctx.cameraSystemRef,
    ctx.audioSystemRef,
  ]);

  // Mantém referência atualizada
  useEffect(() => {
    resetRef.current = reset;
  });

  return { reset, resetRef };
}
