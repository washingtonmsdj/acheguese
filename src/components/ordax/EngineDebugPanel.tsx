import { useEffect, useRef, useState } from "react";

export type EngineDebugStats = {
  activeSystems: string[];
  entityCount: number;
  spawnedCount: number;
  bulletCount: number;
  particleCount: number;
};

type Props = {
  enabled: boolean;
  getStats: () => EngineDebugStats;
};

const SYSTEM_COLORS: Record<string, string> = {
  PhysicsSystem:   "text-blue-400",
  CollisionSystem: "text-yellow-400",
  ParticleSystem:  "text-pink-400",
  ScoreSystem:     "text-green-400",
  AudioSystem:     "text-purple-400",
  CameraSystem:    "text-cyan-400",
  UISystem:        "text-orange-400",
  TimerSystem:     "text-red-400",
  AISystem:        "text-emerald-400",
  AnimationSystem: "text-indigo-400",
};

const ALL_SYSTEMS = Object.keys(SYSTEM_COLORS);

export function EngineDebugPanel({ enabled, getStats }: Props) {
  const [stats, setStats] = useState<EngineDebugStats | null>(null);
  const [fps, setFps] = useState(0);

  const framesRef    = useRef(0);
  const lastFpsTRef  = useRef(performance.now());
  const rafRef       = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const loop = () => {
      try { setStats(getStats()); } catch { /* ignore */ }

      const now = performance.now();
      framesRef.current += 1;
      const elapsed = now - lastFpsTRef.current;
      if (elapsed >= 500) {
        setFps(Math.round((framesRef.current * 1000) / elapsed));
        framesRef.current = 0;
        lastFpsTRef.current = now;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, getStats]);

  if (!enabled || !stats) return null;

  const fpsColor =
    fps >= 55 ? "text-green-400" :
    fps >= 30 ? "text-yellow-400" :
    "text-red-400";

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-20 min-w-[168px] rounded-lg border border-border/50 bg-background/80 px-3 py-2.5 text-[11px] leading-4 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-3 border-b border-border/40 pb-1.5">
        <span className="font-semibold tracking-wide text-foreground">Engine Debug</span>
        <span className={`font-mono font-bold tabular-nums ${fpsColor}`}>{fps} FPS</span>
      </div>

      {/* Entity counts */}
      <div className="mb-2 space-y-0.5 border-b border-border/40 pb-2">
        <Row label="Entities"  value={stats.entityCount}   color="text-foreground" />
        <Row label="Spawned"   value={stats.spawnedCount}  color="text-muted-foreground" />
        <Row label="Bullets"   value={stats.bulletCount}   color="text-muted-foreground" />
        <Row label="Particles" value={stats.particleCount} color="text-muted-foreground" />
      </div>

      {/* Systems grid */}
      <div className="space-y-0.5">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Systems
        </div>
        {ALL_SYSTEMS.map((sys) => {
          const active = stats.activeSystems.includes(sys);
          const label  = sys.replace("System", "");
          const col    = SYSTEM_COLORS[sys] ?? "text-muted-foreground";
          return (
            <div key={sys} className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${active ? "bg-current" : "bg-muted-foreground/30"} ${active ? col : ""}`} />
              <span className={active ? col : "text-muted-foreground/40"}>
                {label}
              </span>
              <span className={`ml-auto text-[10px] ${active ? "text-green-400" : "text-muted-foreground/30"}`}>
                {active ? "ON" : "OFF"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
