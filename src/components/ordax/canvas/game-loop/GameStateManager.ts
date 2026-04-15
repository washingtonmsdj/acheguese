/**
 * Game State Manager - Handles game state updates (buffs, shield, etc)
 */

type GameStateContext = {
  dt: number;
  running: boolean;
  gameOverRef: React.MutableRefObject<boolean>;
  buffsRef: React.MutableRefObject<{ shield: number; spread: number }>;
  shieldRef: React.MutableRefObject<{ value: number; max: number; regenPerSec: number } | null>;
};

export class GameStateManager {
  updateGameState(context: GameStateContext): void {
    const { dt, running, gameOverRef, buffsRef, shieldRef } = context;

    const canSimulate = running && !gameOverRef.current;

    if (!canSimulate) return;

    // Update buffs
    buffsRef.current.shield = Math.max(0, buffsRef.current.shield - dt);
    buffsRef.current.spread = Math.max(0, buffsRef.current.spread - dt);

    // Regenerate shield (spec-based)
    if (shieldRef.current && shieldRef.current.max > 0 && shieldRef.current.regenPerSec > 0) {
      shieldRef.current.value = Math.min(
        shieldRef.current.max,
        shieldRef.current.value + shieldRef.current.regenPerSec * dt
      );
    }
  }
}
