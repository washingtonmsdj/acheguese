import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("documentação e topologia física canônicas", () => {
  it("mantém estudos obsoletos fora do roadmap executável", () => {
    const archived = "docs/10-archive/plans/MONOREPO_MIGRATION_PLAN_2026-04.md";
    expect(existsSync(archived)).toBe(true);
    expect(existsSync("docs/08-roadmap/MONOREPO_MIGRATION_PLAN.md")).toBe(false);
    expect(read(archived)).toContain("ARQUIVADO — estudo histórico");
    expect(read("docs/08-roadmap/README.md")).toContain(archived.replace("docs/", "../"));
    expect(read("docs/DECISIONS.md")).not.toContain(
      "`08-roadmap/MONOREPO_MIGRATION_PLAN.md`",
    );
  });

  it("preserva um só índice normativo e um mapa explícito de diretórios", () => {
    const index = read("docs/README.md");
    const maintenance = read("docs/03-architecture/MAINTENANCE.md");
    expect(index).toContain("03-architecture/MAINTENANCE.md");
    expect(index).toContain("10-archive/plans/MONOREPO_MIGRATION_PLAN_2026-04.md");
    for (const root of [
      "src/app/",
      "src/core/",
      "src/modules/",
      "src/shared/",
      "src/integrations/",
      "tools/",
    ]) {
      expect(maintenance, root).toContain(root);
    }
    expect(maintenance).toContain("docs/architecture/SSOT_REGISTRY.md");
    expect(maintenance).not.toContain("src/<dominio>/README.md");
  });

  it("usa o README de Empresas como índice e não como checkpoint antigo", () => {
    const business = read("src/modules/business/README.md");
    expect(business).toContain("VALIDATION.md");
    expect(business).toContain("BusinessService.createBusiness()");
    expect(business).toContain("docs/08-roadmap/EXECUCAO_MAIN_ONLY.md");
    expect(business).not.toContain("G4 SSOT SOURCE CLOSED");
    expect(business).not.toContain("NAO MVP CERTIFICADO");
  });

  it("mantém taxonomia de módulos íntegra sem listas quebradas", () => {
    const modules = read("src/modules/README.md");
    expect(modules).toContain("Estado oficial das verticais:");
    expect(modules).toContain("`business/company`");
    expect(modules).toContain("`community-events`");
    expect(modules).not.toMatch(/^: `/m);
    expect(modules).toContain("`src/core/community-experience`");
  });
});
