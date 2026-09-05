import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 Community access ownership", () => {
  it("owns access policy, hook and gate only in community-experience", () => {
    for (const file of [
      "CommunityAccessPolicy.ts",
      "useCommunityAccess.ts",
      "CommunityPortalGate.tsx",
    ]) {
      const canonical = read(`src/core/community-experience/access/${file}`);
      expect(canonical.length).toBeGreaterThan(500);
      expect(existsSync(resolve(ROOT, `src/core/community/access/${file}`))).toBe(false);
    }
  });

  it("keeps the explicit barrel independent of the retired generic access barrel", () => {
    const canonical = read("src/core/community-experience/access/index.ts");
    expect(canonical).toContain('from "./CommunityAccessPolicy"');
    expect(canonical).toContain('from "./useCommunityAccess"');
    expect(canonical).toContain('from "./CommunityPortalGate"');
    expect(canonical).not.toContain("@/core/community/access");
    expect(existsSync(resolve(ROOT, "src/core/community/access/index.ts"))).toBe(false);
  });
});
