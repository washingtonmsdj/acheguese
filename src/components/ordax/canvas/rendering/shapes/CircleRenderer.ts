/**
 * Circle Shape Renderer
 */

import type { ShapeRenderer } from "./ShapeRenderer";
import type { OrdaxVisual, OrdaxVisualTheme } from "@/lib/ordax/types";
import { hslToHsla, normalizeCssColor } from "../../colorUtils";

export class CircleRenderer implements ShapeRenderer {
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
    const fill = visual.fill !== false;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const radius = Math.min(w, h) / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);

    if (fill) {
      ctx.fillStyle = hslToHsla(color, 0.8);
      ctx.fill();
    }

    if (visual.strokeColor) {
      const strokeColor = normalizeCssColor(visual.strokeColor, color);
      ctx.strokeStyle = hslToHsla(strokeColor, 0.9);
      ctx.lineWidth = visual.strokeWidth || 2;
      ctx.stroke();
    }
  }
}
