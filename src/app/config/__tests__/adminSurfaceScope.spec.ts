import { describe, expect, it } from "vitest";
import { ADMIN_NAV_SECTIONS } from "@/modules/admin/config/adminNavigation.config";
import {
  filterAdminNavigationSections,
  isAdminSurfaceEnabled,
} from "../adminSurfaceScope";

describe("adminSurfaceScope", () => {
  it("inherits product and capability lifecycle for admin surfaces", () => {
    expect(isAdminSurfaceEnabled("dashboard")).toBe(true);
    expect(isAdminSurfaceEnabled("empresas")).toBe(true);
    expect(isAdminSurfaceEnabled("mapa")).toBe(true);
    expect(isAdminSurfaceEnabled("notifications")).toBe(true);

    expect(isAdminSurfaceEnabled("gastronomia")).toBe(false);
    expect(isAdminSurfaceEnabled("services")).toBe(false);
    expect(isAdminSurfaceEnabled("classificados")).toBe(false);
    expect(isAdminSurfaceEnabled("vagas")).toBe(false);
    expect(isAdminSurfaceEnabled("eventos")).toBe(false);
    expect(isAdminSurfaceEnabled("motoristas")).toBe(false);
    expect(isAdminSurfaceEnabled("pontos-turisticos")).toBe(false);
    expect(isAdminSurfaceEnabled("assinaturas")).toBe(false);
  });

  it("keeps the uncertified admin messaging console paused independently", () => {
    expect(isAdminSurfaceEnabled("mensagens")).toBe(false);
  });

  it("filters the full navigation inventory without a second paused list", () => {
    const visibleIds = filterAdminNavigationSections(ADMIN_NAV_SECTIONS)
      .flatMap((section) => section.items)
      .map((item) => item.id);

    expect(visibleIds).toContain("dashboard");
    expect(visibleIds).toContain("empresas");
    expect(visibleIds).toContain("mapa");
    expect(visibleIds).toContain("notifications");

    for (const pausedId of [
      "gastronomia",
      "services",
      "classificados",
      "vagas",
      "eventos",
      "motoristas",
      "reports-passageiros",
      "pontos-embarque",
      "analytics-mobilidade",
      "pricing",
      "cupons",
      "promocoes",
      "assinaturas",
      "community-alerts",
      "community-issues",
      "community-interest",
      "comunicacao",
      "mensagens",
      "analytics",
      "pontos-turisticos",
    ]) {
      expect(visibleIds).not.toContain(pausedId);
    }
  });
});
