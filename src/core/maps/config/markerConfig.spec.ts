import { describe, expect, it } from "vitest";

import { getLayerConfig, getMarkerConfig } from "./markerConfig";

describe("markerConfig SSOT", () => {
  it("returns mapped layer config for runtime layers", () => {
    expect(getLayerConfig("businesses").label).toBe("Negócio");
    expect(getLayerConfig("gastronomy").label).toBe("Gastronomia");
    expect(getLayerConfig("events").label).toBe("Evento");
    expect(getLayerConfig("alerts").label).toBe("Alerta");
    expect(getLayerConfig("tourist_points").label).toBe("Ponto Turístico");
  });

  it("falls back to default layer config for unknown key", () => {
    const cfg = getLayerConfig("boundaries");
    expect(cfg.label).toBe("boundaries");
    expect(cfg.color).toBe("#6b7280");
  });

  it("returns marker config for mapped entity type", () => {
    expect(getMarkerConfig("tourist_point").abbr).toBe("T");
    expect(getMarkerConfig("alert").color).toBe("#ef4444");
  });
});
