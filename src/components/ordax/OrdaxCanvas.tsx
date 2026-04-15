import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { EngineDebugPanel } from "./EngineDebugPanel";
import type { OrdaxEntity, OrdaxSpec } from "@/lib/ordax/types";
import { PhysicsSystem } from "@/lib/ordax/systems/PhysicsSystem";
import { CollisionSystem } from "@/lib/ordax/systems/CollisionSystem";
import { ParticleSystem } from "@/lib/ordax/systems/ParticleSystem";
import { ScoreSystem } from "@/lib/ordax/systems/ScoreSystem";
import { AudioSystem } from "@/lib/ordax/systems/AudioSystem";
import { CameraSystem } from "@/lib/ordax/systems/CameraSystem";
import { UISystem } from "@/lib/ordax/systems/UISystem";
import { TimerSystem } from "@/lib/ordax/systems/TimerSystem";
import { AISystem } from "@/lib/ordax/systems/AISystem";
import { AnimationSystem } from "@/lib/ordax/systems/AnimationSystem";
import { lintOrdaxSpec } from "@/lib/ordax/spec-lint";
import { toast } from "sonner";
import { EntityRenderer } from "./canvas/rendering/EntityRenderer";
import { SpawnedRenderer } from "./canvas/rendering/SpawnedRenderer";
import { BulletRenderer } from "./canvas/rendering/BulletRenderer";
import { UIRenderer } from "./canvas/rendering/UIRenderer";
import { BackgroundRenderer } from "./canvas/rendering/BackgroundRenderer";
import { InputHandler } from "./canvas/game-loop/InputHandler";
import { ShootingHandler } from "./canvas/game-loop/ShootingHandler";
import { GameStateManager } from "./canvas/game-loop/GameStateManager";
import { SpawnManager } from "./canvas/game-loop/SpawnManager";
import { BulletManager } from "./canvas/game-loop/BulletManager";
import { useOrdaxAudio, useCollisionSetup, useAISetup, useSpriteLoader, useInputHandlers, useInputEventListeners, useGameReset, useDebugPanel, usePlayerState, useGameLoop } from "./canvas/hooks";
import type { DebugInfo } from "./ordaxCanvasTypes";
import { hslToHsla, normalizeCssColor } from "./canvas/colorUtils";

import type {
  GameKey,
  Keys,
  Spawned,
  Bullet,
  ShieldState,
  Buffs,
  SystemName,
} from "./ordaxCanvasTypes";
import {
  isGameKey,
  isValidKeys,
  isValidSpawned,
  isValidBullet,
  isValidShieldState,
  isValidBuffs,
  isValidSystemName,
  isValidOrdaxSpec,
  isValidOrdaxEntity,
  getPlayerEntitySafe,
  getSpawnersSafe,
  isSystemEnabledSafe,
  VALIDATION_LIMITS,
  VALIDATION_ERRORS,
} from "./ordaxCanvasTypes";

import {
  PERFORMANCE_CONFIG,
  PHYSICS_CONFIG,
  COLLISION_CONFIG,
  DAMAGE_CONFIG,
  CAMERA_CONFIG,
  CANVAS_CONFIG,
  STARS_CONFIG,
  COLORS_CONFIG,
  MESSAGES_CONFIG,
  STYLES_CONFIG,
  VALIDATION_CONFIG,
  WORLD_CONFIG,
} from "./ordaxCanvasConfig";

import {
  validateNumber,
  isFiniteNumber,
  isPositiveNumber,
  validateCanvasDimensions,
  validateWorldDimensions,
  validateDeltaTime,
  validateEntityId,
  validateHealth,
  validateStarCount,
  getPlayerEntitySafe as getPlayerEntitySafeUtil,
  filterSpawnersSafe,
  validateSpawnedArray,
  validateBulletsArray,
  validateShieldState as validateShieldStateUtil,
  validateBuffs as validateBuffsUtil,
  logStructured,
  logErrorWithContext,
  createDebouncedFunction,
  createThrottledFunction,
} from "./ordaxCanvasUtils";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

