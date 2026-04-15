/**
 * Bullet Renderer - Handles rendering of bullets
 */

import { hslToHsla, normalizeCssColor } from "../colorUtils";
import type { OrdaxSpec } from "@/lib/ordax/types";

type Bullet = {
  id: string;
  type: "bullet";
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  dead?: boolean;
};

type RenderContext = {
  ctx: CanvasRenderingContext2D;
  scale: number;
  ox: number;
  oy: number;
  theme: OrdaxSpec["visual"]["theme"];
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export class BulletRenderer {
  private context: RenderContext;

  constructor(context: RenderContext) {
    this.context = context;
  }

  updateContext(context: Partial<RenderContext>) {
    this.context = { ...this.context, ...context };
  }

  drawBullet(b: Bullet) {
    if (b.dead) return;

    const { ctx, scale, ox, oy, theme } = this.context;

    if (!isFiniteNumber(b.x) || !isFiniteNumber(b.y) || !isFiniteNumber(b.w) || !isFiniteNumber(b.h)) return;

    const x = ox + (b.x - b.w / 2) * scale;
    const y = oy + (b.y - b.h / 2) * scale;
    const ew = b.w * scale;
    const eh = b.h * scale;

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(ew) || !Number.isFinite(eh)) return;
    if (ew <= 0 || eh <= 0) return;

    const primaryColor = normalizeCssColor(theme?.primary, "hsl(200, 80%, 50%)");
    ctx.fillStyle = hslToHsla(primaryColor, 0.85);
    ctx.strokeStyle = hslToHsla(primaryColor, 0.95);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, ew, eh, 3);
    ctx.fill();
    ctx.stroke();
  }
}
