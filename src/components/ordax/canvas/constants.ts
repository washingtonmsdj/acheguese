/**
 * Canvas constants — re-exports from the central config with the shape
 * expected by the canvas sub-modules (lowercase w/h).
 */

import { WORLD as _WORLD } from "@/lib/ordax/config";

export const WORLD = {
  w: _WORLD.W,
  h: _WORLD.H,
} as const;
