import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("G6 Community groups ownership", () => {
  it("keeps group service and hooks on the explicit community-groups owner", () => {
    for (const relativePath of [
      "src/core/community-groups/services/CommunityGroupsService.ts",
      "src/core/community-groups/hooks/useGrupos.ts",
      "src/core/community-groups/hooks/useFavoriteGroups.ts",
    ]) {
      expect(existsSync(join(ROOT, relativePath))).toBe(true);
    }

    for (const relativePath of [
      "src/core/community/services/CommunityGroupsService.ts",
      "src/core/community/services/CommunityService.ts",
      "src/core/community/hooks/useGrupos.ts",
      "src/core/community/hooks/useFavoriteGroups.ts",
    ]) {
      expect(existsSync(join(ROOT, relativePath))).toBe(false);
    }
  });

  it("keeps active group callers on the canonical owner", () => {
    const page = readFileSync(
      join(ROOT, "src/core/community-groups/pages/GruposPage.tsx"),
      "utf8",
    );
    const overview = readFileSync(
      join(ROOT, "src/core/community/components/page/CommunityOverviewSurface.tsx"),
      "utf8",
    );
    const coreBarrel = readFileSync(
      join(ROOT, "src/core/community/index.ts"),
      "utf8",
    );

    expect(page).toContain("@/core/community-groups/hooks/useGrupos");
    expect(overview).toContain(
      "@/core/community-groups/services/CommunityGroupsService",
    );
    expect(coreBarrel).not.toContain("CommunityService");
    expect(coreBarrel).not.toContain('./access');
  });
});
