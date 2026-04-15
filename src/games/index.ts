import type { GameDefinition } from "./types";
import { buildSpaceOperaParallaxShmupSpec } from "./space-opera-parallax-shmup";
import { buildArkVoxelNoahSpec } from "./ark-voxel-noah";
import { buildVoxelSandboxThreeSpec } from "./voxel-sandbox-three";

export const GAMES: GameDefinition[] = [
  {
    id: "stellar-vanguard",
    title: "Stellar Vanguard",
    tagline: "Shmup espacial completo (standalone) + demo Ordax",
    description:
      "Runner standalone (Canvas 2D) com dash, bomba, especial, upgrades (8) e boss. Também pode ser carregado no Studio como demo Ordax.",
    buildSpec: buildSpaceOperaParallaxShmupSpec,
    play: { kind: "standalone", route: "/games/play/stellar-vanguard" },
    docPath: "games/01-space-opera-parallax-shmup.md",
  },
  {
    id: "ark-voxel-noah",
    title: "Arca de Noé (Voxel)",
    tagline: "Explore o canteiro, reúna 10 animais e organize nas baias",
    description:
      "Um mundo voxel 3D no canteiro de obras da Arca, momentos antes do dilúvio. Controle Noé (2m em escala), guie animais em proporção real e coloque cada um na baia certa em 3 andares.",
    buildSpec: buildArkVoxelNoahSpec,
    play: { kind: "standalone", route: "/games/play/ark-voxel-noah" },
    docPath: "games/02-ark-voxel-noah.md",
  },
  {
    id: "voxel-sandbox-three",
    title: "Voxel Sandbox (Three.js)",
    tagline: "Base estilo Minecraft/Roblox (sem engine)",
    description:
      "Mundo voxel procedural + 1 player em primeira pessoa (Pointer Lock). Implementação em Three.js puro para iterarmos feature por feature.",
    buildSpec: buildVoxelSandboxThreeSpec,
    play: { kind: "standalone", route: "/games/play/voxel-sandbox-three" },
    docPath: "games/03-voxel-sandbox-three.md",
  },
  {
    id: "space-opera-parallax-shmup",
    title: "Space Opera Parallax Shmup",
    tagline: "Shmup vertical com parallax profundo (MVP 1 bioma)",
    description:
      "Sobreviva o máximo possível em uma nebulosa vibrante. Inimigos escalam por wave, powerups aparecem, HUD e restart rápido inclusos.",
    buildSpec: buildSpaceOperaParallaxShmupSpec,
    docPath: "games/01-space-opera-parallax-shmup.md",
  },
];

export function getGameById(id: string | null | undefined): GameDefinition | undefined {
  if (!id) return undefined;
  return GAMES.find((g) => g.id === id);
}
