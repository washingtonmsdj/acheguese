import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ADMIN_LOCATION_DOCS = [
  "src/modules/admin/docs/ADMIN_LOCATIONS_INTERFACE.md",
  "src/modules/admin/docs/SISTEMA_ESCALAVEL_ADMIN.md",
] as const;

describe("admin location documentation hygiene", () => {
  it("keeps live Admin Location docs on the current operational SSOT", () => {
    for (const path of ADMIN_LOCATION_DOCS) {
      const content = readFileSync(path, "utf8");

      expect(content).toContain("docs/08-roadmap/EXECUCAO_MAIN_ONLY.md");
      expect(content).not.toContain("docs/STATUS_ATUAL.md");
      expect(content).not.toContain("Status vigente: `../../../../docs/STATUS_ATUAL.md`");
    }
  });

  it("does not restore absolute scalability claims as technical contracts", () => {
    const overview = readFileSync(
      "src/modules/admin/docs/SISTEMA_ESCALAVEL_ADMIN.md",
      "utf8",
    );

    expect(overview).not.toContain("Sistema 100% Escalável");
    expect(overview).not.toContain("Sem limite de quantidade");
    expect(overview).not.toContain("Integração Automática");
  });

  it("documents the canonical Location owner and Territory boundary", () => {
    const contract = readFileSync(
      "src/modules/admin/docs/ADMIN_LOCATIONS_INTERFACE.md",
      "utf8",
    );

    expect(contract).toContain("src/core/location/services/LocationAdminService.ts");
    expect(contract).toContain("is_selector_active");
    expect(contract).toContain("is_landing_enabled");
    expect(contract).toContain("is_navigable");
    expect(contract).not.toContain("herda automaticamente do parent");
  });
});
