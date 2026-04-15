/**
 * Shooting Handler - Handles shooting mechanics for shooter games
 */

import type { OrdaxEntity } from "@/lib/ordax/types";

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

type ShootingContext = {
  player: OrdaxEntity;
  initialPlayer: OrdaxEntity;
  dt: number;
  space: boolean;
  gameType: string;
  fireCooldownRef: React.MutableRefObject<number>;
  bulletsRef: React.MutableRefObject<Bullet[]>;
  buffsRef: React.MutableRefObject<{ shield: number; spread: number }>;
  hasParticleSystem: boolean;
  particleSystemRef: React.MutableRefObject<unknown>;
  theme: Record<string, unknown>;
  playSfx: (sound: string) => void;
};

export class ShootingHandler {
  handleShooting(context: ShootingContext): void {
    const {
      player,
      initialPlayer,
      dt,
      space,
      gameType,
      fireCooldownRef,
      bulletsRef,
      buffsRef,
      hasParticleSystem,
      particleSystemRef,
      theme,
      playSfx,
    } = context;

    // ✅ CORREÇÃO: Verificar se player pode atirar ao invés de checar gameType
    const canShoot = (initialPlayer.props?.canShoot as boolean | undefined) ?? (gameType === "shooter");
    if (!canShoot) return;

    // Update fire cooldown
    fireCooldownRef.current = Math.max(0, fireCooldownRef.current - dt);

    // ✅ CORREÇÃO: Ler configurações da spec
    const fireRate = (initialPlayer.props?.fireRate as number | undefined) ?? 7;
    const fireInterval = fireRate > 0 ? 1 / fireRate : 0.14;
    const bulletSpeed = (initialPlayer.props?.bulletSpeed as number | undefined) ?? 520;
    const bulletSize = (initialPlayer.props?.bulletSize as { w: number; h: number } | undefined) ?? { w: 6, h: 14 };
    const bulletSpawnOffset = (initialPlayer.props?.bulletSpawnOffset as { x: number; y: number } | undefined) ?? { x: 0, y: -0.7 };
    const spreadAngle = (initialPlayer.props?.spreadAngle as number | undefined) ?? 140;
    const spreadSpeedMult = (initialPlayer.props?.spreadSpeedMult as number | undefined) ?? 0.95;

    if (space && fireCooldownRef.current <= 0) {
      fireCooldownRef.current = fireInterval;

      const spawnBullet = (vx: number, vy: number) => {
        bulletsRef.current.push({
          id: `b_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
          type: "bullet",
          x: player.x + bulletSpawnOffset.x * initialPlayer.w,
          y: player.y + bulletSpawnOffset.y * initialPlayer.h,
          w: bulletSize.w,
          h: bulletSize.h,
          vx,
          vy,
          dead: false,
        });
      };

      // Spread shot or single shot
      if (buffsRef.current.spread > 0) {
        spawnBullet(-spreadAngle, -Math.abs(bulletSpeed) * spreadSpeedMult);
        spawnBullet(0, -Math.abs(bulletSpeed));
        spawnBullet(spreadAngle, -Math.abs(bulletSpeed) * spreadSpeedMult);
      } else {
        spawnBullet(0, -Math.abs(bulletSpeed));
      }

      playSfx("shoot");

      // 🎆 ENHANCED: Multi-layer muzzle flash particles
      if (hasParticleSystem) {
        const muzzleX = player.x + bulletSpawnOffset.x * initialPlayer.w;
        const muzzleY = player.y + bulletSpawnOffset.y * initialPlayer.h * 0.85;
        
        const primaryColor =
          theme?.primary && typeof theme.primary === "string" ? theme.primary : "hsl(200, 80%, 50%)";
        
        // Layer 1: Main muzzle flash (bright)
        particleSystemRef.current.emit(muzzleX, muzzleY, 8, {
          life: 0.2,
          speed: 280,
          size: 3,
          endSize: 0,
          color: primaryColor,
          spread: Math.PI * 0.5,
          direction: -Math.PI / 2,
        });
        
        // Layer 2: Hot core flash (white-yellow)
        particleSystemRef.current.emit(muzzleX, muzzleY, 5, {
          life: 0.12,
          speed: 150,
          size: 5,
          endSize: 0,
          color: "hsl(50, 100%, 90%)",
          spread: Math.PI * 0.3,
          direction: -Math.PI / 2,
        });
        
        // Layer 3: Side sparks
        particleSystemRef.current.emit(muzzleX, muzzleY, 4, {
          life: 0.18,
          speed: 180,
          size: 2,
          endSize: 0,
          color: "hsl(35, 100%, 70%)",
          spread: Math.PI * 0.8,
          direction: -Math.PI / 2,
          gravity: 60,
        });
        
        // Layer 4: Smoke puff (subtle)
        particleSystemRef.current.emit(muzzleX, muzzleY - 5, 3, {
          life: 0.4,
          speed: 40,
          size: 4,
          endSize: 8,
          color: "hsl(0, 0%, 60%)",
          endColor: "hsl(0, 0%, 30%)",
          spread: Math.PI * 0.4,
          direction: -Math.PI / 2,
          gravity: -30,
        });
      }
    }
  }
}
