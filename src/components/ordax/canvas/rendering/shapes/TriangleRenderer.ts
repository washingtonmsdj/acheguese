/**
 * Triangle Shape Renderer
 */

import type { ShapeRenderer } from "./ShapeRenderer";
import type { OrdaxVisual, OrdaxVisualTheme } from "@/lib/ordax/types";
import { hslToHsla, normalizeCssColor } from "../../colorUtils";

export class TriangleRenderer implements ShapeRenderer {
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
    const orientation = visual.orientation || "up";

    ctx.beginPath();

    // Draw triangle based on orientation
    switch (orientation) {
      case "up":
        ctx.moveTo(x + w / 2, y);           // Top
        ctx.lineTo(x + w, y + h);           // Bottom right
        ctx.lineTo(x, y + h);               // Bottom left
        break;
      case "down":
        ctx.moveTo(x + w / 2, y + h);       // Bottom
        ctx.lineTo(x, y);                   // Top left
        ctx.lineTo(x + w, y);               // Top right
        break;
      case "left":
        ctx.moveTo(x, y + h / 2);           // Left
        ctx.lineTo(x + w, y);               // Top right
        ctx.lineTo(x + w, y + h);           // Bottom right
        break;
      case "right":
        ctx.moveTo(x + w, y + h / 2);       // Right
        ctx.lineTo(x, y + h);               // Bottom left
        ctx.lineTo(x, y);                   // Top left
        break;
    }

    ctx.closePath();

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
