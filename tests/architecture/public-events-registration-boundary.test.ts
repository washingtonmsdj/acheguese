import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public events registration boundary", () => {
  const tickets = readFileSync(
    "src/modules/community-events/components/EventTickets.tsx",
    "utf8",
  );
  const detail = readFileSync(
    "src/modules/community-events/pages/EventDetailPage.tsx",
    "utf8",
  );
  const cta = readFileSync(
    "src/modules/community-events/components/EventCTA.tsx",
    "utf8",
  );

  it("allows internal registration only for free tickets", () => {
    expect(tickets).toContain(
      "const canSelect = isAvailable && ticket.is_free && !disabled",
    );
    expect(tickets).toContain("Venda nao disponivel no app");
    expect(tickets).not.toContain("Comprar ingresso");
  });

  it("guards paid tickets before the participation command", () => {
    const paidGuard = detail.indexOf("if (!selectedTicket.is_free)");
    const joinCommand = detail.indexOf(".joinEvent(event.id, activeProfile.id)");

    expect(paidGuard).toBeGreaterThanOrEqual(0);
    expect(joinCommand).toBeGreaterThan(paidGuard);
    expect(detail).toContain("Ingressos pagos ainda nao possuem checkout");
  });

  it("keeps the sticky CTA scoped to free registration", () => {
    expect(detail).toContain("{hasFreeTickets && (");
    expect(detail).toContain("availableFreeTicket");
    expect(detail).toContain("hasPaidAvailability");
    expect(detail).not.toContain("'Comprar ingresso'");
    expect(cta).not.toContain("Comprar ingresso");
    expect(cta).toContain(": cta.label");
  });
});
