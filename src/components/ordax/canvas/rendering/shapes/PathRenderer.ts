/**
 * Path Shape Renderer - Renders custom SVG paths
 */

import type { ShapeRenderer } from "./ShapeRenderer";
import type { OrdaxVisual, OrdaxVisualTheme } from "@/lib/ordax/types";
import { hslToHsla, normalizeCssColor } from "../../colorUtils";

export class PathRenderer implements ShapeRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    visual: OrdaxVisual,
    theme: OrdaxVisualTheme
  ): void {
    if (!visual.path) return;

    const color = normalizeCssColor(visual.color, theme.primary || "hsl(180, 80%, 50%)");
    const fill = visual.fill !== false;

    ctx.save();
    ctx.translate(x, y);

    // Scale path to fit w x h
    // Assuming path is defined in a 0-1 or similar coordinate space
    ctx.scale(w / 20, h / 20); // Adjust scale factor as needed

    const path = new Path2D(visual.path);

    if (fill) {
      ctx.fillStyle = hslToHsla(color, 0.8);
      ctx.fill(path);
    }

    if (visual.strokeColor) {
      const strokeColor = normalizeCssColor(visual.strokeColor, color);
      ctx.strokeStyle = hslToHsla(strokeColor, 0.9);
      ctx.lineWidth = visual.strokeWidth || 2;
      ctx.stroke(path);
    }

    ctx.restore();
  }
}
