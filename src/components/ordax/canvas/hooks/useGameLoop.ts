/**
 * useGameLoop - Hook para o loop principal do jogo
 *
 * Extrai toda a lógica do game loop (update + render) do componente principal,
 * seguindo SSOT (Single Source of Truth) e sem gambiarras.
 */

import { useEffect, useCallback } from "react";
import type { OrdaxEntity } from "@/lib/ordax/types";
import { PhysicsSystem } from "@/lib/ordax/systems/PhysicsSystem";
import { CollisionSystem } from "@/lib/ordax/systems/CollisionSystem";
import { ParticleSystem } from "@/lib/ordax/systems/ParticleSystem";
import { ScoreSystem } from "@/lib/ordax/systems/ScoreSystem";
import { AudioSystem } from "@/lib/ordax/systems/AudioSystem";
import { CameraSystem } from "@/lib/ordax/systems/CameraSystem";
import { AISystem } from "@/lib/ordax/systems/AISystem";
import { TimerSystem } from "@/lib/ordax/systems/TimerSystem";
import { AnimationSystem } from "@/lib/ordax/systems/AnimationSystem";
import { BackgroundRenderer } from "../rendering/BackgroundRenderer";
import { EntityRenderer } from "../rendering/EntityRenderer";
import { SpawnedRenderer } from "../rendering/SpawnedRenderer";
import { BulletRenderer } from "../rendering/BulletRenderer";
import { UIRenderer } from "../rendering/UIRenderer";
import { InputHandler } from "../game-loop/InputHandler";
import { ShootingHandler } from "../game-loop/ShootingHandler";
import { GameStateManager } from "../game-loop/GameStateManager";
import { SpawnManager } from "../game-loop/SpawnManager";
import { BulletManager } from "../game-loop/BulletManager";
import {
  PERFORMANCE_CONFIG,
  CANVAS_CONFIG,
  STARS_CONFIG,
  WORLD_CONFIG,
  COLORS_CONFIG,
  DAMAGE_CONFIG,
} from "../../ordaxCanvasConfig";
import {
  validateCanvasDimensions,
  validateWorldDimensions,
  validateDeltaTime,
  validateStarCount,
  normalizeColor,
} from "../../ordaxCanvasUtils";
import { hslToHsla } from "../colorUtils";
import type { OrdaxSpec, OrdaxVisualTheme } from "@/lib/ordax/types";
import type { ShieldState, Buffs, Spawned, Bullet } from "../../ordaxCanvasTypes";

