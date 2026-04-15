/**
 * Rectangle Shape Renderer
 */

import type { ShapeRenderer } from "./ShapeRenderer";
import type { OrdaxVisual, OrdaxVisualTheme } from "@/lib/ordax/types";
import { hslToHsla, normalizeCssColor } from "../../colorUtils";

export class RectRenderer implements ShapeRenderer {
  private drawRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    const typedCtx = ctx as unknown as { roundRect?: (x: number, y: number, w: number, h: number, rr: number) => void; arcTo?: (x1: number, y1: number, x2: number, y2: number, r: number) => void; };
    if (typeof typedCtx.roundRect === "function") {
      typedCtx.roundRect(x, y, w, h, rr);
      return;
    }

    if (typeof typedCtx.arcTo !== "function") {
      ctx.rect(x, y, w, h);
      return;
    }

    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    visual: OrdaxVisual,
    theme: OrdaxVisualTheme
  ): void {
    const color = normalizeCssColor(visual.color, theme.primary || "hsl(180, 80%, 50%)");
    const fill = visual.fill !== false; // Default true

    if (fill) {
      ctx.fillStyle = hslToHsla(color, 0.8);
      ctx.beginPath();
      this.drawRoundedRectPath(ctx, x, y, w, h, 6);
      ctx.fill();
    }

    if (visual.strokeColor) {
      const strokeColor = normalizeCssColor(visual.strokeColor, color);
      ctx.strokeStyle = hslToHsla(strokeColor, 0.9);
      ctx.lineWidth = visual.strokeWidth || 2;
      ctx.beginPath();
      this.drawRoundedRectPath(ctx, x, y, w, h, 6);
      ctx.stroke();
    }
  }
}
