import { useEffect, useMemo, useRef, useState } from "react";

export function InputDebugOverlay({
  enabled,
  title = "Input Debug",
  getLines,
}: {
  enabled: boolean;
  title?: string;
  getLines: () => string[];
}) {
  const [lines, setLines] = useState<string[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const loop = () => {
      try {
        setLines(getLines());
      } catch {
        // ignore
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, getLines]);

  const safeLines = useMemo(() => lines.filter(Boolean).slice(0, 16), [lines]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none absolute left-3 bottom-3 z-20 rounded-md border border-border/60 bg-card/75 px-3 py-2 text-[11px] leading-4 text-card-foreground shadow backdrop-blur">
      <div className="font-semibold">{title}</div>
      <div className="mt-1 space-y-0.5 text-muted-foreground">
        {safeLines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
    </div>
  );
}
