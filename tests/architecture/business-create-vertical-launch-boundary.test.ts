import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const centralRoutes = read("src/app/routes/sections/CentralRoutes.tsx");
const createPage = read("src/modules/business/pages/CriarEmpresaPage.tsx");
const businessLifecycle = read("tests/e2e/business-lifecycle-authenticated.spec.ts");
const businessCreateForm = read("tests/e2e/business-create-form.spec.ts");

describe("MVP Business create vertical launch boundary", () => {
  it("keeps generic Business creation active and contextual vertical routes out of the active Central graph", () => {
    expect(centralRoutes).toContain('isProductModuleEnabled("business")');
    expect(centralRoutes).toContain('path="empresas/nova"');
    expect(centralRoutes).toContain('element={<P.CriarEmpresaPage />}');
    expect(centralRoutes).not.toContain('path="empresas/nova/:verticalSlug"');
    expect(centralRoutes).not.toContain("VERTICAL_CONFIGS");
    expect(centralRoutes).not.toContain("vertical.createSlugs.map");
    expect(centralRoutes).not.toContain("launchElement");
  });

  it("does not redirect generic Business creation into a paused vertical", () => {
    expect(createPage).toContain(
      'import { isLaunchSurfaceEnabled } from "@/app/config/launchScope"',
    );
    expect(createPage).toContain("function getLaunchEligibleVerticals");
    expect(createPage).toContain("isLaunchSurfaceEnabled(vertical.key)");
    expect(createPage).toContain("getLaunchEligibleVerticals(category)");
    expect(createPage).toContain("getLaunchEligibleVerticals(selectedCategory)");
  });

  it("certifies Business through the generic Business flow instead of Education", () => {
    for (const source of [businessLifecycle, businessCreateForm]) {
      expect(source).toContain('page.goto("/central/empresas/nova"');
      expect(source).not.toContain("/central/empresas/nova/educacao");
    }

    expect(businessLifecycle).not.toContain(
      "/educacao/setup",
    );
    expect(businessLifecycle).toContain(
      'page.getByRole("heading", { name: /^Criar empresa$/i })',
    );
  });
});
