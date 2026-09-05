import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const exists = (path: string) => existsSync(resolve(root, path));

describe("community Events canonical owner", () => {
  it("keeps retired Events namespaces absent", () => {
    expect(exists("src/features")).toBe(false);
    expect(exists("src/features/events")).toBe(false);
    expect(exists("src/core/verticals/events")).toBe(false);
    expect(exists("src/shared/components/eventos")).toBe(false);
  });

  it("keeps Events implementation under community-events", () => {
    for (const path of [
      "src/modules/community-events/index.ts",
      "src/modules/community-events/pages/EventsListPage.tsx",
      "src/modules/community-events/pages/EventDetailPage.tsx",
      "src/modules/community-events/types/index.ts",
      "src/core/community-events/index.ts",
      "src/core/community-events/types.ts",
      "src/core/community-events/services/EventReadService.ts",
      "src/core/community-events/services/EventMutationService.ts",
      "src/core/community-events/services/EventRuntimeService.ts",
      "src/core/community-events/services/EventEngagementService.ts",
      "src/core/community-events/services/EventLinkEligibilityService.ts",
      "src/core/community-events/routes/eventPublicRoutes.ts",
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
    const deployGuard = read("tools/release/verify-deploy-ready.mjs");

    expect(deployGuard).toContain(
      "collectRuntimeSourceFiles('src/modules/community-events')",
    );
    expect(deployGuard).not.toContain(
      "collectRuntimeSourceFiles('src/features/events')",
    );
  });

  it("removes the completed legacy migration allowance", () => {
    const validator = read("tools/architecture/validate-community-transversal-boundaries.ts");

    expect(validator).not.toContain("LEGACY_TRANSVERSAL_MIGRATION_ROOTS");
    expect(validator).not.toContain('"src/features/events"');
  });

  it("keeps engagement persistence only on the canonical core owner", () => {
    const canonical = read(
      "src/core/community-events/services/EventEngagementService.ts",
    );

    expect(canonical).toContain('from "@/integrations/supabase"');
    expect(canonical).toContain("export class EventEngagementService");
    expect(
      exists("src/modules/community-events/services/EventEngagementService.ts"),
    ).toBe(false);
  });
  it("keeps event participation mutations server-owned", () => {
    const mutationService = read(
      "src/core/community-events/services/EventMutationService.ts",
    );
    const migration = read("supabase/migrations/20260905144500_revoke_direct_event_participant_mutations_g6.sql");

    expect(mutationService).toContain('invokeEventRpc<EventJoinResult>("joinEvent"');
    expect(mutationService).toContain('invokeEventRpc<EventLeaveResult>("leaveEvent"');
    expect(mutationService).toContain('invokeEventRpc<EventCheckInResult>("checkInEvent"');
    expect(mutationService).not.toMatch(/\.from\("event_participants"\)[\s\S]{0,240}\.(?:insert|update|delete)\(/);
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE");
    expect(migration).toContain("ON TABLE public.event_participants");
    expect(migration).toContain("FROM authenticated");
  });
});
