import { useState, useRef, useCallback, type ReactNode } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Loader2 } from "lucide-react";

const THRESHOLD = 80;
const MAX_PULL = 120;

interface Props {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const pullY = useMotionValue(0);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const indicatorOpacity = useTransform(
    pullY,
    [0, THRESHOLD * 0.5, THRESHOLD],
    [0, 0.5, 1],
  );
  const indicatorScale = useTransform(pullY, [0, THRESHOLD], [0.5, 1]);
  const indicatorRotate = useTransform(pullY, [0, MAX_PULL], [0, 360]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing) return;
      const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
      if (scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    },
    [refreshing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const dy = Math.max(0, e.touches[0].clientY - startY.current);
      // Dampen the pull
      const dampened = Math.min(MAX_PULL, dy * 0.45);
      pullY.set(dampened);
    },
    [refreshing, pullY],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || refreshing) return;
    pulling.current = false;

    if (pullY.get() >= THRESHOLD) {
      setRefreshing(true);
      pullY.set(THRESHOLD * 0.6);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    pullY.set(0);
  }, [refreshing, pullY, onRefresh]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <motion.div
        style={{
          opacity: indicatorOpacity,
          scale: indicatorScale,
          y: useTransform(pullY, (v) => v * 0.3 - 36),
        }}
        className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        <div className="h-9 w-9 rounded-full bg-card border shadow-lg flex items-center justify-center">
          {refreshing ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : (
            <motion.div style={{ rotate: indicatorRotate }}>
              <svg
                className="h-4 w-4 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v6" />
                <path d="m9 5 3-3 3 3" />
                <path d="M12 22v-6" />
                <path d="m15 19-3 3-3-3" />
              </svg>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Content with pull offset */}
      <motion.div style={{ y: useTransform(pullY, (v) => v * 0.3) }}>
        {children}
      </motion.div>
    </div>
  );
}
