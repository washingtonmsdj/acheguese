import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 Community group detail ownership", () => {
  it("owns group detail and private helpers only in community-groups", () => {
    const canonical = read("src/core/community-groups/pages/GrupoDetailPage.tsx");
    expect(canonical.length).toBeGreaterThan(1000);
    expect(existsSync(resolve(ROOT, "src/core/community/pages/GrupoDetailPage.tsx"))).toBe(false);

    for (const helper of [
      "GrupoDetailChat.tsx",
      "GrupoDetailInfoPanel.tsx",
      "GrupoDetailMembersPanel.tsx",
      "GrupoDetailShared.ts",
    ]) {
      expect(existsSync(resolve(ROOT, "src/core/community-groups/pages", helper))).toBe(true);
      expect(existsSync(resolve(ROOT, "src/core/community/pages", helper))).toBe(false);
    }
  });

  it("uses the explicit community-experience access facade", () => {
    const canonical = read("src/core/community-groups/pages/GrupoDetailPage.tsx");
    expect(canonical).toContain("@/core/community-experience/access");
    expect(canonical).not.toContain('from "@/core/community/access"');
  });
});