export type GameLoopContext = {
  // Refs de canvas
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  
  // Estado do jogo
  running: boolean;
  gameType: string;
  theme: OrdaxVisualTheme | undefined;
  bgLayers: Record<string, unknown>[];
  spec: OrdaxSpec | null;
  spawners: OrdaxEntity[];
  hasSpawner: boolean;
  
  // Refs de entidades
  runtimeEntitiesRef: React.MutableRefObject<OrdaxEntity[]>;
  spawnedRef: React.MutableRefObject<Spawned[]>;
  bulletsRef: React.MutableRefObject<Bullet[]>;
  
  // Refs de estado
  shieldRef: React.MutableRefObject<ShieldState | null>;
  buffsRef: React.MutableRefObject<Buffs>;
  gameOverRef: React.MutableRefObject<boolean>;
  damageFlashRef: React.MutableRefObject<number>;
  keysRef: React.MutableRefObject<Record<string, boolean>>;
  lastTRef: React.MutableRefObject<number>;
  fireCooldownRef: React.MutableRefObject<number>;
  spawnTimerRef: React.MutableRefObject<number>;
  powerupTimerRef: React.MutableRefObject<number>;
  
  // Refs de sprites
  spritesRef: React.MutableRefObject<Map<string, HTMLImageElement>>;
  spritesLoaded: boolean;
  
  // Systems
  hasPhysicsSystem: boolean;
  hasCollisionSystem: boolean;
  hasParticleSystem: boolean;
  hasScoreSystem: boolean;
  hasAISystem: boolean;
  hasTimerSystem: boolean;
  hasCameraSystem: boolean;
  hasAudioSystem: boolean;
  hasAnimationSystem: boolean;
  physicsSystemRef: React.MutableRefObject<PhysicsSystem>;
  collisionSystemRef: React.MutableRefObject<CollisionSystem>;
  particleSystemRef: React.MutableRefObject<ParticleSystem>;
  scoreSystemRef: React.MutableRefObject<ScoreSystem>;
  audioSystemRef: React.MutableRefObject<AudioSystem>;
  cameraSystemRef: React.MutableRefObject<CameraSystem>;
  aiSystemRef: React.MutableRefObject<AISystem>;
  timerSystemRef: React.MutableRefObject<TimerSystem>;
  animationSystemRef: React.MutableRefObject<AnimationSystem>;
  
  // Renderer refs
  backgroundRendererRef: React.MutableRefObject<BackgroundRenderer | null>;
  entityRendererRef: React.MutableRefObject<EntityRenderer | null>;
  spawnedRendererRef: React.MutableRefObject<SpawnedRenderer | null>;
  bulletRendererRef: React.MutableRefObject<BulletRenderer | null>;
  uiRendererRef: React.MutableRefObject<UIRenderer | null>;
  
  // Handler refs
  inputHandlerRef: React.MutableRefObject<InputHandler | null>;
  shootingHandlerRef: React.MutableRefObject<ShootingHandler | null>;
  gameStateManagerRef: React.MutableRefObject<GameStateManager | null>;
  spawnManagerRef: React.MutableRefObject<SpawnManager | null>;
  bulletManagerRef: React.MutableRefObject<BulletManager | null>;
  
  // Player
  initialPlayer: OrdaxEntity | null;
  getPlayerEntity: () => OrdaxEntity | null;
  
  // Audio
  playSfx: (sound: string) => void;
  
  // Utils
  resizeCanvas: (canvas: HTMLCanvasElement, dims: { width: number; height: number }, dpr: number) => void;
};

