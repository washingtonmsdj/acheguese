import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const centralRoutes = read("src/app/routes/sections/CentralRoutes.tsx");
const verticalScope = read("src/app/config/businessVerticalScope.ts");
const createPage = read("src/modules/business/pages/CriarEmpresaPage.tsx");
const businessLifecycle = read("tests/e2e/business-lifecycle-authenticated.spec.ts");
const businessCreateForm = read("tests/e2e/business-create-form.spec.ts");

describe("MVP Business create vertical launch boundary", () => {
  it("keeps generic Business creation active and contextual vertical routes out of the active Central graph", () => {
    expect(centralRoutes).toContain('isProductModuleEnabled("business")');
    expect(centralRoutes).toContain('path="empresas/nova"');
    expect(centralRoutes).toContain("getActiveBusinessVerticalKeys()");
    expect(centralRoutes).toContain(
      "enabledVerticalKeys={activeBusinessVerticalKeys}",
    );
    expect(centralRoutes).not.toContain('path="empresas/nova/:verticalSlug"');
    expect(centralRoutes).not.toContain("VERTICAL_CONFIGS");
    expect(centralRoutes).not.toContain("vertical.createSlugs.map");
    expect(centralRoutes).not.toContain("launchElement");
  });

  it("composes vertical lifecycle at app boundary without leaking launch config into Business", () => {
    expect(verticalScope).toContain("VERTICAL_KEYS.filter");
    expect(verticalScope).toContain("isProductModuleEnabled(vertical)");

    expect(createPage).not.toContain("@/app/config/launchScope");
    expect(createPage).not.toContain("isLaunchSurfaceEnabled");
    expect(createPage).toContain("enabledVerticalKeys?: readonly VerticalKey[]");
    expect(createPage).toContain("enabledVerticalKeySet.has(vertical.key)");
    expect(createPage).toContain(
      "getEnabledVerticals(category, enabledVerticalKeySet)",
    );
    expect(createPage).toContain(
      "getEnabledVerticals(selectedCategory, enabledVerticalKeySet)",
    );
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
