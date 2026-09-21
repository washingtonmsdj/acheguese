import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routes = readFileSync(
  "src/app/routes/sections/AppLayoutRoutes.tsx",
  "utf8",
);
const sidebar = readFileSync(
  "src/app/components/AppLayoutSidebar.tsx",
  "utf8",
);

describe("public landing alias ownership", () => {
  it("does not preserve the obsolete business landing alias", () => {
    expect(routes).not.toContain('path="/empresas-landing"');
    expect(routes).not.toContain('Navigate to="/empresas"');
    expect(sidebar).not.toContain('pathname === "/empresas-landing"');
  });

  it("does not keep an undocumented services landing alias", () => {
    expect(routes).not.toContain('path="/servicos-landing"');
    expect(routes).toContain('path="/servicos"');
    expect(routes).toContain('launchElement("services", "Serviços"');
  });
});
