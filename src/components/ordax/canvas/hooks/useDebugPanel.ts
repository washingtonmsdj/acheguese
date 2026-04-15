/**
 * useDebugPanel - Hook para gerenciamento do painel de debug
 *
 * Extrai toda a lógica do debug panel do componente principal,
 * seguindo SSOT (Single Source of Truth) e sem gambiarras.
 */

import { useState, useCallback, useEffect } from "react";
import type { EngineDebugStats } from "../../EngineDebugPanel";
import type { OrdaxEntity } from "@/lib/ordax/types";
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
import type { Spawned, Bullet } from "../../ordaxCanvasTypes";

export type DebugPanelContext = {
  hasPhysicsSystem: boolean;
  hasCollisionSystem: boolean;
  hasParticleSystem: boolean;
  hasScoreSystem: boolean;
  hasAudioSystem: boolean;
  hasCameraSystem: boolean;
  hasUISystem: boolean;
  hasTimerSystem: boolean;
  hasAISystem: boolean;
  hasAnimationSystem: boolean;
  runtimeEntitiesRef: React.MutableRefObject<OrdaxEntity[]>;
  spawnedRef: React.MutableRefObject<Spawned[]>;
  bulletsRef: React.MutableRefObject<Bullet[]>;
  particleSystemRef: React.MutableRefObject<ParticleSystem>;
};

export type DebugPanelResult = {
  debugEnabled: boolean;
  setDebugEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  getEngineStats: () => EngineDebugStats;
};

export function useDebugPanel(ctx: DebugPanelContext): DebugPanelResult {
  const [debugEnabled, setDebugEnabled] = useState(false);

  // Toggle debug panel with backtick key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`" || e.key === "F3") {
        e.preventDefault();
        setDebugEnabled(v => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const getEngineStats = useCallback((): EngineDebugStats => {
    const activeSystems: string[] = [];
    if (ctx.hasPhysicsSystem)   activeSystems.push("PhysicsSystem");
    if (ctx.hasCollisionSystem) activeSystems.push("CollisionSystem");
    if (ctx.hasParticleSystem)  activeSystems.push("ParticleSystem");
    if (ctx.hasScoreSystem)     activeSystems.push("ScoreSystem");
    if (ctx.hasAudioSystem)     activeSystems.push("AudioSystem");
    if (ctx.hasCameraSystem)    activeSystems.push("CameraSystem");
    if (ctx.hasUISystem)        activeSystems.push("UISystem");
    if (ctx.hasTimerSystem)     activeSystems.push("TimerSystem");
    if (ctx.hasAISystem)        activeSystems.push("AISystem");
    if (ctx.hasAnimationSystem) activeSystems.push("AnimationSystem");

    return {
      activeSystems,
      entityCount:   ctx.runtimeEntitiesRef.current.filter(e => e.type !== "spawner").length,
      spawnedCount:  ctx.spawnedRef.current.length,
      bulletCount:   ctx.bulletsRef.current.length,
      particleCount: ctx.hasParticleSystem ? ctx.particleSystemRef.current.getCount() : 0,
    };
  }, [
    ctx.hasPhysicsSystem,
    ctx.hasCollisionSystem,
    ctx.hasParticleSystem,
    ctx.hasScoreSystem,
    ctx.hasAudioSystem,
    ctx.hasCameraSystem,
    ctx.hasUISystem,
    ctx.hasTimerSystem,
    ctx.hasAISystem,
    ctx.hasAnimationSystem,
    ctx.runtimeEntitiesRef,
    ctx.spawnedRef,
    ctx.bulletsRef,
    ctx.particleSystemRef,
  ]);

  return {
    debugEnabled,
    setDebugEnabled,
    getEngineStats,
  };
}