export function useGameLoop(ctx: GameLoopContext): void {
  const {
    canvasRef,
    running,
    gameType,
    theme,
    bgLayers,
    spec,
    spawners,
    hasSpawner,
    runtimeEntitiesRef,
    spawnedRef,
    bulletsRef,
    shieldRef,
    buffsRef,
    gameOverRef,
    damageFlashRef,
    keysRef,
    lastTRef,
    fireCooldownRef,
    spawnTimerRef,
    powerupTimerRef,
    spritesRef,
    spritesLoaded,
    hasPhysicsSystem,
    hasCollisionSystem,
    hasParticleSystem,
    hasScoreSystem,
    hasAISystem,
    hasTimerSystem,
    hasCameraSystem,
    hasAudioSystem,
    hasAnimationSystem,
    physicsSystemRef,
    collisionSystemRef,
    particleSystemRef,
    scoreSystemRef,
    audioSystemRef,
    cameraSystemRef,
    aiSystemRef,
    timerSystemRef,
    animationSystemRef,
    backgroundRendererRef,
    entityRendererRef,
    spawnedRendererRef,
    bulletRendererRef,
    uiRendererRef,
    inputHandlerRef,
    shootingHandlerRef,
    gameStateManagerRef,
    spawnManagerRef,
    bulletManagerRef,
    initialPlayer,
    getPlayerEntity,
    playSfx,
    resizeCanvas,
  } = ctx;

  // Game loop effect
  useEffect(() => {
    let raf = 0;
    let isCleanedUp = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    // If we don't have a spec yet, just clear the canvas.
    if (!spec) {
      const drawEmpty = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.max(CANVAS_CONFIG.MIN_DPR, Math.floor(window.devicePixelRatio || CANVAS_CONFIG.MIN_DPR));
        const dims = validateCanvasDimensions(
          Math.floor(rect.width),
          Math.floor(rect.height),
          CANVAS_CONFIG.MIN_WIDTH,
          CANVAS_CONFIG.MIN_HEIGHT
        );
        
        resizeCanvas(canvas, dims, dpr);
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx2d.fillStyle = COLORS_CONFIG.CANVAS_BACKGROUND;
        ctx2d.fillRect(0, 0, dims.width, dims.height);
      };
      drawEmpty();
      return;
    }

    // Initialize stars for starfield background
    let stars: { x: number; y: number; s: number; brightness: number; pulsePhase: number; pulseSpeed: number; colorIdx: number }[] = [];
    const initStars = (count: number) => {
      const validCount = validateStarCount(count, STARS_CONFIG.MAX_COUNT);
      stars = [];
      for (let i = 0; i < validCount; i++) {
        stars.push({
          x: Math.random() * WORLD_CONFIG.w,
          y: Math.random() * WORLD_CONFIG.h,
          s: STARS_CONFIG.SIZE_MIN + Math.random() * STARS_CONFIG.SIZE_RANGE * STARS_CONFIG.SIZE_MULTIPLIER,
          brightness: STARS_CONFIG.BRIGHTNESS_RANGE.MIN + Math.random() * (STARS_CONFIG.BRIGHTNESS_RANGE.MAX - STARS_CONFIG.BRIGHTNESS_RANGE.MIN),
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: STARS_CONFIG.PULSE_SPEED_RANGE.MIN + Math.random() * (STARS_CONFIG.PULSE_SPEED_RANGE.MAX - STARS_CONFIG.PULSE_SPEED_RANGE.MIN),
          colorIdx: Math.floor(Math.random() * STARS_CONFIG.COLORS.length),
        });
      }
    };
    if (bgLayers.some((l) => l.type === "starfield")) {
      const density = bgLayers.find((l) => l.type === "starfield")?.density ?? 200;
      initStars(density);
    }

    // Main draw/game loop function
    const draw = (t: number) => {
      if (isCleanedUp) return;
      
      const rawDt = (t - lastTRef.current) / 1000;
      const dt = validateDeltaTime(rawDt, PERFORMANCE_CONFIG.MAX_DELTA_TIME);
      lastTRef.current = t;

      // Fit canvas to container
      const rect = canvas;
      const dpr = Math.max(CANVAS_CONFIG.MIN_DPR, Math.floor(window.devicePixelRatio || CANVAS_CONFIG.MIN_DPR));
      const dims = validateCanvasDimensions(
        Math.floor(rect.clientWidth || rect.width),
        Math.floor(rect.clientHeight || rect.height),
        CANVAS_CONFIG.MIN_WIDTH,
        CANVAS_CONFIG.MIN_HEIGHT
      );
      
      resizeCanvas(canvas, dims, dpr);
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!validateWorldDimensions(WORLD_CONFIG.w, WORLD_CONFIG.h)) {
        console.error("Invalid world dimensions");
        return;
      }

      const scale = Math.min(dims.width / WORLD_CONFIG.w, dims.height / WORLD_CONFIG.h);
      
      // Camera offset
      let cameraX = 0, cameraY = 0;
      if (hasCameraSystem) {
        const camera = cameraSystemRef.current.getCamera();
        cameraX = camera.x;
        cameraY = camera.y;
      }
      
      const ox = (dims.width - WORLD_CONFIG.w * scale) / 2 - cameraX * scale;
      const oy = (dims.height - WORLD_CONFIG.h * scale) / 2 - cameraY * scale;
      const worldPxW = WORLD_CONFIG.w * scale;
      const worldPxH = WORLD_CONFIG.h * scale;

      // Update/reuse renderer instances
      if (!backgroundRendererRef.current) {
        backgroundRendererRef.current = new BackgroundRenderer({
          ctx: ctx2d, scale, ox, oy, w: dims.width, h: dims.height,
          theme, gameType, bgLayers, bgConfig: spec.visual?.background,
          stars, t, dt, getPlayerEntity,
        });
      } else {
        backgroundRendererRef.current.updateContext({
          ctx: ctx2d, scale, ox, oy, w: dims.width, h: dims.height,
          theme, gameType, bgLayers, bgConfig: spec.visual?.background,
          stars, t, dt, getPlayerEntity,
        });
      }

      // Render background
      backgroundRendererRef.current.renderBackground();

      // Clip world drawing
      ctx2d.save();
      ctx2d.beginPath();
      ctx2d.rect(ox, oy, worldPxW, worldPxH);
      ctx2d.clip();

      const canSimulate = running && !gameOverRef.current;
      const player = getPlayerEntity();

      // Input handling
      if (!inputHandlerRef.current) {
        inputHandlerRef.current = new InputHandler();
      }
      
      if (canSimulate && player && initialPlayer) {
        const keys = keysRef.current;
        const space = keys[" "];
        
        inputHandlerRef.current.handlePlayerInput({
          keys,
          player,
          initialPlayer,
          dt,
          gameType,
          hasPhysicsSystem,
          physicsSystemRef,
          hasAudioSystem,
          audioSystemRef,
        });

        // Shooting
        if (!shootingHandlerRef.current) {
          shootingHandlerRef.current = new ShootingHandler();
        }
        shootingHandlerRef.current.handleShooting({
          player,
          initialPlayer,
          dt,
          space,
          gameType,
          fireCooldownRef,
          bulletsRef,
          buffsRef,
          hasParticleSystem,
          particleSystemRef,
          theme,
          playSfx,
        });
      }

      // Update game state
      if (!gameStateManagerRef.current) {
        gameStateManagerRef.current = new GameStateManager();
      }
      gameStateManagerRef.current.updateGameState({
        dt,
        running,
        gameOverRef,
        buffsRef,
        shieldRef,
      });

      // Update spawners
      if (canSimulate && hasSpawner && spawners.length > 0) {
        if (!spawnManagerRef.current) {
          spawnManagerRef.current = new SpawnManager();
        }
        spawnManagerRef.current.updateSpawners({
          dt,
          spawners,
          spawnTimerRef,
          powerupTimerRef,
          spawnedRef,
          buffsRef,
          hasScoreSystem,
          scoreSystemRef,
          spawnerConfig: spec.spawners,
        });
        spawnManagerRef.current.updateSpawnedObjects(dt, spawnedRef);
      }

      // Update bullets
      if (canSimulate && bulletsRef.current.length > 0) {
        if (!bulletManagerRef.current) {
          bulletManagerRef.current = new BulletManager();
        }
        bulletManagerRef.current.updateBullets(dt, bulletsRef);
      }

      // Update systems
      if (canSimulate) {
        const allEntities = [
          ...runtimeEntitiesRef.current,
          ...spawnedRef.current,
          ...bulletsRef.current,
        ];
        
        if (hasPhysicsSystem && spec?.scene) {
          physicsSystemRef.current.update(dt, allEntities, spec.scene.gravity);
        }
        
        if (hasParticleSystem) {
          particleSystemRef.current.update(dt);
        }
        
        if (hasScoreSystem) {
          scoreSystemRef.current.update(dt);
        }
        
        if (hasTimerSystem) {
          timerSystemRef.current.update(dt);
        }
        
        if (hasAISystem) {
          aiSystemRef.current.update(dt, allEntities);
        }
        
        if (hasAnimationSystem) {
          animationSystemRef.current.update(dt);
        }
        
        if (hasCameraSystem) {
          cameraSystemRef.current.update(dt, allEntities);
        }
        
        if (hasCollisionSystem) {
          collisionSystemRef.current.update(allEntities as OrdaxEntity[]);
        }
      }

      // Setup/reuse renderers
      if (!entityRendererRef.current) {
        entityRendererRef.current = new EntityRenderer({
          ctx: ctx2d, scale, ox, oy, theme, gameType,
          spritesRef, spritesLoaded, hasAnimationSystem, animationSystemRef,
        });
      } else {
        entityRendererRef.current.updateContext({
          ctx: ctx2d, scale, ox, oy, theme, gameType,
          spritesRef, spritesLoaded, hasAnimationSystem, animationSystemRef,
        });
      }

      if (!spawnedRendererRef.current) {
        spawnedRendererRef.current = new SpawnedRenderer({
          ctx: ctx2d, scale, ox, oy, theme, gameType: gameType || "arcade",
        });
      } else {
        spawnedRendererRef.current.updateContext({
          ctx: ctx2d, scale, ox, oy, theme, gameType: gameType || "arcade",
        });
      }

      if (!bulletRendererRef.current) {
        bulletRendererRef.current = new BulletRenderer({
          ctx: ctx2d, scale, ox, oy, theme,
        });
      } else {
        bulletRendererRef.current.updateContext({
          ctx: ctx2d, scale, ox, oy, theme,
        });
      }

      if (!uiRendererRef.current) {
        uiRendererRef.current = new UIRenderer({
          ctx: ctx2d, scale, ox, oy, theme, gameType,
          uiConfig: spec.ui, hasScoreSystem, scoreSystemRef,
          shieldRef, buffsRef, gameOverRef, hasPhysicsSystem,
        });
      } else {
        uiRendererRef.current.updateContext({
          ctx: ctx2d, scale, ox, oy, theme, gameType,
          uiConfig: spec.ui, hasScoreSystem, scoreSystemRef,
          shieldRef, buffsRef, gameOverRef, hasPhysicsSystem,
        });
      }

      // World frame
      const primaryColor = normalizeColor(theme?.primary, COLORS_CONFIG.FALLBACK.PRIMARY);
      ctx2d.strokeStyle = hslToHsla(primaryColor, CANVAS_CONFIG.FRAME.ALPHA);
      ctx2d.lineWidth = CANVAS_CONFIG.FRAME.WIDTH;
      ctx2d.strokeRect(ox, oy, WORLD_CONFIG.w * scale, WORLD_CONFIG.h * scale);

      // Render entities
      for (const e of runtimeEntitiesRef.current) {
        if (e.type === "spawner") continue;
        entityRendererRef.current!.drawEntity(e);
      }

      // Render spawned objects
      spawnedRef.current.forEach(s => spawnedRendererRef.current!.drawSpawned(s));

      // Render bullets
      bulletsRef.current.forEach(b => bulletRendererRef.current!.drawBullet(b));
      
      // Render particles
      if (hasParticleSystem) {
        ctx2d.save();
        ctx2d.translate(ox, oy);
        ctx2d.scale(scale, scale);
        particleSystemRef.current.render(ctx2d);
        ctx2d.restore();
      }

      // End world clip
      ctx2d.restore();

      // Damage flash overlay
      if (damageFlashRef.current > 0) {
        damageFlashRef.current = Math.max(0, damageFlashRef.current - dt);
        const flashAlpha = damageFlashRef.current / DAMAGE_CONFIG.FLASH.ALPHA.DIVISOR;
        ctx2d.save();
        ctx2d.globalAlpha = flashAlpha * DAMAGE_CONFIG.FLASH.ALPHA.MULTIPLIER;
        ctx2d.fillStyle = "rgba(255, 80, 60, 1)";
        ctx2d.fillRect(0, 0, dims.width, dims.height);
        ctx2d.globalAlpha = flashAlpha * DAMAGE_CONFIG.FLASH.ALPHA.MULTIPLIER;
        ctx2d.fillStyle = "rgba(255, 255, 255, 1)";
        ctx2d.fillRect(0, 0, dims.width, dims.height);
        ctx2d.restore();
      }

      // Render UI
      uiRendererRef.current!.renderUI(player);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      isCleanedUp = true;
      cancelAnimationFrame(raf);
      if (hasAudioSystem) {
        audioSystemRef.current.stopMusic("bgm");
      }
    };
  }, [
    canvasRef,
    running,
    gameType,
    theme,
    bgLayers,
    spec,
    spawners,
    hasSpawner,
    spritesLoaded,
    initialPlayer,
    getPlayerEntity,
    playSfx,
    resizeCanvas,
    hasPhysicsSystem,
    hasCollisionSystem,
    hasParticleSystem,
    hasScoreSystem,
    hasAISystem,
    hasTimerSystem,
    hasCameraSystem,
    hasAudioSystem,
    hasAnimationSystem,
    // Refs não precisam estar na dependency array
  ]);
}
