import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const exists = (path: string) => existsSync(resolve(root, path));

describe("community Events canonical owner", () => {
  it("keeps the retired features namespace absent", () => {
    expect(exists("src/features")).toBe(false);
    expect(exists("src/features/events")).toBe(false);
  });

  it("keeps Events implementation under community-events", () => {
    for (const path of [
      "src/modules/community-events/index.ts",
      "src/modules/community-events/pages/EventsListPage.tsx",
      "src/modules/community-events/pages/EventDetailPage.tsx",
      "src/modules/community-events/services/EventEngagementService.ts",
      "src/modules/community-events/types/index.ts",
    ]) {
      expect(exists(path), path).toBe(true);
    }
  });

  it("keeps the territorial route on the canonical module", () => {
    const route = read("src/app/routes/territorial/TerritorialModulePages.tsx");

    expect(route).toContain(
      'import("@/modules/community-events/pages/EventsListPage")',
    );
    expect(route).not.toContain("@/features/events");
  });

  it("keeps deploy hygiene scanning the canonical Events owner", () => {
    const deployGuard = read("scripts/verify-deploy-ready.mjs");

    expect(deployGuard).toContain(
      "collectRuntimeSourceFiles('src/modules/community-events')",
    );
    expect(deployGuard).not.toContain(
      "collectRuntimeSourceFiles('src/features/events')",
    );
  });

  it("removes the completed legacy migration allowance", () => {
    const validator = read("scripts/validate-community-transversal-boundaries.ts");

    expect(validator).not.toContain("LEGACY_TRANSVERSAL_MIGRATION_ROOTS");
    expect(validator).not.toContain('"src/features/events"');
  });

  it("keeps engagement persistence outside the UI module", () => {
    const bridge = read(
      "src/modules/community-events/services/EventEngagementService.ts",
    );

    expect(bridge).toContain(
      '@/core/verticals/events/services/EventEngagementService',
    );
    expect(bridge).not.toContain("@/integrations/supabase");
    expect(bridge).not.toContain(".from(");
  });
});
