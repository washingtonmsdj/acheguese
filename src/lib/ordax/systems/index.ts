// Ordax Engine Systems - Complete Suite

// Core Systems (100% refactored)
export { TimeSystem } from "./TimeSystem";
export type { TimeMetrics, TimeSystemConfig, TimeUpdateResult } from "./TimeSystem";

export { InputSystem } from "./InputSystem";
export type { InputState, InputConfig, InputMapping, KeyState, MouseState, TouchState, GamepadState } from "./InputSystem";

export { PhysicsSystem } from "./PhysicsSystem";
export type { PhysicsBody as PhysicsComponent, Vec2 as Vector2, PhysicsEntity } from "./PhysicsSystem";

export { CollisionSystem, COLLISION_LAYERS } from "./CollisionSystem";
export type { CollisionCallback, CollisionInfo, CollisionShape } from "./CollisionSystem";

export { ParticleSystem } from "./ParticleSystem";
export type { Particle, ParticleEmitter, ParticleConfig } from "./ParticleSystem";

export { AnimationSystem } from "./AnimationSystem";
export type { Animation, AnimationFrame, AnimatedEntity } from "./AnimationSystem";

export { AudioSystem } from "./AudioSystem";
export type { Sound, Music } from "./AudioSystem";

export { CameraSystem } from "./CameraSystem";
export type { Camera } from "./CameraSystem";

export { AISystem } from "./AISystem";
export type { AIBehavior, AIAgent } from "./AISystem";

export { TimerSystem } from "./TimerSystem";
export type { Timer } from "./TimerSystem";

export { UISystem } from "./UISystem-refactored";
export type { UIElement, GameState, TimerSystem as TimerSystemType, UIConfig } from "./uiSystemTypes";
export type { OrdaxEntity as Entity } from "@/lib/ordax/types";

export { ScoreSystem } from "./ScoreSystem";
export type { ScoreEvent } from "./ScoreSystem";

export { DialogueSystem } from "./DialogueSystem";
export type { Dialogue, DialogueLine } from "./DialogueSystem";

export { InventorySystem } from "./InventorySystem";
export type { Item, InventorySlot } from "./InventorySystem";

export { SaveSystem } from "./SaveSystem";
export type { SaveData } from "./SaveSystem";

// Game Systems
export { SpawnerSystem } from "./SpawnerSystem";
export { CombatSystem } from "./CombatSystem";
export type { DamageEvent, DamageCallback, DeathCallback } from "./CombatSystem";
export { GameStateSystem } from "./GameStateSystem";
export type { GameState as GameStateEnum, GameStateEvent } from "./GameStateSystem";
export { JuiceSystem } from "./JuiceSystem";

// System Registry (updated with new systems)
export const ORDAX_SYSTEMS = [
  "TimeSystem",
  "InputSystem",
  "PhysicsSystem",
  "CollisionSystem",
  "ParticleSystem",
  "AnimationSystem",
  "AudioSystem",
  "CameraSystem",
  "AISystem",
  "SpawnerSystem",
  "CombatSystem",
  "GameStateSystem",
  "ScoreSystem",
  "UISystem",
  "TimerSystem",
  "DialogueSystem",
  "InventorySystem",
  "SaveSystem",
  "JuiceSystem",
] as const;

export type OrdaxSystemName = typeof ORDAX_SYSTEMS[number];

// Helper function to get system class by name
export async function getSystemClass(systemName: OrdaxSystemName): Promise<unknown> {
  // Dynamic import to avoid circular reference issues
  const systemModules: Record<OrdaxSystemName, () => Promise<unknown>> = {
    TimeSystem: () => import("./TimeSystem").then(m => m.TimeSystem),
    InputSystem: () => import("./InputSystem").then(m => m.InputSystem),
    PhysicsSystem: () => import("./PhysicsSystem").then(m => m.PhysicsSystem),
    CollisionSystem: () => import("./CollisionSystem").then(m => m.CollisionSystem),
    ParticleSystem: () => import("./ParticleSystem").then(m => m.ParticleSystem),
    AnimationSystem: () => import("./AnimationSystem").then(m => m.AnimationSystem),
    AudioSystem: () => import("./AudioSystem").then(m => m.AudioSystem),
    CameraSystem: () => import("./CameraSystem").then(m => m.CameraSystem),
    AISystem: () => import("./AISystem").then(m => m.AISystem),
    SpawnerSystem: () => import("./SpawnerSystem").then(m => m.SpawnerSystem),
    CombatSystem: () => import("./CombatSystem").then(m => m.CombatSystem),
    GameStateSystem: () => import("./GameStateSystem").then(m => m.GameStateSystem),
    ScoreSystem: () => import("./ScoreSystem").then(m => m.ScoreSystem),
    UISystem: () => import("./UISystem-refactored").then(m => m.UISystem),
    TimerSystem: () => import("./TimerSystem").then(m => m.TimerSystem),
    DialogueSystem: () => import("./DialogueSystem").then(m => m.DialogueSystem),
    InventorySystem: () => import("./InventorySystem").then(m => m.InventorySystem),
    SaveSystem: () => import("./SaveSystem").then(m => m.SaveSystem),
    JuiceSystem: () => import("./JuiceSystem").then(m => m.JuiceSystem),
  };

  return systemModules[systemName]?.();
}
