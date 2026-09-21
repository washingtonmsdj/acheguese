import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appLazyImports = readFileSync(
  "src/app/routes/lazyImports.ts",
  "utf8",
);
const adminLazyImports = readFileSync(
  "src/app/routes/adminLazyImports.ts",
  "utf8",
);
const adminNavigation = readFileSync(
  "src/modules/admin/config/adminNavigation.config.ts",
  "utf8",
);
const adminLayout = readFileSync(
  "src/modules/admin/pages/AdminLayout.tsx",
  "utf8",
);

const PAUSED_ADMIN_DESTINATIONS = [
  { exportName: "AdminMotoristas", path: "/admin/motoristas" },
  { exportName: "AdminReportsPassageiros", path: "/admin/reports-passageiros" },
  { exportName: "AdminPontosEmbarque", path: "/admin/pontos-embarque" },
  { exportName: "AdminAnalyticsMobilidade", path: "/admin/analytics-mobilidade" },
  { exportName: "AdminVagas", path: "/admin/vagas" },
  { exportName: "AdminEventos", path: "/admin/eventos" },
  { exportName: "AdminAnalytics", path: "/admin/analytics" },
  { exportName: "AdminCupons", path: "/admin/cupons" },
  { exportName: "AdminPromocoes", path: "/admin/promocoes" },
  { exportName: "AdminMensagens", path: "/admin/mensagens" },
  { exportName: "AdminComunicacao", path: "/admin/comunicacao" },
] as const;

function pausedNavigationIds(): Set<string> {
  const match = adminNavigation.match(
    /const ADMIN_PAUSED_NAV_ITEM_IDS = new Set\(\[([\s\S]*?)\]\);/,
  );

  expect(match, "ADMIN_PAUSED_NAV_ITEM_IDS must remain explicit").not.toBeNull();

  return new Set(
    [...(match?.[1] ?? "").matchAll(/"([^"]+)"/g)].map(
      (entry) => entry[1],
    ),
  );
}

function navigationIdForPath(path: string): string {
  const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = adminNavigation.match(
    new RegExp(
      `id:\\s*"([^"]+)"\\s*,\\s*to:\\s*"${escapedPath}"`,
    ),
  );

  expect(match, `navigation item for ${path} must exist in the full inventory`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("admin paused navigation boundary", () => {
  it("keeps the admin tree owned only by adminLazyImports", () => {
    expect(appLazyImports).not.toMatch(/export const Admin[A-Z]/);
    expect(appLazyImports).not.toContain("LocationsAdminPage");
    expect(adminLazyImports).toContain("export const AdminLayout");
    expect(adminLazyImports).toContain("export const LocationsAdminPage");
    expect(adminLazyImports).toContain("export const AdminGuideTouristPointsPage");
    expect(adminLazyImports).toContain("export const AdminGuideTouristPointFormPage");
  });

  it("keeps every paused admin route out of the visible sidebar", () => {
    const pausedIds = pausedNavigationIds();

    for (const { exportName, path } of PAUSED_ADMIN_DESTINATIONS) {
      expect(adminLazyImports).toContain(
        `export const ${exportName} = createLaunchPausedRoute`,
      );

      const navId = navigationIdForPath(path);
      expect(pausedIds, `${path} must be filtered by its real navigation id`).toContain(
        navId,
      );
    }

    expect(adminNavigation).toContain("ADMIN_VISIBLE_NAV_SECTIONS");
    expect(adminLayout).toContain("ADMIN_VISIBLE_NAV_SECTIONS");
    expect(adminLayout).not.toContain("ADMIN_NAV_SECTIONS.map");
  });
});
