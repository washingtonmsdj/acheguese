import { scheduleBrowserIdleWork } from "./browserIdle";

export const PUBLIC_ROOT_MAP_READY_EVENT = "acheguese:public-root-map-ready";

let publicRootMapReady = false;

/**
 * Signals that the public-root MapLibre surface produced its first usable map.
 * The flag is module-local so late subscribers in the same SPA session do not
 * miss the one-shot event.
 */
export function markPublicRootMapReady(): void {
  if (publicRootMapReady) return;
  publicRootMapReady = true;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PUBLIC_ROOT_MAP_READY_EVENT));
  }
}

/**
 * Keeps non-critical public-root work behind the map without risking an
 * indefinite wait. Once the map is ready (or the safety timeout expires), the
 * task is still scheduled through browser idle time.
 */
export function scheduleAfterPublicRootMap(
  task: () => void,
  options: {
    maxWaitMs?: number;
    idleTimeoutMs?: number;
    idleFallbackDelayMs?: number;
  } = {},
): () => void {
  if (typeof window === "undefined") {
    task();
    return () => undefined;
  }

  const maxWaitMs = options.maxWaitMs ?? 3000;
  const idleTimeoutMs = options.idleTimeoutMs ?? 2200;
  const idleFallbackDelayMs = options.idleFallbackDelayMs ?? 900;

  let cancelled = false;
  let cancelIdleWork: (() => void) | null = null;
  let timeoutId: number | null = null;

  const cleanup = () => {
    window.removeEventListener(PUBLIC_ROOT_MAP_READY_EVENT, onMapReady);
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const schedule = () => {
    if (cancelled || cancelIdleWork) return;
    cleanup();
    cancelIdleWork = scheduleBrowserIdleWork(
      () => {
        if (!cancelled) task();
      },
      {
        timeoutMs: idleTimeoutMs,
        fallbackDelayMs: idleFallbackDelayMs,
      },
    );
  };

  const onMapReady = () => schedule();

  if (publicRootMapReady) {
    schedule();
  } else {
    window.addEventListener(PUBLIC_ROOT_MAP_READY_EVENT, onMapReady, { once: true });
    timeoutId = window.setTimeout(schedule, maxWaitMs);
  }

  return () => {
    cancelled = true;
    cleanup();
    cancelIdleWork?.();
  };
}
