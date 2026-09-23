import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const pathOf = (path: string) => resolve(root, path);
const read = (path: string) => readFileSync(pathOf(path), "utf8");

const retiredConceptPages = [
  "src/modules/business/dashboard/pages/BusinessManagementConceptPreviewPage.tsx",
  "src/modules/business/dashboard/pages/BusinessMenuConceptPreviewPage.tsx",
  "src/modules/central/pages/CentralMotoboyConceptMockPage.tsx",
  "src/modules/central/pages/CentralMotoboyCadastroConceptMockPage.tsx",
  "src/modules/central/pages/CentralMotoboyGanhosConceptMockPage.tsx",
] as const;

describe("MVP Central runtime without concept-mock router bypasses", () => {
  it("keeps concept previews and mocks out of the runtime tree", () => {
    for (const path of retiredConceptPages) {
      expect(existsSync(pathOf(path)), path).toBe(false);
    }

    const routes = read("src/app/routes/sections/CentralRoutes.tsx");
    const lazyImports = read("src/app/routes/centralLazyImports.ts");

    expect(routes).not.toContain("concept-mock");
    expect(routes).not.toContain("import.meta.env.DEV");
    expect(routes).not.toContain("BusinessManagementConceptPreviewPage");
    expect(routes).not.toContain("BusinessMenuConceptPreviewPage");
    expect(routes).not.toContain("CentralMotoboyConceptMockPage");
    expect(routes).not.toContain("CentralMotoboyCadastroConceptMockPage");
    expect(routes).not.toContain("CentralMotoboyGanhosConceptMockPage");

    for (const retired of [
      "BusinessManagementConceptPreviewPage",
      "BusinessMenuConceptPreviewPage",
      "CentralMotoboyConceptMockPage",
      "CentralMotoboyCadastroConceptMockPage",
      "CentralMotoboyGanhosConceptMockPage",
    ]) {
      expect(lazyImports, retired).not.toContain(retired);
    }
  });

  it("keeps paused Mobility behind the launch lifecycle instead of a DEV query bypass", () => {
    const routes = read("src/app/routes/sections/CentralRoutes.tsx");

    expect(routes).toContain(
      'path="motoboy" element={launchElement("mobility", "Mobilidade", <P.DriverGuard service="motoboy" />)}',
    );
    expect(routes).toContain(
      'path="motorista" element={launchElement("mobility", "Mobilidade", <P.DriverGuard service="motorista" />)}',
    );
  });
});
