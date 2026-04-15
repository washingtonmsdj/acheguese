/**
 * Shape Registry - Factory for shape renderers
 */

import type { OrdaxVisualShape } from "@/lib/ordax/types";
import type { ShapeRenderer } from "./ShapeRenderer";
import { RectRenderer } from "./RectRenderer";
import { CircleRenderer } from "./CircleRenderer";
import { TriangleRenderer } from "./TriangleRenderer";
import { CarRenderer } from "./CarRenderer";
import { SpaceshipRenderer } from "./SpaceshipRenderer";
import { PathRenderer } from "./PathRenderer";

export class ShapeRegistry {
  private renderers = new Map<string, ShapeRenderer>();

  constructor() {
    // Register default renderers
    this.register("rect", new RectRenderer());
    this.register("circle", new CircleRenderer());
    this.register("triangle", new TriangleRenderer());
    this.register("car", new CarRenderer());
    this.register("spaceship", new SpaceshipRenderer());
    this.register("path", new PathRenderer());
    
    // Platform is just a rect with specific styling
    this.register("platform", new RectRenderer());
  }

  register(shape: OrdaxVisualShape | string, renderer: ShapeRenderer): void {
    this.renderers.set(shape, renderer);
  }

  get(shape: OrdaxVisualShape | string): ShapeRenderer | undefined {
    return this.renderers.get(shape);
  }

  has(shape: OrdaxVisualShape | string): boolean {
    return this.renderers.has(shape);
  }

  // Allow users to register custom shapes
  registerCustom(name: string, renderer: ShapeRenderer): void {
    this.register(name, renderer);
  }

  // Get all registered shape names
  getRegisteredShapes(): string[] {
    return Array.from(this.renderers.keys());
  }
}
