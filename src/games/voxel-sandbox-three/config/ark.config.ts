import { ARK_CONSTANTS } from "@/lib/constants/systems/physics-advanced";

export interface ArkDeckLayout {
  width: number;
  length: number;
  height: number;
  centerY: number;
}

export interface ArkVisualLayout {
  length: number;
  width: number;
  height: number;
  hullHeight: number;
  draftHeight: number;
  decks: ArkDeckLayout[];
  window: {
    width: number;
    height: number;
    depth: number;
    centerY: number;
  };
  door: {
    width: number;
    height: number;
    depth: number;
    centerY: number;
    centerZ: number;
  };
}

const ARK_LAYOUT_TUNING = {
  hullHeightFraction: 0.4,
  draftHeightFraction: 0.3,
  deckCount: 3,
  deckHeightFraction: 0.1,
  deckInsetPerLevel: 0.08,
  topClearanceFraction: 0.06,
  windowInsetFraction: 0.2,
  windowHeightFraction: 0.04,
  windowDepthFraction: 0.03,
  windowYFraction: 0.95,
  doorWidthFraction: 0.08,
  doorHeightFraction: 0.25,
  doorDepthFraction: 0.04,
  doorYFraction: 0.2,
} as const;

export const ARK_VISUAL_STYLE = {
  hullColor: 0x8b4513,
  deckColor: 0x654321,
  windowColor: 0xffffaa,
  windowEmissive: 0x444400,
  doorColor: 0x3d2817,
  waterlineColor: 0xff0000,
} as const;

export const ARK_DEBUG_OPTIONS = {
  showArkMeshGuides: false,
  showScaleGuides: false,
} as const;

export function createArkVisualLayout(): ArkVisualLayout {
  const length = ARK_CONSTANTS.LENGTH;
  const width = ARK_CONSTANTS.WIDTH;
  const height = ARK_CONSTANTS.HEIGHT;

  const hullHeight = height * ARK_LAYOUT_TUNING.hullHeightFraction;
  const draftHeight = height * ARK_LAYOUT_TUNING.draftHeightFraction;
  const deckHeight = height * ARK_LAYOUT_TUNING.deckHeightFraction;
  const topClearance = height * ARK_LAYOUT_TUNING.topClearanceFraction;
  const firstDeckCenter = hullHeight + deckHeight * 0.5;
  const lastDeckCenter = Math.max(
    firstDeckCenter,
    height - topClearance - deckHeight * 0.5,
  );
  const deckStep =
    ARK_LAYOUT_TUNING.deckCount > 1
      ? (lastDeckCenter - firstDeckCenter) / (ARK_LAYOUT_TUNING.deckCount - 1)
      : 0;

  const decks: ArkDeckLayout[] = [];
  for (let i = 0; i < ARK_LAYOUT_TUNING.deckCount; i++) {
    const scale = 1 - i * ARK_LAYOUT_TUNING.deckInsetPerLevel;
    decks.push({
      length: length * scale,
      width: width * scale,
      height: deckHeight,
      centerY: firstDeckCenter + deckStep * i,
    });
  }

  return {
    length,
    width,
    height,
    hullHeight,
    draftHeight,
    decks,
    window: {
      width: length * (1 - ARK_LAYOUT_TUNING.windowInsetFraction),
      height: height * ARK_LAYOUT_TUNING.windowHeightFraction,
      depth: width * ARK_LAYOUT_TUNING.windowDepthFraction,
      centerY: height * ARK_LAYOUT_TUNING.windowYFraction,
    },
    door: {
      width: length * ARK_LAYOUT_TUNING.doorWidthFraction,
      height: height * ARK_LAYOUT_TUNING.doorHeightFraction,
      depth: width * ARK_LAYOUT_TUNING.doorDepthFraction,
      centerY: hullHeight * ARK_LAYOUT_TUNING.doorYFraction + (height * ARK_LAYOUT_TUNING.doorHeightFraction) * 0.5,
      centerZ: width * 0.5,
    },
  };
}
