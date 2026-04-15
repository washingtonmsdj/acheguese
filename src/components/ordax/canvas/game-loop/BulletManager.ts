/**
 * BulletManager - Handles bullet movement and cleanup
 * 
 * Responsibilities:
 * - Update bullet positions
 * - Remove off-screen bullets
 * - Remove dead bullets (after collision)
 */

import { WORLD } from "../constants";

type Bullet = {
  id: string;
  type: "bullet";
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  dead?: boolean;
};

export class BulletManager {
  /**
   * Update bullets - move and remove off-screen/dead bullets
   */
  updateBullets(
    dt: number,
    bulletsRef: React.MutableRefObject<Bullet[]>
  ): void {
    if (bulletsRef.current.length === 0) return;

    bulletsRef.current = bulletsRef.current
      .map((b) => ({ ...b, x: b.x + b.vx * dt, y: b.y + b.vy * dt }))
      .filter((b) => !b.dead && b.y > -80 && b.x > -80 && b.x < WORLD.w + 80);
  }
}
