import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public events capacity and analytics truthfulness", () => {
  const adapter = readFileSync(
    "src/modules/community-events/utils/eventAdapters.ts",
    "utf8",
  );
  const types = readFileSync(
    "src/modules/community-events/types/index.ts",
    "utf8",
  );
  const tickets = readFileSync(
    "src/modules/community-events/components/EventTickets.tsx",
    "utf8",
  );
  const detail = readFileSync(
    "src/modules/community-events/pages/EventDetailPage.tsx",
    "utf8",
  );
  const hero = readFileSync(
    "src/modules/community-events/components/EventHero.tsx",
    "utf8",
  );
  const analytics = readFileSync(
    "src/modules/community-events/components/EventAnalyticsCard.tsx",
    "utf8",
  );
  const dashboardModel = readFileSync(
    "src/modules/community-events/pages/EventsOrganizerDashboard.model.ts",
    "utf8",
  );
  const dashboardSections = readFileSync(
    "src/modules/community-events/pages/EventsOrganizerDashboardSections.tsx",
    "utf8",
  );

  it("represents unknown capacity instead of inventing inventory", () => {
    expect(types).toContain("quantity_total: number | null");
    expect(types).toContain("quantity_available: number | null");
    expect(adapter).toContain("quantity_total: capacity ?? null");
    expect(adapter).toContain("capacity === undefined");
    expect(adapter).not.toContain("Math.max(input.current_participants, 100)");
    expect(adapter).not.toContain("quantity_total: 100");
  });

  it("keeps uncapped free registration open without fake quantities", () => {
    expect(detail).toContain(
      "ticket.quantity_available === null || ticket.quantity_available > 0",
    );
    expect(tickets).toContain(
      "Inscricoes abertas · limite nao informado",
    );
    expect(tickets).toContain("occupancyRate !== null");
    expect(tickets).not.toContain("Popular");
  });

  it("maps persisted event lifecycle states instead of flattening them", () => {
    expect(adapter).toContain('case "ongoing":');
    expect(adapter).toContain('return "em_andamento"');
    expect(adapter).toContain('case "completed":');
    expect(adapter).toContain('return "finalizado"');
    expect(adapter).toContain('case "cancelled":');
    expect(adapter).toContain('return "cancelado"');
  });

  it("does not present uninstrumented analytics as real metrics", () => {
    expect(hero).not.toContain("event.views_count");
    expect(analytics).not.toContain("revenueTotal");
    expect(analytics).not.toContain("event.views_count");
    expect(analytics).not.toContain("event.favorites_count");
    expect(analytics).not.toContain("event.shares_count");
    expect(analytics).toContain("confirmacao real de pagamento");

    expect(dashboardModel).not.toContain("totalViews");
    expect(dashboardModel).not.toContain("totalRevenue");
    expect(dashboardSections).not.toContain("+12% este mes");
    expect(dashboardSections).not.toContain("+8% este mes");
    expect(dashboardSections).not.toContain("+15% este mes");
    expect(dashboardSections).not.toContain("stats.totalViews");
    expect(dashboardSections).not.toContain("stats.totalRevenue");
  });
});
