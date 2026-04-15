/**
 * Input Handler - Handles player input and movement
 */

import type { OrdaxEntity } from "@/lib/ordax/types";
import { WORLD } from "../constants";

type Keys = {
  ArrowUp?: boolean;
  ArrowDown?: boolean;
  ArrowLeft?: boolean;
  ArrowRight?: boolean;
  w?: boolean;
  a?: boolean;
  s?: boolean;
  d?: boolean;
  " "?: boolean;
};

type InputContext = {
  keys: Keys;
  player: OrdaxEntity;
  initialPlayer: OrdaxEntity;
  dt: number;
  gameType: string;
  hasPhysicsSystem: boolean;
  physicsSystemRef: React.MutableRefObject<any>;
  hasAudioSystem: boolean;
  audioSystemRef: React.MutableRefObject<any>;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export class InputHandler {
  handlePlayerInput(context: InputContext): void {
    const { keys, player, initialPlayer, dt, gameType, hasPhysicsSystem, physicsSystemRef, hasAudioSystem, audioSystemRef } = context;

    const up = keys.ArrowUp || keys.w;
    const down = keys.ArrowDown || keys.s;
    const left = keys.ArrowLeft || keys.a;
    const right = keys.ArrowRight || keys.d;
    const space = keys[" "];

    // Movement directions

    if (hasPhysicsSystem) {
      this.handlePhysicsMovement(context, { up, down, left, right, space });
    } else {
      this.handleDirectMovement(context, { up, down, left, right });
    }

    // Clamp player position
    player.x = clamp(player.x, initialPlayer.w / 2, WORLD.w - initialPlayer.w / 2);
    player.y = clamp(player.y, initialPlayer.h / 2, WORLD.h - initialPlayer.h / 2);
  }

  private handlePhysicsMovement(
    context: InputContext,
    input: { up: boolean; down: boolean; left: boolean; right: boolean; space: boolean }
  ): void {
    const { initialPlayer, gameType, physicsSystemRef, hasAudioSystem, audioSystemRef } = context;
    const { up, down, left, right, space } = input;

    const physics = physicsSystemRef.current;
    
    // ✅ CORREÇÃO: Ler configurações da spec ao invés de hardcode
    const speed = (initialPlayer.props?.speed as number | undefined) ?? 220;
    const jumpForce = (initialPlayer.props?.jumpForce as number | undefined) ?? 300;
    const forceMult = (initialPlayer.props?.forceMult as number | undefined) ?? 2;
    const canJump = (initialPlayer.props?.canJump as boolean | undefined) ?? true;
    const canMoveVertical = (initialPlayer.props?.canMoveVertical as boolean | undefined) ?? true;
    const canMoveHorizontal = (initialPlayer.props?.canMoveHorizontal as boolean | undefined) ?? true;

    let fx = 0;
    let fy = 0;

    // ✅ CORREÇÃO: Usar movementType da spec ao invés de gameType
    const movementType = (initialPlayer.props?.movementType as string | undefined) ?? 
                        (gameType === "platformer" ? "platformer" : "topdown");

    if (movementType === "platformer") {
      // Platformer: horizontal movement only (unless canMoveVertical is true)
      if (left && canMoveHorizontal) fx -= speed * forceMult;
      if (right && canMoveHorizontal) fx += speed * forceMult;
      
      // Vertical movement (if enabled)
      if (canMoveVertical) {
        if (up) fy -= speed * forceMult;
        if (down) fy += speed * forceMult;
      }
      
      physics.applyForce(initialPlayer.id, fx, fy);

      // Jump
      if (space && canJump && physics.isGrounded(initialPlayer.id)) {
        physics.applyImpulse(initialPlayer.id, 0, -jumpForce);
        if (hasAudioSystem) audioSystemRef.current.playSound("jump");
      }
    } else {
      // Top-down games: 4-directional movement
      if (left && canMoveHorizontal) fx -= speed * forceMult;
      if (right && canMoveHorizontal) fx += speed * forceMult;
      if (up && canMoveVertical) fy -= speed * forceMult;
      if (down && canMoveVertical) fy += speed * forceMult;

      // Auto-register player if not in PhysicsSystem
      const isRegistered = physics.getComponent(initialPlayer.id);
      if (!isRegistered) {
        physics.register(initialPlayer.id, 1, 0.1, 0.5);
      }

      physics.applyForce(initialPlayer.id, fx, fy);
    }
  }

  private handleDirectMovement(
    context: InputContext,
    input: { up: boolean; down: boolean; left: boolean; right: boolean }
  ): void {
    const { player, initialPlayer, dt } = context;
    const { up, down, left, right } = input;

    const speed = (initialPlayer.props?.speed as number | undefined) ?? 220;
    let vx = 0;
    let vy = 0;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    const len = Math.hypot(vx, vy) || 1;
    vx /= len;
    vy /= len;

    player.x += vx * speed * dt;
    player.y += vy * speed * dt;
  }
}
