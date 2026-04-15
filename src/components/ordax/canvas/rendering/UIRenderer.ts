/**
 * UI Renderer - Enhanced HUD with stylized health bar, combo score, and buff icons
 */

import { hslToHsla, normalizeCssColor } from "../colorUtils";
import { WORLD } from "../constants";
import type { OrdaxSpec, OrdaxEntity } from "@/lib/ordax/types";

type ShieldData = {
  value: number;
  max: number;
  regenPerSec: number;
} | null;

type BuffsData = { shield: number; spread: number };

type RenderContext = {
  ctx: CanvasRenderingContext2D;
  scale: number;
  ox: number;
  oy: number;
  theme: OrdaxSpec["visual"]["theme"];
  gameType: string;
  uiConfig?: OrdaxSpec["ui"];
  hasScoreSystem: boolean;
  scoreSystemRef: React.MutableRefObject<any>;
  shieldRef: React.MutableRefObject<ShieldData>;
  buffsRef?: React.MutableRefObject<BuffsData>;
  gameOverRef: React.MutableRefObject<boolean>;
  hasPhysicsSystem: boolean;
};

// ============================================================================
// DRAWING HELPERS
// ============================================================================

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawIcon(ctx: CanvasRenderingContext2D, type: string, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const hs = size / 2;

  if (type === "shield") {
    // Shield icon
    ctx.strokeStyle = "hsl(200, 100%, 70%)";
    ctx.fillStyle = "hsla(200, 100%, 70%, 0.25)";
    ctx.beginPath();
    ctx.moveTo(cx, cy - hs);
    ctx.lineTo(cx + hs, cy - hs * 0.4);
    ctx.lineTo(cx + hs, cy + hs * 0.2);
    ctx.quadraticCurveTo(cx, cy + hs, cx, cy + hs);
    ctx.quadraticCurveTo(cx, cy + hs, cx - hs, cy + hs * 0.2);
    ctx.lineTo(cx - hs, cy - hs * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (type === "spread") {
    // Spread-shot icon (three arrows)
    ctx.strokeStyle = "hsl(45, 100%, 65%)";
    ctx.fillStyle = "hsla(45, 100%, 65%, 0.25)";
    const drawArrow = (offsetX: number, angle: number) => {
      ctx.save();
      ctx.translate(cx + offsetX, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, hs * 0.5);
      ctx.lineTo(0, -hs * 0.5);
      ctx.moveTo(-hs * 0.3, -hs * 0.1);
      ctx.lineTo(0, -hs * 0.5);
      ctx.lineTo(hs * 0.3, -hs * 0.1);
      ctx.stroke();
      ctx.restore();
    };
    drawArrow(0, 0);
    drawArrow(-hs * 0.5, -0.3);
    drawArrow(hs * 0.5, 0.3);
  }

  ctx.restore();
}

// ============================================================================
// MAIN RENDERER
// ============================================================================

export class UIRenderer {
  private context: RenderContext;
  private animTime = 0;

  constructor(context: RenderContext) {
    this.context = context;
  }

  updateContext(context: Partial<RenderContext>) {
    this.context = { ...this.context, ...context };
  }

  private gameOverFadeIn = 0;
  private wasGameOver = false;

  renderUI(player: OrdaxEntity | undefined) {
    const { ctx, ox, oy, theme, gameOverRef, scale } = this.context;
    this.animTime += 0.016; // ~60fps tick

    // Track game over fade-in
    if (gameOverRef.current) {
      if (!this.wasGameOver) {
        this.gameOverFadeIn = 0;
        this.wasGameOver = true;
      }
      this.gameOverFadeIn = Math.min(1, this.gameOverFadeIn + 0.016 / 0.6); // 0.6s fade
    } else {
      this.wasGameOver = false;
      this.gameOverFadeIn = 0;
    }

    ctx.save();
    const fontFamily = (theme?.font && typeof theme.font === "string") ? theme.font : "ui-monospace, monospace";

    // ── Game Over Overlay ──
    if (gameOverRef.current && this.gameOverFadeIn > 0) {
      this.renderGameOverScreen(fontFamily);
    }

    const hudX = ox + 14;
    let hudY = oy + 14;

    // ── HUD Panel Background ──
    this.renderHUDBackground(hudX, hudY);

    // ── Score + Combo ──
    hudY = this.renderScore(hudX + 10, hudY + 8, fontFamily);

    // ── Health Bar ──
    if (player && player.props) {
      hudY = this.renderHealth(player, hudX + 10, hudY, fontFamily);
    }

    // ── Shield Bar ──
    if (this.context.shieldRef.current && this.context.shieldRef.current.max > 0) {
      hudY = this.renderShieldBar(hudX + 10, hudY, fontFamily);
    }

    // ── Buff Icons ──
    this.renderBuffIcons(hudX + 10, hudY + 4);

    ctx.restore();

    // ── Controls Hint ──
    this.renderControlsHint(fontFamily);
  }

  // ────────────────────────────────────────────────────────────────────
  // HUD BACKGROUND PANEL
  // ────────────────────────────────────────────────────────────────────

  private renderHUDBackground(x: number, y: number) {
    const { ctx } = this.context;
    const panelW = 200;
    const panelH = this.calculatePanelHeight();

    ctx.save();
    roundRect(ctx, x, y, panelW, panelH, 10);
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  private calculatePanelHeight(): number {
    let h = 16; // top padding
    if (this.context.hasScoreSystem) h += 30; // score line
    h += 36; // health bar + label
    if (this.context.shieldRef.current && this.context.shieldRef.current.max > 0) h += 26;
    const buffs = this.context.buffsRef?.current;
    if (buffs && (buffs.shield > 0 || buffs.spread > 0)) h += 30;
    h += 10; // bottom padding
    return h;
  }

  // ────────────────────────────────────────────────────────────────────
  // SCORE + COMBO
  // ────────────────────────────────────────────────────────────────────

  private renderScore(hudX: number, hudY: number, fontFamily: string): number {
    const { ctx, hasScoreSystem, scoreSystemRef } = this.context;

    if (!hasScoreSystem) return hudY;

    const score = scoreSystemRef.current.getScore();
    const combo = scoreSystemRef.current.getCombo?.() ?? 0;
    const multiplier = scoreSystemRef.current.getMultiplier?.() ?? 1;

    // Score number
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.font = `bold 18px ${fontFamily}`;
    ctx.fillText(`${score}`, hudX, hudY + 14);

    // "PTS" label
    const scoreWidth = ctx.measureText(`${score}`).width;
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = `10px ${fontFamily}`;
    ctx.fillText("PTS", hudX + scoreWidth + 5, hudY + 14);

    // Combo badge
    if (combo >= 3 && multiplier > 1) {
      const badgeText = `x${multiplier.toFixed(1)}`;
      ctx.font = `bold 13px ${fontFamily}`;
      const bw = ctx.measureText(badgeText).width + 12;

      // Pulsing glow when combo is high
      const pulse = 0.7 + Math.sin(this.animTime * 6) * 0.3;
      const comboColor = combo >= 15
        ? `hsla(0, 100%, 60%, ${pulse})`
        : combo >= 10
          ? `hsla(30, 100%, 55%, ${pulse})`
          : `hsla(55, 100%, 55%, ${pulse})`;

      const bx = hudX + scoreWidth + 30;
      const by = hudY + 2;

      roundRect(ctx, bx, by, bw, 18, 4);
      ctx.fillStyle = comboColor;
      ctx.fill();

      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.font = `bold 12px ${fontFamily}`;
      ctx.fillText(badgeText, bx + 6, by + 13);

      // Combo count small text
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = `9px ${fontFamily}`;
      ctx.fillText(`${combo} combo`, bx, by + 28);
    }

    return hudY + 26;
  }

  // ────────────────────────────────────────────────────────────────────
  // HEALTH BAR (Rounded, gradient fill, glow when low)
  // ────────────────────────────────────────────────────────────────────

  private renderHealth(player: OrdaxEntity, hudX: number, hudY: number, fontFamily: string): number {
    const { ctx, theme, uiConfig } = this.context;

    const maxHealth = (player.props.maxHealth as number | undefined) ?? 100;
    const health = clamp((player.props.health as number) ?? 100, 0, maxHealth);
    const pct = health / maxHealth;

    const barW = uiConfig?.healthBarWidth ?? 176;
    const barH = uiConfig?.healthBarHeight ?? 10;
    const thresholds = uiConfig?.healthThresholds ?? { danger: 25, warning: 50 };

    // Label
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = `10px ${fontFamily}`;
    ctx.fillText("HP", hudX, hudY + 8);

    // Value text
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = `bold 11px ${fontFamily}`;
    ctx.fillText(`${health}`, hudX + 18, hudY + 8);

    const barX = hudX;
    const barY = hudY + 14;

    // Background track
    roundRect(ctx, barX, barY, barW, barH, barH / 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fill();

    // Determine color
    const primaryColor = normalizeCssColor(theme?.primary, "hsl(186, 100%, 45%)");
    const dangerColor = "hsl(0, 84%, 60%)";
    const warningColor = "hsl(40, 100%, 55%)";

    let fillColor: string;
    if (health <= thresholds.danger) {
      fillColor = dangerColor;
    } else if (health <= thresholds.warning) {
      fillColor = warningColor;
    } else {
      fillColor = primaryColor;
    }

    // Glow effect when health is low
    if (pct < 0.3) {
      const glowPulse = 0.3 + Math.sin(this.animTime * 8) * 0.2;
      ctx.save();
      ctx.shadowColor = dangerColor;
      ctx.shadowBlur = 12 * glowPulse;
      roundRect(ctx, barX, barY, barW * pct, barH, barH / 2);
      ctx.fillStyle = hslToHsla(dangerColor, 0.6);
      ctx.fill();
      ctx.restore();
    }

    // Fill bar
    if (pct > 0) {
      ctx.save();
      // Clip to rounded track
      roundRect(ctx, barX, barY, barW, barH, barH / 2);
      ctx.clip();

      // Gradient fill
      const grad = ctx.createLinearGradient(barX, barY, barX + barW * pct, barY);
      grad.addColorStop(0, hslToHsla(fillColor, 0.95));
      grad.addColorStop(1, hslToHsla(fillColor, 0.7));
      ctx.fillStyle = grad;
      ctx.fillRect(barX, barY, barW * pct, barH);

      // Highlight shine
      const shineGrad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
      shineGrad.addColorStop(0, "rgba(255, 255, 255, 0.25)");
      shineGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = shineGrad;
      ctx.fillRect(barX, barY, barW * pct, barH / 2);

      ctx.restore();
    }

    // Border
    roundRect(ctx, barX, barY, barW, barH, barH / 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();

    return barY + barH + 6;
  }

  // ────────────────────────────────────────────────────────────────────
  // SHIELD BAR
  // ────────────────────────────────────────────────────────────────────

  private renderShieldBar(hudX: number, hudY: number, fontFamily: string): number {
    const { ctx, shieldRef } = this.context;
    const shield = shieldRef.current!;
    const pct = clamp(shield.value / shield.max, 0, 1);

    const barW = 176;
    const barH = 7;

    // Label
    ctx.fillStyle = "rgba(140, 210, 255, 0.7)";
    ctx.font = `9px ${fontFamily}`;
    ctx.fillText("SHIELD", hudX, hudY + 6);

    const barX = hudX;
    const barY = hudY + 10;

    // Background
    roundRect(ctx, barX, barY, barW, barH, barH / 2);
    ctx.fillStyle = "rgba(100, 180, 255, 0.08)";
    ctx.fill();

    // Fill
    if (pct > 0) {
      ctx.save();
      roundRect(ctx, barX, barY, barW, barH, barH / 2);
      ctx.clip();

      const grad = ctx.createLinearGradient(barX, barY, barX + barW * pct, barY);
      grad.addColorStop(0, "hsla(200, 100%, 65%, 0.85)");
      grad.addColorStop(1, "hsla(200, 100%, 50%, 0.6)");
      ctx.fillStyle = grad;
      ctx.fillRect(barX, barY, barW * pct, barH);
      ctx.restore();
    }

    // Border
    roundRect(ctx, barX, barY, barW, barH, barH / 2);
    ctx.strokeStyle = "rgba(140, 210, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    return barY + barH + 6;
  }

  // ────────────────────────────────────────────────────────────────────
  // BUFF ICONS
  // ────────────────────────────────────────────────────────────────────

  private renderBuffIcons(x: number, y: number) {
    const { ctx, buffsRef } = this.context;
    if (!buffsRef) return;

    const buffs = buffsRef.current;
    const activeBuffs: { type: string; remaining: number }[] = [];

    if (buffs.shield > 0) activeBuffs.push({ type: "shield", remaining: buffs.shield });
    if (buffs.spread > 0) activeBuffs.push({ type: "spread", remaining: buffs.spread });

    if (activeBuffs.length === 0) return;

    let bx = x;
    const iconSize = 16;
    const iconGap = 36;

    for (const buff of activeBuffs) {
      // Icon background pill
      const pillW = 32;
      const pillH = 24;
      ctx.save();
      roundRect(ctx, bx - 2, y, pillW, pillH, 6);

      // Pulsing bg
      const alpha = 0.15 + Math.sin(this.animTime * 4) * 0.05;
      ctx.fillStyle = buff.type === "shield"
        ? `hsla(200, 100%, 60%, ${alpha})`
        : `hsla(45, 100%, 60%, ${alpha})`;
      ctx.fill();

      ctx.strokeStyle = buff.type === "shield"
        ? "hsla(200, 100%, 70%, 0.3)"
        : "hsla(45, 100%, 70%, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Icon
      drawIcon(ctx, buff.type, bx + iconSize / 2 + 6, y + pillH / 2, iconSize);

      // Timer text below
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "8px ui-monospace, monospace";
      ctx.fillText(`${buff.remaining.toFixed(1)}s`, bx + 2, y + pillH + 10);

      bx += iconGap;
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // CONTROLS HINT
  // ────────────────────────────────────────────────────────────────────

  // ────────────────────────────────────────────────────────────────────
  // GAME OVER SCREEN
  // ────────────────────────────────────────────────────────────────────

  private renderGameOverScreen(fontFamily: string) {
    const { ctx, ox, oy, scale, scoreSystemRef, hasScoreSystem, theme } = this.context;
    const alpha = this.gameOverFadeIn;
    const w = WORLD.w * scale;
    const h = WORLD.h * scale;
    const cx = ox + w / 2;
    const cy = oy + h / 2;

    // Darken overlay with vignette
    ctx.save();
    const vignette = ctx.createRadialGradient(cx, cy, w * 0.15, cx, cy, w * 0.7);
    vignette.addColorStop(0, `rgba(0, 0, 0, ${0.6 * alpha})`);
    vignette.addColorStop(1, `rgba(0, 0, 0, ${0.85 * alpha})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(ox, oy, w, h);
    ctx.restore();

    // Animated scanlines
    ctx.save();
    ctx.globalAlpha = 0.04 * alpha;
    for (let sy = 0; sy < h; sy += 4) {
      ctx.fillStyle = "white";
      ctx.fillRect(ox, oy + sy, w, 1);
    }
    ctx.restore();

    // ── Main card ──
    const cardW = Math.min(320, w * 0.7);
    const cardH = 260;
    const cardX = cx - cardW / 2;
    const cardY = cy - cardH / 2 + (1 - alpha) * 30; // slide up on fade in

    ctx.save();
    ctx.globalAlpha = alpha;

    // Card bg with blur-like effect
    roundRect(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.fillStyle = "rgba(10, 10, 20, 0.85)";
    ctx.fill();

    // Card border glow
    const primaryColor = normalizeCssColor(theme?.primary, "hsl(0, 84%, 60%)");
    roundRect(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.strokeStyle = hslToHsla(primaryColor, 0.4);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top accent line
    ctx.save();
    roundRect(ctx, cardX, cardY, cardW, 4, 16);
    ctx.clip();
    const accentGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
    accentGrad.addColorStop(0, "hsl(0, 84%, 60%)");
    accentGrad.addColorStop(0.5, "hsl(30, 100%, 55%)");
    accentGrad.addColorStop(1, "hsl(0, 84%, 60%)");
    ctx.fillStyle = accentGrad;
    ctx.fillRect(cardX, cardY, cardW, 4);
    ctx.restore();

    // Skull / X icon
    const iconY = cardY + 44;
    const iconPulse = 0.85 + Math.sin(this.animTime * 3) * 0.15;
    ctx.save();
    ctx.translate(cx, iconY);
    ctx.scale(iconPulse, iconPulse);
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 60, 60, 0.15)";
    ctx.fill();
    ctx.strokeStyle = "hsl(0, 84%, 60%)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // X mark
    ctx.beginPath();
    ctx.moveTo(-7, -7);
    ctx.lineTo(7, 7);
    ctx.moveTo(7, -7);
    ctx.lineTo(-7, 7);
    ctx.strokeStyle = "hsl(0, 84%, 65%)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    // "GAME OVER" title
    const titleY = iconY + 38;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.font = `bold 26px ${fontFamily}`;
    ctx.fillText("GAME OVER", cx, titleY);

    // Divider line
    const divY = titleY + 14;
    const divW = cardW * 0.5;
    const divGrad = ctx.createLinearGradient(cx - divW / 2, divY, cx + divW / 2, divY);
    divGrad.addColorStop(0, "rgba(255,255,255,0)");
    divGrad.addColorStop(0.5, "rgba(255,255,255,0.3)");
    divGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = divGrad;
    ctx.fillRect(cx - divW / 2, divY, divW, 1);

    // Score
    if (hasScoreSystem) {
      const score = scoreSystemRef.current.getScore();
      const highScore = scoreSystemRef.current.getHighScore();

      // "SCORE" label
      const scoreY = divY + 28;
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.font = `11px ${fontFamily}`;
      ctx.fillText("SCORE", cx, scoreY);

      // Score value
      const scoreValY = scoreY + 26;
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.font = `bold 32px ${fontFamily}`;
      ctx.fillText(`${score}`, cx, scoreValY);

      // High score
      const hsY = scoreValY + 24;
      const isNewRecord = score >= highScore && score > 0;
      if (isNewRecord) {
        const recordPulse = 0.7 + Math.sin(this.animTime * 5) * 0.3;
        ctx.fillStyle = `hsla(45, 100%, 60%, ${recordPulse})`;
        ctx.font = `bold 12px ${fontFamily}`;
        ctx.fillText("★ NEW RECORD ★", cx, hsY);
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.font = `11px ${fontFamily}`;
        ctx.fillText(`BEST: ${highScore}`, cx, hsY);
      }
    }

    // Restart hint
    const hintY = cardY + cardH - 24;
    const hintPulse = 0.5 + Math.sin(this.animTime * 2.5) * 0.2;
    ctx.fillStyle = `rgba(255, 255, 255, ${hintPulse})`;
    ctx.font = `12px ${fontFamily}`;
    ctx.fillText("Press ENTER or R to restart", cx, hintY);

    ctx.textAlign = "left";
    ctx.restore();
  }


  private renderControlsHint(fontFamily: string) {
    const { ctx, ox, oy, scale, gameType, hasPhysicsSystem, gameOverRef, uiConfig } = this.context;

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = `11px ${fontFamily}`;

    const controlsHint = uiConfig?.controlsHint;
    const showSpace = gameType === "shooter" || gameType === "platformer" || hasPhysicsSystem;

    let hint: string;
    if (gameOverRef.current) {
      hint = controlsHint?.gameOver ?? "Game Over — pressione Enter ou R para reiniciar";
    } else {
      const movement = controlsHint?.movement ?? "WASD / Arrows";
      const action = controlsHint?.action ?? "Space";
      hint = showSpace ? `${movement} + ${action}` : movement;
    }

    ctx.fillText(hint, ox + 15, oy + WORLD.h * scale - 15);
  }
}
