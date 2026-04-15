/**
 * Entity Renderer - Handles rendering of game entities (data-driven)
 */

import type { OrdaxEntity, OrdaxSpec, OrdaxVisual } from "@/lib/ordax/types";
import { hslToHsla, normalizeCssColor } from "../colorUtils";
import { ShapeRegistry } from "./shapes/ShapeRegistry";

type RenderContext = {
  ctx: CanvasRenderingContext2D;
  scale: number;
  ox: number;
  oy: number;
  theme: OrdaxSpec["visual"]["theme"];
  gameType: OrdaxSpec["gameType"]; // ✅ ADICIONADO: gameType para inferência correta
  spritesRef: React.MutableRefObject<Map<string, HTMLImageElement>>;
  spritesLoaded: boolean;
  hasAnimationSystem: boolean;
  animationSystemRef: unknown;
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export class EntityRenderer {
  private context: RenderContext;
  private shapeRegistry: ShapeRegistry;

  constructor(context: RenderContext) {
    this.context = context;
    this.shapeRegistry = new ShapeRegistry();
  }

  updateContext(context: Partial<RenderContext>) {
    this.context = { ...this.context, ...context };
  }

  drawEntity(e: OrdaxEntity) {
    const { ctx, scale, ox, oy, spritesRef, spritesLoaded, hasAnimationSystem, animationSystemRef } = this.context;

    if (!isFiniteNumber(e.x) || !isFiniteNumber(e.y) || !isFiniteNumber(e.w) || !isFiniteNumber(e.h)) return;

    const x = ox + (e.x - e.w / 2) * scale;
    const y = oy + (e.y - e.h / 2) * scale;
    const ew = e.w * scale;
    const eh = e.h * scale;

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(ew) || !Number.isFinite(eh)) return;
    if (ew <= 0 || eh <= 0) return;

    // Priority 1: Sprite (if available)
    const sprite = spritesRef.current.get(e.id);
    if (sprite && spritesLoaded && e.sprite) {
      this.drawSprite(e, sprite, x, y, ew, eh, hasAnimationSystem, animationSystemRef);
      return;
    }

    // Priority 2: Visual (data-driven)
    if (e.visual) {
      this.drawVisual(e, x, y, ew, eh);
      return;
    }

    // Priority 3: Infer visual from type (backward compatibility)
    const inferredVisual = this.inferVisualFromEntity(e);
    this.drawVisual({ ...e, visual: inferredVisual }, x, y, ew, eh);
  }

  private drawSprite(
    e: OrdaxEntity,
    sprite: HTMLImageElement,
    x: number,
    y: number,
    ew: number,
    eh: number,
    hasAnimationSystem: boolean,
    animationSystemRef: unknown
  ) {
    const { ctx } = this.context;
    const frame = hasAnimationSystem ? animationSystemRef.current.getCurrentFrame(e.id) : null;

    if (frame) {
      ctx.drawImage(sprite, frame.x, frame.y, frame.w, frame.h, x, y, ew, eh);
    } else {
      ctx.drawImage(sprite, x, y, ew, eh);
    }
  }

  private drawVisual(e: OrdaxEntity, x: number, y: number, w: number, h: number) {
    const { ctx, theme } = this.context;
    const visual = e.visual!;

    const renderer = this.shapeRegistry.get(visual.shape);

    if (renderer) {
      renderer.render(ctx, x, y, w, h, visual, theme || {});
    } else {
      // Fallback: generic shape
      this.drawGenericShape(x, y, w, h, visual);
    }
  }

  private drawGenericShape(x: number, y: number, w: number, h: number, visual: OrdaxVisual) {
    const { ctx, theme } = this.context;
    const color = normalizeCssColor(visual.color, theme?.primary || "hsl(180, 80%, 50%)");

    ctx.fillStyle = hslToHsla(color, 0.6);
    ctx.strokeStyle = hslToHsla(color, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();
  }

  /**
   * Infer visual from entity type/props (backward compatibility)
   * This allows old specs without 'visual' field to still render correctly
   * 
   * ✅ CORREÇÃO: Usa gameType para inferir shape correto ao invés de hardcode
   */
  private inferVisualFromEntity(e: OrdaxEntity): OrdaxVisual {
    const { theme, gameType } = this.context;
    const primaryColor = theme?.primary || "hsl(180, 80%, 50%)";
    const accentColor = theme?.accent || "hsl(300, 70%, 50%)";

    const isPlayer = e.type === "player" || e.id === "player";
    const isNPC = e.type === "npc";
    const isEnemy = e.type.includes("enemy") || e.id.includes("enemy");

    // Player inference
    if (isPlayer) {
      // Check explicit vehicle props first (highest priority)
      if (e.props?.vehicle === "car" || e.props?.vehicleType === "car") {
        return {
          shape: "car",
          orientation: "up",
          color: primaryColor,
        };
      }
      if (e.props?.vehicle === "spaceship" || e.props?.vehicleType === "spaceship") {
        return {
          shape: "spaceship",
          orientation: "up",
          color: primaryColor,
        };
      }
      
      // ✅ CORREÇÃO: Inferir shape baseado no gameType (ao invés de hardcode spaceship)
      switch (gameType) {
        case "racing":
          return {
            shape: "car",
            orientation: "up",
            color: primaryColor,
          };
        case "shooter":
          return {
            shape: "spaceship",
            orientation: "up",
            color: primaryColor,
          };
        case "platformer":
        case "puzzle":
        case "sports":
        case "topdown":
          return {
            shape: "circle",
            color: primaryColor,
          };
        default:
          // ✅ Default genérico (não spaceship!)
          return {
            shape: "circle",
            color: primaryColor,
          };
      }
    }

    // NPC inference
    if (isNPC) {
      const npcColor = (e.props?.color && typeof e.props.color === 'string') 
        ? e.props.color 
        : accentColor;
      
      // ✅ CORREÇÃO: Inferir shape baseado no gameType
      switch (gameType) {
        case "racing":
          return {
            shape: "car",
            orientation: "down",
            color: npcColor,
          };
        case "shooter":
          return {
            shape: "spaceship",
            orientation: "down",
            color: npcColor,
          };
        default:
          return {
            shape: "circle",
            color: npcColor,
          };
      }
    }

    // Enemy inference
    if (isEnemy) {
      // ✅ CORREÇÃO: Inferir shape baseado no gameType
      switch (gameType) {
        case "racing":
          return {
            shape: "car",
            orientation: "down",
            color: accentColor,
          };
        case "shooter":
          return {
            shape: "triangle",
            orientation: "down",
            color: accentColor,
          };
        case "platformer":
          return {
            shape: "rect",
            color: accentColor,
          };
        default:
          return {
            shape: "triangle",
            orientation: "down",
            color: accentColor,
          };
      }
    }

    // Wall/obstacle
    if (e.type === "wall" || e.type === "obstacle") {
      return {
        shape: "rect",
        color: "rgba(255,255,255,0.2)",
        strokeColor: "rgba(255,255,255,0.4)",
      };
    }

    // Platform - COR CORRIGIDA: usar cor contrastante ao invés de primaryColor
    if (e.type === "platform") {
      return {
        shape: "platform",
        color: "hsl(120, 60%, 45%)", // ✅ CORRIGIDO: verde visível ao invés de azul do fundo
        strokeColor: "hsl(120, 80%, 30%)", // Borda verde escura
      };
    }

    // Coin/collectible
    if (e.type === "coin" || e.type === "collectible") {
      return {
        shape: "circle",
        color: "hsl(60, 100%, 50%)",
        strokeColor: "hsl(45, 100%, 40%)",
      };
    }

    // Default: rect
    return {
      shape: "rect",
      color: primaryColor,
      strokeColor: primaryColor,
    };
  }
}
