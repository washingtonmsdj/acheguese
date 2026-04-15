import type { OrdaxSpec } from "@/lib/ordax/types";

/**
 * Game 02: Arca de Noé (Voxel 3D)
 *
 * Runner 3D é separado (React Three Fiber). Aqui mantemos um OrdaxSpec canônico
 * para export/listagem e para possível integração futura no Studio.
 */
export function buildArkVoxelNoahSpec(): OrdaxSpec {
  return {
    gameType: "unknown",
    title: "Arca de Noé (Voxel)",
    description:
      "Explore o canteiro, reúna 10 animais e organize nas baias internas em 3 andares. Estrutura retangular massiva (como descrita em Gênesis 6).",
    systems: [
      // Mantemos sistemas compatíveis com o lint/Studio.
      "PhysicsSystem",
      "CollisionSystem",
      "AISystem",
      "TimerSystem",
      "UISystem",
      "CameraSystem",
      "SaveSystem",
    ],
    visual: {
      theme: {
        background: "hsl(42, 20%, 8%)",
        primary: "hsl(42, 82%, 58%)",
        accent: "hsl(190, 90%, 55%)",
        font:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      },
      background: {
        layers: [{ type: "solid", parallax: 0 }],
      },
    },
    scene: {
      gravity: { x: 0, y: 0 },
      entities: [
        {
          id: "player",
          type: "player",
          x: 0,
          y: 0,
          w: 2,
          h: 2,
          props: { name: "Noé" },
        },
      ],
    },
  };
}
