import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

const CONSUMERS = [
  "src/core/mobility/components/RideTrackingMap.tsx",
  "src/modules/mobility/pages/BuscandoMotoristaPage.tsx",
] as const;

describe("mobility map visual SSOT", () => {
  it("owns semantic route and marker visuals in core mobility", () => {
    const visuals = read("src/core/mobility/constants/mapVisuals.ts");
    const helper = read("src/core/mobility/utils/createMobilityMapMarkerElement.ts");
    const constantsIndex = read("src/core/mobility/constants/index.ts");

    expect(visuals).toContain("MOBILITY_MAP_VISUALS");
    expect(visuals).toContain('color: "#6366f1"');
    expect(visuals).toContain('color: "#22c55e"');
    expect(visuals).toContain('color: "#ef4444"');
    expect(visuals).toContain('color: "#14b8a6"');
    expect(helper).toContain("createMobilityMapMarkerElement");
    expect(helper).toContain("MOBILITY_MAP_VISUALS.markers[kind]");
    expect(constantsIndex).toContain("MOBILITY_MAP_VISUALS");
  });

  it("keeps mobility map consumers free of duplicated semantic map colors", () => {
    for (const consumerPath of CONSUMERS) {
      const source = read(consumerPath);

      expect(source).toContain("MOBILITY_MAP_VISUALS");
      expect(source).toContain("createMobilityMapMarkerElement");
      expect(source).not.toMatch(/['\"]#(?:6366f1|22c55e|34d399|ef4444|14b8a6)['\"]/i);
      expect(source).not.toContain("box-shadow:0 2px 8px rgba(0,0,0");
      expect(source).not.toContain("border:3px solid white");
    }
  });
});
