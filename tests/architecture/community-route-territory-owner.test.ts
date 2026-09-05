import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 Community route territory ownership", () => {
  it("owns route territory resolution in community-experience", () => {
    const canonical = read(
      "src/core/community-experience/utils/communityRouteTerritory.ts",
    );
    expect(canonical).toContain("resolveCommunityRouteTerritoryFilter");
    expect(canonical).toContain("resolveCommunityRouteDefaultLocationId");
    expect(canonical).toContain(
      'from "@/core/community-experience/access"',
    );
    expect(canonical).not.toContain("@/core/community/access/CommunityAccessPolicy");

    expect(
      existsSync(
        resolve(ROOT, "src/core/community/utils/communityRouteTerritory.ts"),
      ),
    ).toBe(false);
  });
});
