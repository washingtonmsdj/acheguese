import { describe, expect, it } from "vitest";

import {
  EVENT_PUBLIC_ROUTE_PARAMS,
  eventPublicRoutes,
  eventTerritorialRoutePaths,
} from "@/core/events/routes/eventPublicRoutes";

describe("eventPublicRoutes", () => {
  it("builds legacy public event utility routes from module slug SSOT", () => {
    expect(eventPublicRoutes.home()).toBe("/eventos");
    expect(eventPublicRoutes.favorites()).toBe("/eventos/favoritos");
    expect(eventPublicRoutes.calendar()).toBe("/eventos/calendario");
    expect(eventPublicRoutes.map()).toBe("/eventos/mapa");
    expect(eventPublicRoutes.detail("event-123")).toBe("/eventos/evento/event-123");
  });

  it("exposes backward-compatible detail route pattern for old links", () => {
    expect(eventPublicRoutes.legacyDetail(EVENT_PUBLIC_ROUTE_PARAMS.eventId)).toBe(
      "/eventos/:eventId",
    );
  });

  it("builds canonical territorial event route patterns", () => {
    expect(eventTerritorialRoutePaths.home()).toBe("/eventos/:state/:city");
    expect(eventTerritorialRoutePaths.district()).toBe(
      "/eventos/:state/:city/:district",
    );
    expect(eventTerritorialRoutePaths.favorites()).toBe(
      "/eventos/:state/:city/favoritos",
    );
    expect(eventTerritorialRoutePaths.calendar()).toBe(
      "/eventos/:state/:city/calendario",
    );
    expect(eventTerritorialRoutePaths.map()).toBe("/eventos/:state/:city/mapa");
    expect(eventTerritorialRoutePaths.detail()).toBe(
      "/eventos/:state/:city/evento/:eventId",
    );
  });

  it("builds child urls from a resolved event territory base", () => {
    const base = "/eventos/ba/salvador";

    expect(eventPublicRoutes.favoritesFromBase(base)).toBe(
      "/eventos/ba/salvador/favoritos",
    );
    expect(eventPublicRoutes.calendarFromBase(base)).toBe(
      "/eventos/ba/salvador/calendario",
    );
    expect(eventPublicRoutes.mapFromBase(base)).toBe("/eventos/ba/salvador/mapa");
    expect(eventPublicRoutes.detailFromBase(base, "event-123")).toBe(
      "/eventos/ba/salvador/evento/event-123",
    );
  });

  it("rejects route segment injection", () => {
    expect(() => eventPublicRoutes.detail("event-123/extra")).toThrow(/id do evento/);
    expect(() =>
      eventPublicRoutes.detailFromBase("/eventos/ba/salvador", "event-123?x=1"),
    ).toThrow(/id do evento/);
  });
});
