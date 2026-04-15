/**
 * useAISetup - Hook para setup de AI
 * 
 * Extrai a lógica de setup de AI do componente principal,
 * seguindo SSOT (Single Source of Truth) e sem gambiarras.
 */

import { useCallback } from "react";
import { AISystem } from "@/lib/ordax/systems/AISystem";
import type { OrdaxEntity } from "@/lib/ordax/types";
import { ENEMY_CONFIG } from "../../ordaxCanvasConfig";

export type AISetupContext = {
  hasAISystem: boolean;
  aiSystemRef: React.MutableRefObject<AISystem>;
  entities: OrdaxEntity[];
};

export function useAISetup() {
  const setupAI = useCallback((ctx: AISetupContext) => {
    if (!ctx.hasAISystem) return;

    const enemies = ctx.entities.filter((e) => e.type === "enemy");
    enemies.forEach((enemy) => {
      ctx.aiSystemRef.current.register(enemy.id, "chase", ENEMY_CONFIG.AI_CHASE_SPEED);
    });
  }, []);

  return { setupAI };
}
