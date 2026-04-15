# Terrain System (Ordax Engine)

Sistema procedural de terreno realista para jogos 3D sem aparência de Minecraft.

## Uso básico

```ts
import { createProceduralTerrain } from "@/lib/ordax/terrain";
import type { TerrainConfig } from "@/lib/ordax/terrain";

const config: TerrainConfig = {
  seed: 1337,
  size: 64,
  maxHeight: 18,
  segments: 220,
  textures: {
    base: "/textures/terrain/dirt_diff_1k.jpg",
    mid: "/textures/terrain/dry_mud_field_001_diff_1k.jpg",
    high: "/textures/terrain/mud_cracked_dry_03_diff_1k.jpg",
  },
  blend: {
    seaLevel: 3.2,
    rockHeight: 10.0,
    texScale: 0.08,
  },
};

const terrain = createProceduralTerrain(config);
scene.add(terrain);

// Cleanup
terrain.disposeTextures?.();
terrain.geometry.dispose();
terrain.material.dispose();
```

## Biomas

| Bioma | base | mid | high |
|-------|------|-----|------|
| Mesopotâmia | areia/poeira | barro seco | argila rachada |
| Floresta | grama | terra | rocha |
| Deserto | areia | rocha | rocha escura |

## Colisão

Use a função `heightAt` exportada para raycast/collision no mesmo mundo:

```ts
import { heightAt } from "@/lib/ordax/terrain";

const groundY = heightAt(player.x, player.z, seed, maxHeight);
```
