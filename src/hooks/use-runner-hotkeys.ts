import { useEffect } from "react";

type HotkeysOpts = {
  enabled?: boolean;
  onToggleInputDebug?: () => void;
  onToggleRuntimeDebug?: () => void;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/**
 * Hotkeys globais para runners (F1/F2).
 * - F1: alterna Input Debug
 * - F2: alterna Runtime Debug
 */
export function useRunnerHotkeys({
  enabled = true,
  onToggleInputDebug,
  onToggleRuntimeDebug,
}: HotkeysOpts) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (isEditableTarget(e.target)) return;

      if (e.key === "F1") {
        if (!onToggleInputDebug) return;
        e.preventDefault();
        onToggleInputDebug();
      }

      if (e.key === "F2") {
        if (!onToggleRuntimeDebug) return;
        e.preventDefault();
        onToggleRuntimeDebug();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onToggleInputDebug, onToggleRuntimeDebug]);
}
