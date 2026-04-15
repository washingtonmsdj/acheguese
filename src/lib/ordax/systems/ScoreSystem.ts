/**
 * 🏆 AAA Score System — Combo chains, multiplier tiers, per-game high scores
 *
 * Features:
 * - Combo window scales with combo length (rewards sustained play)
 * - Multiplier tiers (configurable breakpoints)
 * - Per-game high score keys (multiple games don't collide)
 * - Frame-rate independent (uses dt, not hardcoded 0.016)
 *
 * @version 2.1.0
 * @changelog
 *   - 2.1.0: SSOT compliance - imports constants from config.ts
 */

import { SCORE_CONSTANTS } from "../config";
import { safeSetItem, safeGetItem } from "@/lib/ssr-guard";

export type ScoreEvent = {
  type: string;
  points: number;
  timestamp: number;
};

export class ScoreSystem {
  private score = 0;
  private highScore = 0;
  private multiplier = 1;
  private combo = 0;
  private comboTimer = 0;
  private events: ScoreEvent[] = [];
  private storageKey: string;

  constructor(gameId = 'default') {
    this.storageKey = `ordax_highscore_${gameId}`;
  }

  addScore(points: number, type = 'default'): number {
    const finalPoints = Math.floor(points * this.multiplier);
    this.score += finalPoints;

    this.events.push({ type, points: finalPoints, timestamp: Date.now() });

    // Keep event log bounded
    if (this.events.length > 200) this.events.splice(0, this.events.length - 200);

    this.combo++;
    // Combo window grows slightly with combo length
    this.comboTimer = SCORE_CONSTANTS.BASE_COMBO_WINDOW + Math.min(SCORE_CONSTANTS.COMBO_WINDOW_MAX_BONUS, this.combo * SCORE_CONSTANTS.COMBO_WINDOW_BONUS);

    // Update multiplier based on combo
    this.updateMultiplier();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }

    return finalPoints;
  }

  update(dt: number): void {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.multiplier = 1;
      }
    }
  }

  private updateMultiplier(): void {
    for (let i = SCORE_CONSTANTS.MULTIPLIER_TIERS.length - 1; i >= 0; i--) {
      if (this.combo >= SCORE_CONSTANTS.MULTIPLIER_TIERS[i][0]) {
        this.multiplier = SCORE_CONSTANTS.MULTIPLIER_TIERS[i][1];
        return;
      }
    }
    this.multiplier = 1;
  }

  // ── Queries ───────────────────────────────────────────────────────────

  getScore(): number { return this.score; }
  getHighScore(): number { return this.highScore; }
  getMultiplier(): number { return this.multiplier; }
  getCombo(): number { return this.combo; }
  getComboTimeRemaining(): number { return Math.max(0, this.comboTimer); }
  getRecentEvents(count = 5): ScoreEvent[] { return this.events.slice(-count); }

  reset(): void {
    this.score = 0;
    this.multiplier = 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.events.length = 0;
  }

  // ── Persistence ───────────────────────────────────────────────────────

  private saveHighScore(): void {
    safeSetItem(this.storageKey, this.highScore.toString());
  }

  loadHighScore(): void {
    const saved = safeGetItem(this.storageKey);
    if (saved) this.highScore = parseInt(saved, 10) || 0;
  }
}
