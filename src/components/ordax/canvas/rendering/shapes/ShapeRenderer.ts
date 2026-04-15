/**
 * Shape Renderer Interface - Base for all shape renderers
 */

import type { OrdaxVisual, OrdaxVisualTheme } from "@/lib/ordax/types";

export interface ShapeRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    visual: OrdaxVisual,
    theme: OrdaxVisualTheme
  ): void;
}
