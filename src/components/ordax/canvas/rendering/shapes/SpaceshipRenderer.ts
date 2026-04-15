/**
 * Spaceship Shape Renderer
 */

import type { ShapeRenderer } from "./ShapeRenderer";
import type { OrdaxVisual, OrdaxVisualTheme } from "@/lib/ordax/types";
import { hslToHsla, normalizeCssColor } from "../../colorUtils";

export class SpaceshipRenderer implements ShapeRenderer {
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
    const accentColor = normalizeCssColor(theme.accent, "hsl(300, 70%, 50%)");
    const orientation = visual.orientation || "up";

    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.max(10, Math.min(w, h) / 2);

    ctx.save();
    ctx.translate(cx, cy);

    // Rotate based on orientation
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
    }

    // Ship body gradient
    const grad = ctx.createRadialGradient(0, -r * 0.25, r * 0.15, 0, 0, r);
    grad.addColorStop(0, hslToHsla(color, 0.95));
    grad.addColorStop(1, hslToHsla(color, 0.25));

    ctx.fillStyle = grad;
    ctx.strokeStyle = hslToHsla(color, 0.9);
    ctx.lineWidth = 2;

    // Ship shape (pointing UP in local space)
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);              // Nose
    ctx.lineTo(-r * 0.75, r * 0.25);       // Left wing
    ctx.lineTo(0, r * 0.1);                // Center back
    ctx.lineTo(r * 0.75, r * 0.25);        // Right wing
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = hslToHsla(accentColor, 0.55);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.1, r * 0.18, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thruster glow
    ctx.fillStyle = hslToHsla(accentColor, 0.22);
    ctx.beginPath();
    ctx.arc(0, r * 0.35, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
