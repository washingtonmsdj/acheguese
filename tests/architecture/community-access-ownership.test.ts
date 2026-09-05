import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 Community access ownership", () => {
  it("owns access policy, hook and gate in community-experience", () => {
    for (const file of [
      "CommunityAccessPolicy.ts",
      "useCommunityAccess.ts",
      "CommunityPortalGate.tsx",
    ]) {
      const canonical = read(
        `src/core/community-experience/access/${file}`,
      );
      const legacy = read(`src/core/community/access/${file}`);

      expect(canonical.length).toBeGreaterThan(500);
      expect(legacy).toContain(
        `@/core/community-experience/access/${file.replace(/\.(ts|tsx)$/, "")}`,
      );
    }
  });

  it("keeps the legacy barrel one-way into community-experience", () => {
    const canonical = read("src/core/community-experience/access/index.ts");
    const legacy = read("src/core/community/access/index.ts");

    expect(canonical).toContain('from "./CommunityAccessPolicy"');
    expect(canonical).toContain('from "./useCommunityAccess"');
    expect(canonical).toContain('from "./CommunityPortalGate"');
    expect(canonical).not.toContain("@/core/community/access");
    expect(legacy.trim()).toBe(
      'export * from "@/core/community-experience/access";',
    );
  });
});
