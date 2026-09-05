import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 Community groups page ownership", () => {
  it("owns GruposPage only in the explicit community-groups context", () => {
    const canonical = read("src/core/community-groups/pages/GruposPage.tsx");
    const shell = read("src/core/community-feed/pages/ComunidadePage.tsx");

    expect(canonical.length).toBeGreaterThan(1000);
    expect(existsSync(resolve(ROOT, "src/core/community/pages/GruposPage.tsx"))).toBe(false);
    expect(shell).toContain('import("@/core/community-groups/pages/GruposPage")');
    expect(shell).not.toContain('import("./GruposPage")');
  });

  it("uses explicit community-experience facades from the groups page", () => {
    const canonical = read("src/core/community-groups/pages/GruposPage.tsx");
    expect(canonical).toContain("@/core/community-experience/access");
    expect(canonical).toContain("@/core/community-experience/utils/communityRouteTerritory");
    expect(canonical).not.toContain('from "@/core/community/access"');
    expect(canonical).not.toContain("@/core/community/utils/communityRouteTerritory");
  });
});
