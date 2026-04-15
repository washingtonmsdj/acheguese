/**
 * usePlayerState - Hook para gerenciamento do estado do jogador
 *
 * Extrai callbacks de dano, buffs e escudo do componente principal,
 * seguindo SSOT (Single Source of Truth) e sem gambiarras.
 */

import { useCallback } from "react";
import { toast } from "sonner";
import type { OrdaxEntity } from "@/lib/ordax/types";
import { VALIDATION_CONFIG, DAMAGE_CONFIG, BUFFS_CONFIG, MESSAGES_CONFIG } from "../../ordaxCanvasConfig";
import { validateHealth, validateDamage } from "../../ordaxCanvasUtils";
import type { ShieldState, Buffs } from "../../ordaxCanvasTypes";

export type PlayerStateContext = {
  shieldRef: React.MutableRefObject<ShieldState | null>;
  buffsRef: React.MutableRefObject<Buffs>;
  gameOverRef: React.MutableRefObject<boolean>;
  damageFlashRef: React.MutableRefObject<number>;
  getPlayerEntity: () => OrdaxEntity | null;
  playSfx: (sound: string) => void;
};

export type PlayerStateResult = {
  applyDamage: (amount: number) => void;
  applyBuffs: (kind: string) => void;
};

export function usePlayerState(ctx: PlayerStateContext): PlayerStateResult {
  const applyDamage = useCallback((amount: number) => {
    const validDamage = validateDamage(amount, VALIDATION_CONFIG.MIN_DAMAGE);
    if (validDamage === 0) return;

    let remaining = validDamage;

    const player = ctx.getPlayerEntity();
    if (!player || !player.props) return;

    // Shield points (from spec) absorb damage first.
    if (ctx.shieldRef.current && ctx.shieldRef.current.value > 0) {
      const absorbed = Math.min(ctx.shieldRef.current.value, remaining);
      ctx.shieldRef.current.value = Math.max(
        VALIDATION_CONFIG.MIN_SHIELD,
        ctx.shieldRef.current.value - absorbed
      );
      ctx.playSfx("collision");
      remaining -= absorbed;
      if (remaining <= 0) return;
    }

    // Timed shield buff (powerup) absorbs a hit.
    if (ctx.buffsRef.current.shield > 0) {
      ctx.buffsRef.current.shield = 0;
      ctx.playSfx("collision");
      return;
    }

    const currentHealth = validateHealth(
      player.props.health,
      VALIDATION_CONFIG.DEFAULT_HEALTH
    );
    const newHealth = Math.max(
      VALIDATION_CONFIG.MIN_HEALTH,
      currentHealth - remaining
    );
    player.props.health = newHealth;

    if (newHealth <= VALIDATION_CONFIG.MIN_HEALTH) {
      toast.error(MESSAGES_CONFIG.GAME_OVER);
      player.props.health = VALIDATION_CONFIG.MIN_HEALTH;
      ctx.gameOverRef.current = true;
      ctx.damageFlashRef.current = DAMAGE_CONFIG.FLASH.GAME_OVER;
      ctx.playSfx("gameOver");
    } else {
      ctx.damageFlashRef.current = DAMAGE_CONFIG.FLASH.COLLISION;
      ctx.playSfx("collision");
    }
  }, [ctx.getPlayerEntity, ctx.playSfx, ctx.shieldRef, ctx.buffsRef, ctx.gameOverRef, ctx.damageFlashRef]);

  const applyBuffs = useCallback((kind: string) => {
    if (kind === "shield") {
      ctx.buffsRef.current.shield = BUFFS_CONFIG.SHIELD_DURATION;
    }
    if (kind === "spread") {
      ctx.buffsRef.current.spread = BUFFS_CONFIG.SPREAD_DURATION;
    }
  }, [ctx.buffsRef]);

  return {
    applyDamage,
    applyBuffs,
  };
}
