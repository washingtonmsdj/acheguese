import { describe, expect, it } from "vitest";

import { ARK_CONSTANTS } from "@/lib/constants/systems/physics-advanced";
import { createArkVisualLayout } from "@/games/voxel-sandbox-three/config/ark.config";

describe("Ark visual layout SSOT", () => {
  it("matches the canonical ark dimensions from engine constants", () => {
    const layout = createArkVisualLayout();

    expect(layout.length).toBe(ARK_CONSTANTS.LENGTH);
    expect(layout.width).toBe(ARK_CONSTANTS.WIDTH);
    expect(layout.height).toBe(ARK_CONSTANTS.HEIGHT);
  });

  it("keeps decks ordered and inside ark vertical limits", () => {
    const layout = createArkVisualLayout();
    const deckCount = layout.decks.length;

    expect(deckCount).toBeGreaterThan(0);

    for (let i = 0; i < deckCount; i++) {
      const deck = layout.decks[i];
      const bottom = deck.centerY - deck.height * 0.5;
      const top = deck.centerY + deck.height * 0.5;

      expect(bottom).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThanOrEqual(layout.height);

      if (i > 0) {
        expect(layout.decks[i - 1].centerY).toBeLessThan(deck.centerY);
      }
    }
  });

  it("places waterline and door at sane positions for gameplay readability", () => {
    const layout = createArkVisualLayout();

    expect(layout.draftHeight).toBeGreaterThan(0);
    expect(layout.draftHeight).toBeLessThan(layout.height);

    expect(layout.door.centerY).toBeGreaterThan(0);
    expect(layout.door.centerY + layout.door.height * 0.5).toBeLessThan(layout.height);
    expect(layout.door.centerZ).toBeCloseTo(layout.width * 0.5, 6);
  });
});
