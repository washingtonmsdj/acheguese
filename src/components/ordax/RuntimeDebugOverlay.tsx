import { useEffect, useMemo, useRef, useState } from "react";

type Stats = {
  running: boolean;
  tSeconds: number;
  lastFrameDt: number;
  fixedDtSeconds: number | null;
  accumulator: number;
  lastSubsteps: number;
  maxSubsteps: number;
};

export function RuntimeDebugOverlay({
  enabled,
  getStats,
}: {
  enabled: boolean;
  getStats: () => Stats;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [fps, setFps] = useState(0);

  const framesRef = useRef(0);
  const lastFpsTRef = useRef(performance.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const loop = () => {
      try {
        setStats(getStats());
      } catch {
        // ignore
      }

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

  const lines = useMemo(() => {
    if (!stats) return [];
    const dtMs = (stats.lastFrameDt * 1000).toFixed(2);
    const fixedMs = stats.fixedDtSeconds ? (stats.fixedDtSeconds * 1000).toFixed(2) : "—";
    const accMs = (stats.accumulator * 1000).toFixed(2);
    return [
      `FPS: ${fps}`,
      `dt: ${dtMs}ms`,
      `fixed: ${fixedMs}ms`,
      `substeps: ${stats.lastSubsteps}/${stats.maxSubsteps}`,
      `acc: ${accMs}ms`,
      `t: ${stats.tSeconds.toFixed(2)}s`,
      `running: ${stats.running ? "yes" : "no"}`,
    ];
  }, [fps, stats]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-md border border-border/60 bg-card/75 px-3 py-2 text-[11px] leading-4 text-card-foreground shadow backdrop-blur">
      <div className="font-semibold">Ordax Runtime Debug</div>
      <div className="mt-1 space-y-0.5 text-muted-foreground">
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
    </div>
  );
}
