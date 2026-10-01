import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getActiveBusinessManagementNavigation } from "../../src/app/config/businessManagementSurfaceScope";
import * as lifecycle from "../../src/app/config/lifecycleRegistry";

afterEach(() => vi.restoreAllMocks());

describe("Business Central navigation certification", () => {
  it("exposes exactly eight certified real management routes, in order", () => {
    const items = getActiveBusinessManagementNavigation();
    expect(items.map((item) => item.id)).toEqual([
      "overview",
      "edit",
      "photos",
      "hours",
      "location",
      "catalog",
      "dados",
      "configuracoes",
    ]);
    const routes = readFileSync(
      "src/app/routes/sections/CentralRoutes.tsx",
      "utf8",
    );
    const paths = [...routes.matchAll(/path="([^"]+)"/g)].map(
      (match) => match[1],
    );
    for (const item of items) {
      expect(item.owner).toBe("business");
      expect(item.group).toBe("management");
      expect(item.buildRoute("real-id")).toBe(
        `/central/empresas/real-id${item.routePath ? "/" + item.routePath : ""}`,
      );
      if (item.routePath) expect(paths).toContain(item.routePath);
      else
        expect(routes).toMatch(
          /<Route\s+index\s+element={[\s\S]*?<P.BusinessOverviewPage/,
        );
    }
    expect(paths).toEqual([
      "empresas",
      "empresas/nova",
      "empresas/:businessId",
      "editar",
      "fotos",
      "horarios",
      "localizacao",
      "produtos-servicos",
      "dados",
      "configuracoes",
      "*",
    ]);
  });

  it("fails closed when Business or Central is disabled", () => {
    vi.spyOn(lifecycle, "isProductModuleEnabled").mockReturnValue(false);
    expect(getActiveBusinessManagementNavigation()).toEqual([]);
    vi.restoreAllMocks();
    vi.spyOn(lifecycle, "isPlatformCapabilityEnabled").mockReturnValue(false);
    expect(getActiveBusinessManagementNavigation()).toEqual([]);
  });

  it("keeps the management shell as the sole runtime navigation owner", () => {
    const locationPage = readFileSync(
      "src/modules/business/dashboard/pages/BusinessLocationPage.tsx",
      "utf8",
    );

    expect(locationPage).toContain("showIdentity={false}");
    expect(locationPage).toContain("showSteps={false}");
    expect(locationPage).toContain("showSteps = showIdentity");
    expect(locationPage).not.toContain("<h1>4. Localização</h1>");
    expect(locationPage).not.toContain("window.confirm");
  });

  it("uses one registry for the desktop/mobile shell and no nested domain inbox", () => {
    const routes = readFileSync(
      "src/app/routes/sections/CentralRoutes.tsx",
      "utf8",
    );
    const shell = readFileSync(
      "src/modules/business/dashboard/pages/BusinessDashboardShellPage.tsx",
      "utf8",
    );
    expect(routes).toContain(
      "navigationItems={getActiveBusinessManagementNavigation()}",
    );
    expect(shell).toContain("navigationItems.map");
    expect(shell).not.toContain("const navItems: NavItem[]");
    expect(routes).not.toMatch(
      /path="(mensagens|avaliacoes|estatisticas|analytics|planos)"/,
    );
  });
});
