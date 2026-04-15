/**
 * useInputHandlers - Hook para handlers de input de teclado
 *
 * Extrai toda a lógica de input do componente principal,
 * seguindo SSOT (Single Source of Truth) e sem gambiarras.
 */

import { useCallback, useEffect } from "react";
import type { Keys } from "../../ordaxCanvasTypes";
import { isGameKey } from "../../ordaxCanvasTypes";

export type InputHandlersResult = {
  onDown: (e: KeyboardEvent) => void;
  onUp: (e: KeyboardEvent) => void;
};

export function useInputHandlers(keysRef: React.MutableRefObject<Keys>): InputHandlersResult {
  const onDown = useCallback(
    (e: KeyboardEvent) => {
      // PREVENT FIRST - antes de qualquer processamento
      if (isGameKey(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Update keys ref directly - no setState to avoid re-render
      keysRef.current[e.key] = true;

      // Handle quick reset on Enter when game over
      if (e.key === "Enter" && keysRef.current["gameOver"]) {
        keysRef.current["reset"] = true;
      }
    },
    [keysRef]
  );

  const onUp = useCallback(
    (e: KeyboardEvent) => {
      // PREVENT FIRST - antes de qualquer processamento
      if (isGameKey(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Update keys ref directly
      keysRef.current[e.key] = false;
    },
    [keysRef]
  );

  return { onDown, onUp };
}

/**
 * Hook para configurar os event listeners de input
 */
export function useInputEventListeners(
  onDown: (e: KeyboardEvent) => void,
  onUp: (e: KeyboardEvent) => void
): void {
  useEffect(() => {
    // Use capture phase (true) para interceptar ANTES de outros handlers
    window.addEventListener("keydown", onDown, true);
    window.addEventListener("keyup", onUp, true);

    return () => {
      window.removeEventListener("keydown", onDown, true);
      window.removeEventListener("keyup", onUp, true);
    };
  }, [onDown, onUp]);
}
