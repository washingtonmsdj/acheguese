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

  it("keeps paused Services out of the active public router", () => {
    expect(routes).not.toContain('path="/servicos-landing"');
    expect(routes).not.toContain('path="/servicos"');
    expect(routes).not.toContain('launchElement("services"');
    expect(routes).not.toContain("LaunchPausedPage");
  });
});
