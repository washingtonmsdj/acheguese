import type { OrdaxSpec } from "@/lib/ordax/types";
import { WORLD, ENTITY_DEFAULTS, ENTITY_TYPES } from "@/lib/ordax/config";

/**
 * Game 01: Space Opera Parallax Shmup (MVP 1 bioma)
 *
 * NOTE: O OrdaxCanvas já implementa a maior parte do loop shooter (spawner, bullets, powerups, HUD básico).
 * Aqui nós apenas declaramos um runtimeSpec consistente e "bonito" (parallax profundo + parâmetros).
 * 
 * ✅ SSOT: Usa constantes de config.ts
 */
export function buildSpaceOperaParallaxShmupSpec(): OrdaxSpec {
  return {
    gameType: "shooter",
    title: "Space Opera Parallax Shmup",
    description:
      "Shmup vertical de sobrevivência com parallax profundo, inimigos escalonando por wave, powerups e HUD. MVP 1 bioma (Nebulosa Colorida).",
    systems: [
      "PhysicsSystem",
      "CollisionSystem",
      "ParticleSystem",
      "ScoreSystem",
      "TimerSystem",
      "CameraSystem",
      "UISystem",
      // AudioSystem é opcional; o canvas tem fallback procedural de SFX.
      // Mantemos fora no MVP para evitar depender de assets/URLs.
      "AISystem",
      "AnimationSystem",
      "SaveSystem",
    ],
    visual: {
      theme: {
        // Preferimos hsl(...) aqui (o canvas normaliza/usa hsla internamente).
        background: "hsl(240, 60%, 6%)",
        primary: "hsl(190, 100%, 55%)",
        accent: "hsl(295, 85%, 62%)",
        font: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      },
      background: {
        // 5 camadas usando tipos suportados (starfield/nebula/gradient/solid).
        // O parallax (0..1) dá sensação de profundidade.
        layers: [
          { type: "starfield", parallax: 0.02, density: 260, speedY: 18 },
          { type: "starfield", parallax: 0.06, density: 180, speedY: 32 },
          { type: "nebula", parallax: 0.12 },
          { type: "gradient", parallax: 0.18 },
          { type: "nebula", parallax: 0.26 },
        ],
      },
    },
    scene: {
      gravity: { x: 0, y: 0 },
      entities: [
        {
          id: "player",
          type: ENTITY_TYPES.PLAYER,
          x: WORLD.CENTER_X,
          y: WORLD.H * 0.87, // 80% from top
          w: 26,
          h: 30,
          props: {
            health: ENTITY_DEFAULTS.PLAYER_HEALTH,
            speed: 280,
            fireRate: 9,
            bulletSpeed: 560,
            // Shield base (HUD mostra barra se existir)
            shield: 0,
            shieldRegen: 0,
          },
        },
        {
          id: "spawner",
          type: ENTITY_TYPES.SPAWNER,
          x: WORLD.CENTER_X,
          y: 0,
          w: WORLD.W - 40,
          h: 10,
          props: {
            // O OrdaxCanvas escala a dificuldade por score (wave). Esse baseRate define o "feeling".
            spawnRate: 1.7,
          },
        },
      ],
    },
  };
}
