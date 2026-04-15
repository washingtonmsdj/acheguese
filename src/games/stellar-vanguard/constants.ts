/**
 * Constantes do jogo Stellar Vanguard
 * 
 * ✅ SSOT: Importa WORLD da engine
 */

import { WORLD as ENGINE_WORLD } from '@/lib/ordax/config';

export const WORLD = { 
  w: ENGINE_WORLD.W, 
  h: ENGINE_WORLD.H 
} as const;

export const KEYS = {
  up: ["ArrowUp", "w", "W"],
  down: ["ArrowDown", "s", "S"],
  left: ["ArrowLeft", "a", "A"],
  right: ["ArrowRight", "d", "D"],
  shoot: [" "],
  dash: ["Shift"],
  special: ["e", "E"],
  bomb: ["q", "Q"],
} as const;
