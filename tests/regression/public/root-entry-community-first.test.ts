import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("root community-first MVP entry", () => {
  it("does not bypass the launch entry with remembered or profile territory", () => {
    const source = read("src/app/routes/RootRouteEntry.tsx");

    expect(source).toContain("return <TerritoryEntryPage />");
    expect(source).not.toContain("<Navigate");
    expect(source).not.toContain("lastTerritoryStore");
    expect(source).not.toContain("useUserTerritory");
    expect(source).not.toContain("homeDistrict");
    expect(source).not.toContain("homeCity");
  });

  it("preserves the explicit prelaunch lockdown override", () => {
    const source = read("src/app/routes/RootRouteEntry.tsx");

    expect(source).toContain("VITE_PRELAUNCH_LOCKDOWN");
    expect(source).toContain("return <PreLaunchLandingPage />");
  });
});