type Props = {
  spec?: OrdaxSpec;
  running: boolean;
};

export type OrdaxCanvasHandle = {
  reset: () => void;
  getDebugInfo: () => DebugInfo;
};

export const OrdaxCanvas = forwardRef<OrdaxCanvasHandle, Props>(({ spec, running }, ref) => {
  // ============================================================================
  // VALIDAÇÃO INICIAL
  // ============================================================================
  
  // Valida spec antes de usar
  const validatedSpec = useMemo(() => {
    if (!spec) return null;
    
    if (!isValidOrdaxSpec(spec)) {
      logStructured('error', VALIDATION_ERRORS.INVALID_SPEC, { spec });
      return null;
    }
    
    return spec;
  }, [spec]);
  
  // ============================================================================
  // REFS DO CANVAS E INPUT
  // ============================================================================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Keys>({});

  // ============================================================================
  // SINGLE SOURCE OF TRUTH - ENTITIES COM VALIDAÇÃO
  // ============================================================================
  // Runtime entities (mutable, updated by systems) com validação
  const runtimeEntitiesRef = useRef<OrdaxEntity[]>([]);
  
  // Player é um POINTER para a entidade em runtimeEntitiesRef, não uma cópia
  // Cacheado para performance (chamado múltiplas vezes por frame)
  const getPlayerEntity = useCallback((): OrdaxEntity | null => {
    return getPlayerEntitySafe(runtimeEntitiesRef.current);
  }, []);
  
  // Estado do escudo com validação de tipo
  const shieldRef = useRef<ShieldState | null>(null);
  
  // ============================================================================
  // ESTADO DO JOGO COM VALIDAÇÃO
  // ============================================================================
  const spawnedRef = useRef<Spawned[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const spawnTimerRef = useRef<number>(0);
  const powerupTimerRef = useRef<number>(0);
  const fireCooldownRef = useRef<number>(0);
  const buffsRef = useRef<Buffs>({ shield: 0, spread: 0 });
  const lastTRef = useRef<number>(0);
  const gameOverRef = useRef(false);
  const damageFlashRef = useRef<number>(0); // remaining flash time in seconds

  // ============================================================================
  // DADOS DA SPEC COM VALIDAÇÃO
  // ============================================================================
  const scene = useMemo(() => {
    if (!validatedSpec?.scene) {
      return { gravity: { x: 0, y: 0 }, entities: [] as OrdaxEntity[] };
    }
    
    const scene = validatedSpec.scene;
    return {
      gravity: {
        x: validateNumber(scene.gravity?.x, -1000, 1000, 0),
        y: validateNumber(scene.gravity?.y, -1000, 1000, 0),
      },
      entities: Array.isArray(scene.entities) 
        ? scene.entities.filter(e => {
            // Control entities (spawner) can have w/h = 0
            if (e?.type === 'spawner') {
              return typeof e.id === 'string' && e.id &&
                typeof e.x === 'number' && isFinite(e.x) &&
                typeof e.y === 'number' && isFinite(e.y);
            }
            return isValidOrdaxEntity(e);
          })
        : [],
    };
  }, [validatedSpec]);

  const entities = scene.entities;

  const initialPlayer = useMemo(() => {
    return getPlayerEntitySafe(entities);
  }, [entities]);

  const spawners = useMemo(() => {
    return getSpawnersSafe(entities);
  }, [entities]);

  const hasSpawner = spawners.length > 0;
  const visual = validatedSpec?.visual;
  const bgLayers = visual?.background?.layers ?? [];
  const theme = visual?.theme;
  const gameType = validatedSpec?.gameType ?? "unknown";
  
  // ============================================================================
  // SISTEMAS COM VALIDAÇÃO
  // ============================================================================
  const systems = validatedSpec?.systems ?? [];
  
  // Funções de validação segura para sistemas
  const hasPhysicsSystem = isSystemEnabledSafe(systems, 'PhysicsSystem');
  const hasCollisionSystem = isSystemEnabledSafe(systems, 'CollisionSystem');
  const hasParticleSystem = isSystemEnabledSafe(systems, 'ParticleSystem');
  const hasScoreSystem = isSystemEnabledSafe(systems, 'ScoreSystem');
  const hasAudioSystem = isSystemEnabledSafe(systems, 'AudioSystem');
  const hasCameraSystem = isSystemEnabledSafe(systems, 'CameraSystem');
  const hasUISystem = isSystemEnabledSafe(systems, 'UISystem');
  const hasTimerSystem = isSystemEnabledSafe(systems, 'TimerSystem');
  const hasAISystem = isSystemEnabledSafe(systems, 'AISystem');
  const hasAnimationSystem = isSystemEnabledSafe(systems, 'AnimationSystem');

  // ============================================================================
  // INSTÂNCIAS DE SISTEMAS COM VALIDAÇÃO
  // ============================================================================
  const physicsSystemRef = useRef<PhysicsSystem>(new PhysicsSystem());
  const collisionSystemRef = useRef<CollisionSystem>(new CollisionSystem(WORLD_CONFIG.w, WORLD_CONFIG.h, COLLISION_CONFIG.GRID_SIZE));
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
  const scoreSystemRef = useRef<ScoreSystem>(new ScoreSystem());
  const audioSystemRef = useRef<AudioSystem>(new AudioSystem());
  const cameraSystemRef = useRef<CameraSystem>(new CameraSystem(WORLD_CONFIG.w, WORLD_CONFIG.h));
  const uiSystemRef = useRef<UISystem>(new UISystem());
  const timerSystemRef = useRef<TimerSystem>(new TimerSystem());
  const aiSystemRef = useRef<AISystem>(new AISystem());
  const animationSystemRef = useRef<AnimationSystem>(new AnimationSystem());

  // Persistent renderer/handler refs (avoid per-frame allocation)
  const backgroundRendererRef = useRef<BackgroundRenderer | null>(null);
  const entityRendererRef = useRef<EntityRenderer | null>(null);
  const spawnedRendererRef = useRef<SpawnedRenderer | null>(null);
  const bulletRendererRef = useRef<BulletRenderer | null>(null);
  const uiRendererRef = useRef<UIRenderer | null>(null);
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const shootingHandlerRef = useRef<ShootingHandler | null>(null);
  const gameStateManagerRef = useRef<GameStateManager | null>(null);
  const spawnManagerRef = useRef<SpawnManager | null>(null);
  const bulletManagerRef = useRef<BulletManager | null>(null);

  // ============================================================================
  // ÁUDIO - HOOK EXTRATO
  // ============================================================================
  const { playSfx, fallbackAudioRef } = useOrdaxAudio(hasAudioSystem, audioSystemRef);

  // ============================================================================
  // ESTADO DO JOGADOR - HOOK EXTRATO
  // ============================================================================
  const { applyDamage, applyBuffs } = usePlayerState({
    shieldRef,
    buffsRef,
    gameOverRef,
    damageFlashRef,
    getPlayerEntity,
    playSfx,
  });

  // ============================================================================
  // HOOKS DE COLISÃO E AI
  // ============================================================================
  const { setupCollisionCallbacks } = useCollisionSetup();
  const { setupAI } = useAISetup();

  // ============================================================================
  // SPRITES - HOOK EXTRATO
  // ============================================================================
  const { spritesLoaded, spritesRef } = useSpriteLoader(entities);

  // ============================================================================
  // INPUT - HOOK EXTRATO
  // ============================================================================
  const { onDown, onUp } = useInputHandlers(keysRef);
  useInputEventListeners(onDown, onUp);

  // ============================================================================
  // DEBUG PANEL - HOOK EXTRATO
  // ============================================================================
  const { debugEnabled, getEngineStats } = useDebugPanel({
    hasPhysicsSystem,
    hasCollisionSystem,
    hasParticleSystem,
    hasScoreSystem,
    hasAudioSystem,
    hasCameraSystem,
    hasUISystem,
    hasTimerSystem,
    hasAISystem,
    hasAnimationSystem,
    runtimeEntitiesRef,
    spawnedRef,
    bulletsRef,
    particleSystemRef,
  });

  // ============================================================================
  // FUNÇÃO UTILITÁRIA: Redimensionar Canvas (SSOT)
  // ============================================================================
  const resizeCanvas = useCallback((canvas: HTMLCanvasElement, dims: { width: number; height: number }, dpr: number) => {
    if (canvas.width !== dims.width * dpr || canvas.height !== dims.height * dpr) {
      canvas.width = dims.width * dpr;
      canvas.height = dims.height * dpr;
    }
  }, []);

  // ============================================================================
  // CARREGAMENTO DE ÁUDIO COM VALIDAÇÃO
  // ============================================================================
  useEffect(() => {
    if (!validatedSpec || !hasAudioSystem || !validatedSpec.audio) return;

    let cancelled = false;
    const audio = audioSystemRef.current;

    // Carrega música
    if (validatedSpec.audio.music) {
      const musicUrl = validatedSpec.audio.music;
      
      if (typeof musicUrl === 'string' && musicUrl.trim()) {
        try {
          audio.loadMusic("bgm", musicUrl);
          logStructured('info', 'Música carregada', { url: musicUrl });
        } catch (error) {
          logErrorWithContext(error, MESSAGES_CONFIG.MUSIC_LOAD_FAILED, { url: musicUrl });
        }
      } else {
        logStructured('warn', 'URL de música inválida', { url: musicUrl });
      }
    }

    // Carrega sons
    if (validatedSpec.audio.sounds && typeof validatedSpec.audio.sounds === 'object') {
      Object.entries(validatedSpec.audio.sounds).forEach(([key, url]) => {
        if (cancelled) return;
        
        if (typeof url === 'string' && url.trim()) {
          try {
            audio.loadSound(key, url);
            logStructured('info', 'Som carregado', { key, url });
          } catch (error) {
            logErrorWithContext(error, `${MESSAGES_CONFIG.SOUND_LOAD_FAILED} ${key}`, { url });
          }
        } else {
          logStructured('warn', 'URL de som inválida', { key, url });
        }
      });
    }
    
    return () => {
      cancelled = true;
      logStructured('info', 'Cleanup de áudio');
    };
  }, [validatedSpec, hasAudioSystem]);

  // ============================================================================
  // RESET - HOOK EXTRATO
  // ============================================================================
  const { reset, resetRef } = useGameReset({
    validatedSpec,
    sceneEntities: scene.entities,
    initialPlayer,
    gameType,
    runtimeEntitiesRef,
    shieldRef,
    spawnedRef,
    bulletsRef,
    spawnTimerRef,
    powerupTimerRef,
    fireCooldownRef,
    buffsRef,
    lastTRef,
    gameOverRef,
    hasPhysicsSystem,
    hasScoreSystem,
    hasParticleSystem,
    hasTimerSystem,
    hasCameraSystem,
    hasAudioSystem,
    physicsSystemRef,
    scoreSystemRef,
    particleSystemRef,
    timerSystemRef,
    cameraSystemRef,
    audioSystemRef,
  });

  // ============================================================================
  // USE IMPERATIVE HANDLE COM VALIDAÇÃO
  // ============================================================================
  useImperativeHandle(ref, () => ({ 
    reset,
    getDebugInfo: () => {
      try {
        const player = getPlayerEntity();
        
        const debugInfo: DebugInfo = {
          systems: {
            physics: hasPhysicsSystem,
            collision: hasCollisionSystem,
            particles: hasParticleSystem,
            particleCount: hasParticleSystem ? particleSystemRef.current.getCount() : 0,
            score: hasScoreSystem,
            ai: hasAISystem,
            camera: hasCameraSystem,
            audio: hasAudioSystem,
            ui: hasUISystem,
            timer: hasTimerSystem,
            animation: hasAnimationSystem,
          },
          entities: {
            total: runtimeEntitiesRef.current.length,
            spawned: spawnedRef.current.length,
          },
          player: player ? {
            health: validateHealth(player.props?.health, VALIDATION_CONFIG.DEFAULT_HEALTH),
            x: Math.round(player.x),
            y: Math.round(player.y),
          } : null,
          score: hasScoreSystem ? {
            current: scoreSystemRef.current.getScore(),
            multiplier: scoreSystemRef.current.getMultiplier(),
            combo: scoreSystemRef.current.getCombo(),
          } : null,
        };
        
        return debugInfo;
      } catch (error) {
        logErrorWithContext(error, 'Erro ao obter debug info');
        
        // Fallback seguro
        return {
          systems: {
            physics: hasPhysicsSystem,
            collision: hasCollisionSystem,
            particles: hasParticleSystem,
            particleCount: 0,
            score: hasScoreSystem,
            ai: hasAISystem,
            camera: hasCameraSystem,
            audio: hasAudioSystem,
            ui: hasUISystem,
            timer: hasTimerSystem,
            animation: hasAnimationSystem,
          },
          entities: {
            total: 0,
            spawned: 0,
          },
          player: null,
          score: null,
        };
      }
    }
  }), [
    hasPhysicsSystem, hasCollisionSystem, hasParticleSystem, hasScoreSystem, 
    hasAISystem, hasCameraSystem, hasAudioSystem, hasUISystem, 
    hasTimerSystem, hasAnimationSystem, validatedSpec, reset, getPlayerEntity
  ]);

  useEffect(() => {
    if (!spec) return;
    
    // Validar spec antes de usar
    const issues = lintOrdaxSpec(spec);
    if (issues.length > 0) {
      const criticalIssues = issues.filter(i => i.severity === "error");
      if (criticalIssues.length > 0) {
        console.error("[OrdaxCanvas] ❌ Spec inválida:", criticalIssues);
        toast.error(`Erro ao carregar jogo: ${criticalIssues[0].message}`);
        return;
      }
      
      // Warnings não bloqueiam, apenas logam
      const warnings = issues.filter(i => i.severity === "warn");
      if (warnings.length > 0) {
        console.warn("[OrdaxCanvas] ⚠️ Avisos na spec:", warnings);
      }
    }
    
    reset();

    // Setup collision callbacks (via hook)
    setupCollisionCallbacks({
      hasCollisionSystem,
      hasParticleSystem,
      hasScoreSystem,
      hasCameraSystem,
      hasAISystem,
      collisionSystemRef,
      particleSystemRef,
      scoreSystemRef,
      cameraSystemRef,
      spawnedRef,
      bulletsRef,
      theme,
      applyDamage,
      applyBuffs,
      playSfx,
    });

    // Setup AI for enemies (via hook)
    const allEntities = [...runtimeEntitiesRef.current, ...spawnedRef.current, ...bulletsRef.current];
    setupAI({
      hasAISystem,
      aiSystemRef,
      entities: allEntities,
    });
  }, [spec, reset, setupCollisionCallbacks, setupAI, runtimeEntitiesRef, spawnedRef, bulletsRef]);

  // ============================================================================
  // RENDERIZAÇÃO
  // ============================================================================
  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        aria-label={MESSAGES_CONFIG.ARIA.CANVAS_LABEL}
        role={MESSAGES_CONFIG.ARIA.CANVAS_ROLE}
      >
        Your browser does not support the HTML5 canvas element.
      </canvas>

      <EngineDebugPanel enabled={debugEnabled} getStats={getEngineStats} />

      {/* Hint badge */}
      {!debugEnabled && (
        <div className="pointer-events-none absolute bottom-2 right-2 z-10 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground/40 select-none">
          F3 debug
        </div>
      )}
    </div>
  );
});
OrdaxCanvas.displayName = "OrdaxCanvas";
