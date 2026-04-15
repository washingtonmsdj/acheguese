/**
 * Spawned Objects Renderer - Handles rendering of spawned game objects (enemies, asteroids, powerups)
 */

import { hslToHsla, normalizeCssColor } from "../colorUtils";
import type { OrdaxSpec } from "@/lib/ordax/types";

type Spawned = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  vx?: number;
  hp?: number;
  variant?: "scout" | "tank" | "sniper";
  kind?: "shield" | "spread";
  dead?: boolean;
};

type RenderContext = {
  ctx: CanvasRenderingContext2D;
  scale: number;
  ox: number;
  oy: number;
  theme: OrdaxSpec["visual"]["theme"];
  gameType?: string;
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export class SpawnedRenderer {
  private context: RenderContext;

  constructor(context: RenderContext) {
    this.context = context;
  }

  updateContext(context: Partial<RenderContext>) {
    this.context = { ...this.context, ...context };
  }

  drawSpawned(s: Spawned) {
    if (s.dead) return;

    const { ctx, scale, ox, oy, theme } = this.context;

    if (!isFiniteNumber(s.x) || !isFiniteNumber(s.y) || !isFiniteNumber(s.w) || !isFiniteNumber(s.h)) return;

    const x = ox + (s.x - s.w / 2) * scale;
    const y = oy + (s.y - s.h / 2) * scale;
    const ew = s.w * scale;
    const eh = s.h * scale;

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(ew) || !Number.isFinite(eh)) return;
    if (ew <= 0 || eh <= 0) return;

    const accentColor = normalizeCssColor(theme?.accent, "hsl(300, 70%, 50%)");

    if (s.type === "powerup") {
      this.drawPowerup(s, x, y, ew, eh, accentColor);
    } else if (s.type === "asteroid") {
      this.drawAsteroid(x, y, ew, eh);
    } else if (s.type === "enemy" && this.context.gameType === "racing") {
      this.drawEnemyCar(s, x, y, ew, eh, accentColor);
    } else if (s.type === "enemy") {
      this.drawEnemy(s, x, y, ew, eh, accentColor);
    } else {
      this.drawGenericSpawned(x, y, ew, eh, accentColor);
    }
  }

  private drawPowerup(s: Spawned, x: number, y: number, ew: number, eh: number, accentColor: string) {
    const { ctx, theme } = this.context;
    const primaryColor = (theme?.primary && typeof theme.primary === "string") ? theme.primary : "hsl(200, 80%, 50%)";
    const isShield = s.kind === "shield";
    const col = isShield ? primaryColor : accentColor;

    const cx = x + ew / 2;
    const cy = y + eh / 2;
    const r = Math.min(ew, eh) / 2;
    const t = Date.now() / 1000;

    // Pulsing outer glow
    const pulseAlpha = 0.12 + 0.08 * Math.sin(t * 3);
    const glowR = r * 1.8;
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, glowR);
    glow.addColorStop(0, hslToHsla(col, pulseAlpha * 2));
    glow.addColorStop(1, hslToHsla(col, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Diamond background
    ctx.fillStyle = hslToHsla(col, 0.25);
    ctx.strokeStyle = hslToHsla(col, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.9);
    ctx.lineTo(cx + r * 0.9, cy);
    ctx.lineTo(cx, cy + r * 0.9);
    ctx.lineTo(cx - r * 0.9, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Icon
    ctx.save();
    ctx.translate(cx, cy);
    if (isShield) {
      this.drawShieldIcon(ctx, r * 0.5, col);
    } else {
      this.drawSpreadIcon(ctx, r * 0.5, col);
    }
    ctx.restore();

    // Floating bob animation
    // (already handled by spawn y position in game loop)

    // Sparkle particles around powerup
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const angle = t * 1.5 + (i * Math.PI) / 2;
      const dist = r * 0.7 + Math.sin(t * 4 + i) * r * 0.15;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      const sparkleSize = 1.5 + Math.sin(t * 5 + i * 2) * 0.5;
      ctx.fillStyle = hslToHsla(col, 0.7 + Math.sin(t * 3 + i) * 0.3);
      ctx.fillRect(sx - sparkleSize / 2, sy - sparkleSize / 2, sparkleSize, sparkleSize);
    }
    ctx.restore();
  }

  /** Shield icon: a small shield shape */
  private drawShieldIcon(ctx: CanvasRenderingContext2D, size: number, color: string) {
    ctx.fillStyle = hslToHsla(color, 0.85);
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.5;
    const s = size;

    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 1.1, -s * 0.6, s, 0);
    ctx.quadraticCurveTo(s * 0.6, s * 0.8, 0, s * 1.1);
    ctx.quadraticCurveTo(-s * 0.6, s * 0.8, -s, 0);
    ctx.quadraticCurveTo(-s * 1.1, -s * 0.6, 0, -s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner highlight
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.25, s * 0.35, s * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Spread shot icon: three diverging arrows */
  private drawSpreadIcon(ctx: CanvasRenderingContext2D, size: number, color: string) {
    ctx.strokeStyle = hslToHsla(color, 0.9);
    ctx.fillStyle = hslToHsla(color, 0.85);
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    const s = size;

    const angles = [-Math.PI / 6, 0, Math.PI / 6]; // three spread directions (upward)
    for (const angle of angles) {
      const dx = Math.sin(angle) * s * 0.9;
      const dy = -Math.cos(angle) * s * 0.9;
      // Arrow line
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.lineTo(dx, dy);
      ctx.stroke();
      // Arrow head
      ctx.beginPath();
      ctx.arc(dx, dy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawAsteroid(x: number, y: number, ew: number, eh: number) {
    const { ctx } = this.context;

    ctx.fillStyle = "rgba(150, 150, 150, 0.4)";
    ctx.strokeStyle = "rgba(200, 200, 200, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + ew / 2, y + eh / 2, Math.max(1, ew / 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Add some detail
    ctx.fillStyle = "rgba(100, 100, 100, 0.6)";
    ctx.beginPath();
    ctx.arc(x + ew / 2 - ew * 0.2, y + eh / 2 - eh * 0.15, ew * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawEnemy(s: Spawned, x: number, y: number, ew: number, eh: number, accentColor: string) {
    const { ctx } = this.context;
    const cx = x + ew / 2;
    const cy = y + eh / 2;
    const r = Math.max(8, Math.min(ew, eh) / 2);

    if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(r)) return;

    const grad = ctx.createRadialGradient(cx, cy + r * 0.25, r * 0.15, cx, cy, r);
    grad.addColorStop(0, hslToHsla(accentColor, 0.95));
    grad.addColorStop(1, hslToHsla(accentColor, 0.25));

    ctx.fillStyle = grad;
    ctx.strokeStyle = hslToHsla(accentColor, 0.9);
    ctx.lineWidth = 2;

    ctx.beginPath();
    // Nose pointing DOWN
    ctx.moveTo(cx, cy + r * 0.95);
    // Left wing
    ctx.lineTo(cx - r * 0.75, cy - r * 0.25);
    // Center back
    ctx.lineTo(cx, cy - r * 0.1);
    // Right wing
    ctx.lineTo(cx + r * 0.75, cy - r * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = hslToHsla(accentColor, 0.55);
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.1, r * 0.18, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Variant detail (tiny stripe)
    if (s.variant) {
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      const stripeW = s.variant === "tank" ? r * 0.65 : r * 0.45;
      ctx.fillRect(cx - stripeW / 2, cy - r * 0.15, stripeW, 3);
    }
  }

  private drawGenericSpawned(x: number, y: number, ew: number, eh: number, accentColor: string) {
    const { ctx } = this.context;

    ctx.fillStyle = hslToHsla(accentColor, 0.25);
    ctx.strokeStyle = hslToHsla(accentColor, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + ew / 2, y + eh / 2, Math.max(1, ew / 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private drawEnemyCar(s: Spawned, x: number, y: number, ew: number, eh: number, accentColor: string) {
    const { ctx } = this.context;
    const cx = x + ew / 2;
    const cy = y + eh / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI); // facing down

    const bodyW = ew * 0.72;
    const bodyH = eh * 0.92;
    const bx = -bodyW / 2;
    const by = -bodyH / 2;

    // Variant colors
    const variantColors: Record<string, string> = {
      scout: "hsl(30, 90%, 55%)",   // orange
      tank: "hsl(0, 75%, 45%)",     // dark red
      sniper: "hsl(270, 70%, 55%)", // purple
    };
    const carColor = variantColors[s.variant ?? ""] ?? accentColor;

    // Body
    ctx.fillStyle = hslToHsla(carColor, 0.65);
    ctx.strokeStyle = hslToHsla(carColor, 0.95);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bodyW, bodyH, 7);
    ctx.fill();
    ctx.stroke();

    // Windshield
    ctx.fillStyle = "rgba(10, 20, 40, 0.6)";
    ctx.beginPath();
    ctx.roundRect(bx + bodyW * 0.15, by + bodyH * 0.16, bodyW * 0.7, bodyH * 0.2, 5);
    ctx.fill();

    // Taillights (red glow)
    ctx.fillStyle = "rgba(255, 50, 50, 0.7)";
    ctx.fillRect(bx + bodyW * 0.1, by + bodyH * 0.88, bodyW * 0.18, bodyH * 0.06);
    ctx.fillRect(bx + bodyW * 0.72, by + bodyH * 0.88, bodyW * 0.18, bodyH * 0.06);

    // Tires
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    const tw = bodyW * 0.16;
    const th = bodyH * 0.18;
    ctx.fillRect(bx - tw * 0.25, by + bodyH * 0.18, tw, th);
    ctx.fillRect(bx + bodyW - tw * 0.75, by + bodyH * 0.18, tw, th);
    ctx.fillRect(bx - tw * 0.25, by + bodyH * 0.64, tw, th);
    ctx.fillRect(bx + bodyW - tw * 0.75, by + bodyH * 0.64, tw, th);

    // HP indicator stripe on top
    if (s.hp && s.hp > 1) {
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      for (let i = 0; i < Math.min(s.hp, 5); i++) {
        ctx.fillRect(bx + bodyW * 0.3 + i * 6, by + bodyH * 0.42, 4, 3);
      }
    }

    ctx.restore();
  }
}
