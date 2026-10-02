import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { APP_PATHS } from "../appPaths";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("APP_PATHS", () => {
  it("owns canonical static global routes", () => {
    expect(APP_PATHS).toEqual({
      home: "/",
      search: "/busca",
      aiSearch: "/buscar",
      notifications: "/notificacoes",
      emailLogs: "/settings/email-logs",
    });
  });

  it("keeps active runtime consumers on the canonical route SSOT", () => {
    const runtimeFiles = [
      "src/app/routes/sections/AppLayoutRoutes.tsx",
      "src/core/routing/config/authRequiredRuntimeRoutes.ts",
      "src/core/routing/hooks/useAppUrls.ts",
      "src/app/routes/prefetch.ts",
      "src/modules/central/components/CentralHeader.tsx",
      "src/shared/components/territory-vivo/TerritoryTopbar.tsx",
      "src/modules/business/company/pages/EmpresaDetailLayout.tsx",
    ];

    for (const path of runtimeFiles) {
      const source = readProjectFile(path);
      expect(source, path).not.toContain('"/notificacoes"');
      expect(source, path).not.toContain('"/settings/email-logs"');
    }

    const routeTree = readProjectFile(
      "src/app/routes/sections/AppLayoutRoutes.tsx",
    );
    expect(routeTree).not.toContain('path="/busca"');
    expect(routeTree).not.toContain('path="/buscar"');

    const businessDetail = readProjectFile(
      "src/modules/business/company/pages/EmpresaDetailLayout.tsx",
    );
    expect(businessDetail).not.toContain('to="/buscar"');
  });
});
