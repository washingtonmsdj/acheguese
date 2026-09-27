import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("routing owner cleanup", () => {
  it("does not keep a legacy redirect/alias decision layer", () => {
    const policy = fs.readFileSync(
      path.join(ROOT, "src/core/routing/policies/EntityUrlPolicy.ts"),
      "utf8",
    );

    expect(policy).not.toContain("decideLegacyEntityRoute");
    expect(policy).not.toContain("LegacyEntityRouteDecision");
    expect(policy).not.toContain("../redirects");
  });

  it("does not recreate the retired redirects owner", () => {
    expect(fs.existsSync(path.join(ROOT, "src/core/routing/redirects"))).toBe(false);
  });

  it("does not recreate retired Community alias route components", () => {
    for (const file of [
      "CommunityAliasRoute.tsx",
      "CommunityAliasShellRoute.tsx",
      "CommunityEntityAliasRoute.tsx",
    ]) {
      expect(
        fs.existsSync(path.join(ROOT, "src/core/routing/components", file)),
      ).toBe(false);
    }
  });
});
