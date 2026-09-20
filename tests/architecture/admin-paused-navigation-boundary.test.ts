import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

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

describe("admin paused navigation boundary", () => {
  it("keeps paused admin routes out of the visible sidebar", () => {
    for (const exportName of [
      "AdminVagas",
      "AdminEventos",
      "AdminMotoristas",
      "AdminReportsPassageiros",
      "AdminPontosEmbarque",
      "AdminAnalyticsMobilidade",
      "AdminAnalytics",
      "AdminCupons",
      "AdminPromocoes",
      "AdminMensagens",
      "AdminComunicacao",
    ]) {
      expect(adminLazyImports).toContain(
        `export const ${exportName} = createLaunchPausedRoute`,
      );
    }

    for (const id of [
      "motoristas",
      "reports-passageiros",
      "pontos-embarque",
      "analytics-mobilidade",
      "vagas",
      "eventos",
      "analytics",
      "cupons",
      "promocoes",
      "mensagens",
      "comunicacao",
    ]) {
      expect(adminNavigation).toContain(`"${id}"`);
    }

    expect(adminNavigation).toContain("ADMIN_VISIBLE_NAV_SECTIONS");
    expect(adminNavigation).toContain("ADMIN_PAUSED_NAV_ITEM_IDS");
    expect(adminLayout).toContain("ADMIN_VISIBLE_NAV_SECTIONS");
    expect(adminLayout).not.toContain("ADMIN_NAV_SECTIONS.map");
  });
});
