import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Map focus marker projection SSOT", () => {
  it("projects the focus target through mapEntityProjection before adding view metadata", () => {
    const page = read("src/core/maps/pages/MapaPageV4.tsx");
    const start = page.indexOf("const focusMarkers = React.useMemo");
    const end = page.indexOf("const allMarkers = React.useMemo", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const focusProjection = page.slice(start, end);

    expect(page).toContain(
      "import { mapEntityProjection } from '@/core/maps/services/MapEntityProjectionService';",
    );
    expect(focusProjection).toContain("mapEntityProjection.projectEntity(");
    expect(focusProjection).toContain("'user_location'");
    expect(focusProjection).toContain("...projected");
    expect(focusProjection).toContain("focusTarget: true");

    expect(focusProjection).not.toContain("type: 'user_location'");
    expect(focusProjection).not.toContain("coordinates: {");
    expect(focusProjection).not.toContain("EntityStatus.ACTIVE");
    expect(focusProjection).not.toContain("status: 'active'");
  });
});
