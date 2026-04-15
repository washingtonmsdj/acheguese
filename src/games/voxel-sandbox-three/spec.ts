import type { OrdaxSpec } from "@/lib/ordax/types";

/**
 * Voxel Sandbox (Three.js puro)
 *
 * Mesmo não usando Ordax no runner, mantemos um OrdaxSpec mínimo para:
 * - aparecer em /games
 * - export HTML (se quiser)
 */
export function buildVoxelSandboxThreeSpec(): OrdaxSpec {
  return {
    gameType: "unknown",
    title: "Voxel Sandbox (Three.js)",
    description:
      "Sandbox voxel procedural estilo Minecraft/Roblox. Runner em Three.js puro (sem Ordax), com câmera FPS (pointer lock).",
    systems: ["CameraSystem", "UISystem", "TimerSystem"],
    visual: {
      theme: {
        background: "hsl(210, 25%, 7%)",
        primary: "hsl(142, 70%, 45%)",
        accent: "hsl(42, 95%, 55%)",
      },
      background: { layers: [{ type: "solid" }] },
    },
    scene: {
      gravity: { x: 0, y: 0 },
      entities: [
        {
          id: "player",
          type: "player",
          x: 0,
          y: 0,
          w: 1,
          h: 2,
        },
      ],
    },
  };
}
