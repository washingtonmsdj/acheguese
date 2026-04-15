/**
 * Car Shape Renderer - Top-down car visual
 */

import type { ShapeRenderer } from "./ShapeRenderer";
import type { OrdaxVisual, OrdaxVisualTheme } from "@/lib/ordax/types";
import { hslToHsla, normalizeCssColor } from "../../colorUtils";

export class CarRenderer implements ShapeRenderer {
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
    const orientation = visual.orientation || "up";

    // Save context for rotation
    ctx.save();

    // Rotate based on orientation
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.translate(cx, cy);

    switch (orientation) {
      case "down":
        ctx.rotate(Math.PI);
        break;
      case "left":
        ctx.rotate(-Math.PI / 2);
        break;
      case "right":
        ctx.rotate(Math.PI / 2);
        break;
      // "up" is default (no rotation)
    }

    // Draw car centered at origin (will be rotated)
    const bodyW = w * 0.72;
    const bodyH = h * 0.92;
    const bodyX = -bodyW / 2;
    const bodyY = -bodyH / 2;

    // Car body
    ctx.fillStyle = hslToHsla(color, 0.55);
    ctx.strokeStyle = hslToHsla(color, 0.95);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bodyX, bodyY, bodyW, bodyH, 8);
    ctx.fill();
    ctx.stroke();

    // Windshield
    ctx.fillStyle = "rgba(10, 20, 30, 0.55)";
    ctx.beginPath();
    ctx.roundRect(
      bodyX + bodyW * 0.18,
      bodyY + bodyH * 0.18,
      bodyW * 0.64,
      bodyH * 0.22,
      6
    );
    ctx.fill();

    // Headlights
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.fillRect(bodyX + bodyW * 0.12, bodyY + bodyH * 0.06, bodyW * 0.14, bodyH * 0.06);
    ctx.fillRect(bodyX + bodyW * 0.74, bodyY + bodyH * 0.06, bodyW * 0.14, bodyH * 0.06);

    // Tires
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    const tw = bodyW * 0.16;
    const th = bodyH * 0.18;
    ctx.fillRect(bodyX - tw * 0.25, bodyY + bodyH * 0.18, tw, th);
    ctx.fillRect(bodyX + bodyW - tw * 0.75, bodyY + bodyH * 0.18, tw, th);
    ctx.fillRect(bodyX - tw * 0.25, bodyY + bodyH * 0.64, tw, th);
    ctx.fillRect(bodyX + bodyW - tw * 0.75, bodyY + bodyH * 0.64, tw, th);

    ctx.restore();
  }
}
