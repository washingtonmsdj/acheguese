import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("routing owner cleanup", () => {
  it("keeps legacy entity decision under EntityUrlPolicy", () => {
    const policy = fs.readFileSync(
      path.join(
        ROOT,
        "src/core/routing/policies/EntityUrlPolicy.ts",
      ),
      "utf8",
    );

    expect(policy).toContain("decideLegacyEntityRoute");
    expect(policy).toContain("LegacyEntityRouteDecision");
    expect(policy).not.toContain("../redirects");
  });

  it("does not recreate the retired redirects owner", () => {
    expect(
      fs.existsSync(
        path.join(ROOT, "src/core/routing/redirects"),
      ),
    ).toBe(false);
  });
});
