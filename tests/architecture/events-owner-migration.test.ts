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
    expect(exists("src/modules/community-events/components/EventTicketManager.tsx")).toBe(false);
    expect(exists("src/modules/community-events/components/EventsGlobalSidebar.tsx")).toBe(false);
    expect(exists("src/modules/community-events/components/EventReminders.tsx")).toBe(false);
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
    const migration = read("supabase/migrations/20260905150847_revoke_direct_event_participant_mutations_g6.sql");

    expect(mutationService).toContain('invokeEventRpc<EventJoinResult>("joinEvent"');
    expect(mutationService).toContain('invokeEventRpc<EventLeaveResult>("leaveEvent"');
    expect(mutationService).toContain('invokeEventRpc<EventCheckInResult>("checkInEvent"');
    expect(mutationService).not.toMatch(/\.from\("event_participants"\)[\s\S]{0,240}\.(?:insert|update|delete)\(/);
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE");
    expect(migration).toContain("ON TABLE public.event_participants");
    expect(migration).toContain("FROM authenticated");
  });
  it("retires the unused event_favorites table after saved-entity migration", () => {
    const engagement = read(
      "src/core/community-events/services/EventEngagementService.ts",
    );
    const generatedTypes = read("src/integrations/supabase/types.generated.ts");
    const migration = read("supabase/migrations/20260905151306_drop_unused_event_favorites_g6.sql");

    expect(engagement).toContain("ProfileSavedEntityService");
    expect(engagement).not.toContain("event_favorites");
    expect(generatedTypes).not.toContain("event_favorites: {");
    expect(migration).toContain("DROP TABLE public.event_favorites RESTRICT");
  });

  it("does not advertise persistent event reminders without a delivery authority", () => {
    const engagement = read(
      "src/core/community-events/services/EventEngagementService.ts",
    );
    const detail = read("src/modules/community-events/pages/EventDetailPage.tsx");
    const publicApi = read("src/core/community-events/index.ts");

    expect(engagement).not.toContain("event_reminders");
    expect(engagement).not.toContain("EVENT_REMINDER_TIMES");
    expect(engagement).not.toContain("getReminderTimes");
    expect(engagement).not.toContain("saveReminderTimes");
    expect(detail).not.toContain("EventReminders");
    expect(publicApi).not.toContain("EventReminderTime");
    expect(publicApi).not.toContain("EVENT_REMINDER_TIMES");
  });


  it("aligns event review UI with the hardened helpfulness authority", () => {
    const reviews = read(
      "src/modules/community-events/components/EventReviews.tsx",
    );

    expect(reviews).toContain(
      "reviewerProfileId === review.reviewerProfileId",
    );
    expect(reviews).not.toContain("<Flag");
    expect(reviews).not.toContain(">Reportar<");
  });


  it("protects server-owned event state from organizer REST tampering", () => {
    const migration = read(
      "supabase/migrations/20260906061022_guard_event_server_owned_state_g6.sql",
    );
    const eventTypes = read("src/core/community-events/types.ts");
    const adminService = read("src/core/admin/services/AdminEventsService.ts");

    expect(migration).toContain("event_current_participants_server_owned");
    expect(migration).toContain("event_organizer_server_owned");
    expect(migration).toContain("event_status_server_owned");
    expect(migration).toContain(
      "CHECK (current_participants >= 0)",
    );
    expect(migration).toContain(
      "current_participants <= max_participants",
    );
    expect(eventTypes).toContain(
      "export type UpdateEventInput = Partial<CreateEventInput>",
    );
    expect(eventTypes).not.toMatch(
      /interface CreateEventInput[\s\S]*?current_participants:/,
    );
    expect(adminService).toContain("current_participants,");
    expect(adminService).toContain('update({ status: "cancelled" })');
    expect(adminService).toContain('update({ status: "completed" })');
  });


  it("keeps active-event freshness inside the Events owner", () => {
    const freshness = read("src/core/community-events/eventFreshness.ts");
    const readService = read(
      "src/core/community-events/services/EventReadService.ts",
    );
    const linkEligibility = read(
      "src/core/community-events/services/EventLinkEligibilityService.ts",
    );
    const homeFreshness = read(
      "src/core/landing/utils/territoryHomeFreshness.ts",
    );

    expect(freshness).toContain("isEventCurrentOrFuture");
    expect(readService).toContain("applyActiveStatusFreshness");
    expect(readService).toContain("status.eq.upcoming");
    expect(readService).toContain("status.eq.ongoing");
    expect(readService).toContain("end_date.gte");
    expect(linkEligibility).toContain("isEventCurrentOrFuture(event)");
    expect(homeFreshness).toContain(
      '@/core/community-events/eventFreshness',
    );
  });


});
