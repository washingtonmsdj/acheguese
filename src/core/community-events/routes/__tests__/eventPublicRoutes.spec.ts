import { describe, expect, it } from "vitest";

import {
  eventPublicRoutes,
  eventTerritorialRoutePaths,
} from "@/core/community-events/routes/eventPublicRoutes";

describe("eventPublicRoutes", () => {
  it("builds global event utility entry points from module slug SSOT", () => {
    expect(eventPublicRoutes.home()).toBe("/eventos");
    expect(eventPublicRoutes.favorites()).toBe("/eventos/favoritos");
    expect(eventPublicRoutes.calendar()).toBe("/eventos/calendario");
    expect(eventPublicRoutes.map()).toBe("/eventos/mapa");
    expect(eventPublicRoutes.detail("event-123")).toBe("/eventos/evento/event-123");
  });

  it("builds canonical territorial event route patterns", () => {
    expect(eventTerritorialRoutePaths.home()).toBe("/:state/:city/eventos");
    expect(eventTerritorialRoutePaths.district()).toBe(
      "/:state/:city/:district/eventos",
    );
    expect(eventTerritorialRoutePaths.favorites()).toBe(
      "/:state/:city/eventos/favoritos",
    );
    expect(eventTerritorialRoutePaths.calendar()).toBe(
      "/:state/:city/eventos/calendario",
    );
    expect(eventTerritorialRoutePaths.map()).toBe("/:state/:city/eventos/mapa");
    expect(eventTerritorialRoutePaths.detail()).toBe(
      "/:state/:city/eventos/evento/:eventId",
    );
  });

  it("builds child urls from a resolved event territory base", () => {
    const base = "/ba/salvador/eventos";

    expect(eventPublicRoutes.favoritesFromBase(base)).toBe(
      "/ba/salvador/eventos/favoritos",
    );
    expect(eventPublicRoutes.calendarFromBase(base)).toBe(
      "/ba/salvador/eventos/calendario",
    );
    expect(eventPublicRoutes.mapFromBase(base)).toBe("/ba/salvador/eventos/mapa");
    expect(eventPublicRoutes.detailFromBase(base, "event-123")).toBe(
      "/ba/salvador/eventos/evento/event-123",
    );
  });

  it("rejects route segment injection", () => {
    expect(() => eventPublicRoutes.detail("event-123/extra")).toThrow(/id do evento/);
    expect(() =>
      eventPublicRoutes.detailFromBase("/ba/salvador/eventos", "event-123?x=1"),
    ).toThrow(/id do evento/);
  });
});
