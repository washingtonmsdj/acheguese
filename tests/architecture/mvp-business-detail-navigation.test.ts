import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("MVP Business detail navigation", () => {
  it("keeps the active Business shell on certified MVP destinations", () => {
    const source = readFileSync(
      "src/modules/business/company/pages/EmpresaDetailLayout.tsx",
      "utf8",
    );

    expect(source).toContain('to="/buscar"');
    expect(source).toContain('to="/notificacoes"');
    expect(source).toContain("LAUNCH_URLS.business");

    expect(source).not.toContain('to="/explorar"');
    expect(source).not.toContain('to="/favoritos"');
    expect(source).not.toContain("servicos, eventos");
    expect(source).not.toContain("Ctrl K");
  });
});
