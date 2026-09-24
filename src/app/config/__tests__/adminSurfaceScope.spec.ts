import { describe, expect, it } from "vitest";
import { ADMIN_NAV_SECTIONS } from "@/modules/admin/config/adminNavigation.config";
import {
  filterAdminNavigationSections,
  isAdminSurfaceEnabled,
} from "../adminSurfaceScope";

describe("adminSurfaceScope", () => {
  it("inherits lifecycle except for explicitly uncertified admin-only surfaces", () => {
    expect(isAdminSurfaceEnabled("dashboard")).toBe(true);
    expect(isAdminSurfaceEnabled("empresas")).toBe(true);
    expect(isAdminSurfaceEnabled("mapa")).toBe(true);
    expect(isAdminSurfaceEnabled("notifications")).toBe(false);

    expect(isAdminSurfaceEnabled("gastronomia")).toBe(false);
    expect(isAdminSurfaceEnabled("services")).toBe(false);
    expect(isAdminSurfaceEnabled("classificados")).toBe(false);
    expect(isAdminSurfaceEnabled("vagas")).toBe(false);
    expect(isAdminSurfaceEnabled("eventos")).toBe(false);
    expect(isAdminSurfaceEnabled("motoristas")).toBe(false);
    expect(isAdminSurfaceEnabled("pontos-turisticos")).toBe(false);
    expect(isAdminSurfaceEnabled("assinaturas")).toBe(false);
  });

  it("keeps uncertified admin consoles paused independently from horizontal capabilities", () => {
    expect(isAdminSurfaceEnabled("mensagens")).toBe(false);
    expect(isAdminSurfaceEnabled("notifications")).toBe(false);
  });

  it("filters the full navigation inventory without a second paused list", () => {
    const visibleIds = filterAdminNavigationSections(ADMIN_NAV_SECTIONS)
      .flatMap((section) => section.items)
      .map((item) => item.id);

    expect(visibleIds).toContain("dashboard");
    expect(visibleIds).toContain("empresas");
    expect(visibleIds).toContain("mapa");

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
      "notifications",
    ]) {
      expect(visibleIds).not.toContain(pausedId);
    }
  });
});
