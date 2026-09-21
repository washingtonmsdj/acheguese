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
  it("keeps the documented business alias as a redirect only", () => {
    expect(routes).toContain('path="/empresas-landing"');
    expect(routes).toContain('element={<Navigate to="/empresas" replace />}');
    expect(routes).not.toContain(
      '<Route path="/empresas-landing" element={<P.EmpresasLandingPage />} />',
    );
    expect(sidebar).not.toContain('pathname === "/empresas-landing"');
  });

  it("does not keep an undocumented services landing alias", () => {
    expect(routes).not.toContain('path="/servicos-landing"');
    expect(routes).toContain(
      '<Route path="/servicos" element={<P.ServicosLandingPage />} />',
    );
  });
});
