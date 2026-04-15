import { describe, expect, it } from "vitest";

import { createOpenTopBoxGeometry } from "@/lib/rendering/geometry/openTopBox";

describe("createOpenTopBoxGeometry", () => {
  it("removes only the top face from a box volume", () => {
    const width = 10;
    const height = 8;
    const depth = 6;
    const geometry = createOpenTopBoxGeometry(width, height, depth);
    const index = geometry.getIndex();
    const position = geometry.getAttribute("position");

    expect(index).not.toBeNull();
    expect(index!.count).toBe(30); // 5 faces * 2 triangles * 3 indices

    const topY = height * 0.5;
    for (let i = 0; i < index!.count; i += 3) {
      const y0 = position.getY(index!.getX(i));
      const y1 = position.getY(index!.getX(i + 1));
      const y2 = position.getY(index!.getX(i + 2));
      const isTopTriangle =
        Math.abs(y0 - topY) < 0.0001 &&
        Math.abs(y1 - topY) < 0.0001 &&
        Math.abs(y2 - topY) < 0.0001;
      expect(isTopTriangle).toBe(false);
    }

    geometry.dispose();
  });
});
