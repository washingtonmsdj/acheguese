import { describe, expect, it } from "vitest";
import { MapEntityProjectionService } from "../MapEntityProjectionService";

const projection = new MapEntityProjectionService();
const baseEntity = {
  id: "business-1",
  name: "Padaria Central",
  latitude: -12.9714,
  longitude: -38.5014,
};

describe("MapEntityProjectionService URL boundary", () => {
  it("keeps validated internal marker routes", () => {
    const marker = projection.projectEntity(
      { ...baseEntity, url: "/empresas/padaria-central?ref=mapa" },
      "business",
    );

    expect(marker?.url).toBe("/empresas/padaria-central?ref=mapa");
  });

  it("normalizes same-origin absolute marker routes to router paths", () => {
    const marker = projection.projectEntity(
      {
        ...baseEntity,
        url: `${window.location.origin}/empresas/padaria-central`,
      },
      "business",
    );

    expect(marker?.url).toBe("/empresas/padaria-central");
  });

  it("drops unsafe explicit URLs when no canonical fallback exists", () => {
    expect(
      projection.projectEntity(
        { ...baseEntity, url: "javascript:alert(1)" },
        "business",
      )?.url,
    ).toBeUndefined();

    expect(
      projection.projectEntity(
        { ...baseEntity, url: "https://evil.example/phishing" },
        "business",
      )?.url,
    ).toBeUndefined();
  });

  it("falls back to a canonical slug route when an explicit URL is unsafe", () => {
    const marker = projection.projectEntity(
      {
        ...baseEntity,
        slug: "padaria-central",
        url: "https://evil.example/phishing",
      },
      "business",
      { baseUrl: "/empresas" },
    );

    expect(marker?.url).toBe("/empresas/padaria-central");
  });

  it("fails closed when a slug tries to inject a path separator", () => {
    const marker = projection.projectEntity(
      { ...baseEntity, slug: "../admin" },
      "business",
      { baseUrl: "/empresas" },
    );

    expect(marker?.url).toBeUndefined();
  });
});