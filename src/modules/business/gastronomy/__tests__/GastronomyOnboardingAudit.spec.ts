import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("gastronomy onboarding hardening", () => {
  it("guarantees menu and base category bootstrap during setup save", () => {
    const profileService = read(
      "src/core/business/services/GastronomyProfileService.ts",
    );
    const menuQueries = read(
      "src/core/business/services/menu.queries.ts",
    );
    const runtimeQueries = read(
      "src/modules/business/gastronomy/services/gastronomy-runtime.queries.ts",
    );
    const pizzaAdminService = read(
      "src/modules/business/gastronomy/niches/pizzaria/PizzaAdminService.ts",
    );

    expect(profileService).toContain("ensureOperationalMenuSetup");
    expect(profileService).toContain("resolveGastronomyBusinessId");
    expect(profileService).toContain(".from('menus')");
    expect(profileService).toContain(".from('menu_categories')");
    expect(profileService).toContain("Cardapio principal");
    expect(profileService).toContain(
      "return /pizza|pizzaria/i.test(cuisineType) ? 'Pizzas' : 'Cardapio';",
    );
    expect(menuQueries).toContain("resolveGastronomyBusinessId");
    expect(runtimeQueries).toContain("resolveGastronomyBusinessId");
    expect(pizzaAdminService).toContain("resolveGastronomyBusinessId");
  });

  it("continues setup navigation after non-fatal bootstrap warnings", () => {
    const setupHook = read(
      "src/modules/business/gastronomy/hooks/useGastronomySetup.ts",
    );
    const setupPage = read(
      "src/modules/business/gastronomy/pages/GastronomySetupPage.tsx",
    );

    expect(setupHook).toContain("toast.warning(result.error);");
    expect(setupHook).toContain(
      "return Boolean(result.data) || !result.error;",
    );
    expect(setupPage).toContain("const saved = await save({");
    expect(setupPage).toContain("if (saved) {");
    expect(setupPage).toContain(
      "navigate(businessManagementRoutes.gastronomia(businessId!));",
    );
  });

  it("uses a fallback category when the plan hides category selection", () => {
    const menuService = read(
      "src/modules/business/gastronomy/services/MenuService.ts",
    );
    const menuPage = read(
      "src/modules/business/gastronomy/pages/MenuManagementPage.tsx",
    );
    const itemForm = read(
      "src/modules/business/gastronomy/components/menu/ItemForm.tsx",
    );

    expect(menuService).toContain("resolveFallbackCategoryId");
    expect(menuService).toContain(
      "if (!categoryId && !context!.entitlements.canUseMenuCategories)",
    );
    expect(menuService).toContain(
      "return { data: null, error: 'Selecione uma categoria para este item.' };",
    );
    expect(menuPage).toContain("await createItemAsync(normalizedValues);");
    expect(menuPage).toContain(
      "await updateItemAsync({ itemId: selectedItem.id, ...normalizedValues });",
    );
    expect(itemForm).toContain(
      "const shouldReset = await onSubmit(processedValues);",
    );
    expect(itemForm).toContain("if (shouldReset !== false) {");
    expect(itemForm).toContain("onClose();");
  });

  it("keeps menu management reachable even when advanced upsell is disabled", () => {
    const menuPage = read(
      "src/modules/business/gastronomy/pages/MenuManagementPage.tsx",
    );

    expect(menuPage).toContain("!entitlements.canUseAdvancedMenu && (");
    expect(menuPage).toContain("Recursos avançados de cardápio");
    expect(menuPage).not.toContain("if (!entitlements.canUseAdvancedMenu) {");
  });
  it("does not infer pizza builder only from the fallback category name", () => {
    const detailDrawer = read(
      "src/modules/business/gastronomy/components/MenuItemDetailDrawer.tsx",
    );

    expect(detailDrawer).toContain(
      'const matchesPizzaByText = /pizza/i.test(resolvedItem?.name ?? "");',
    );
    expect(detailDrawer).not.toContain(
      '/pizza/i.test(resolvedItem?.category?.name ?? "")',
    );
  });

  it("navigates to a valid public gastronomy checkout route from the sticky cart bar", () => {
    const stickyOrderBar = read(
      "src/modules/business/gastronomy/components/StickyOrderBar.tsx",
    );

    expect(stickyOrderBar).toContain(
      "GastronomyUrlService.getPublicDetailUrlFromTerritory",
    );
    expect(stickyOrderBar).toContain(")}/checkout`");
    expect(stickyOrderBar).not.toContain('navigate("checkout"');
  });

  it("keeps public gastronomy discovery links on the transactional gastronomy surface", () => {
    const gastronomyCard = read(
      "src/modules/business/gastronomy/components/GastronomyCard.tsx",
    );
    const foodItemCard = read(
      "src/modules/business/gastronomy/components/FoodItemCard.tsx",
    );
    const favoriteCard = read(
      "src/modules/business/gastronomy/components/FavoriteBusinessCard.tsx",
    );

    expect(gastronomyCard).toContain(
      "GastronomyUrlService.getPublicDetailUrlFromTerritory",
    );
    expect(foodItemCard).toContain(
      "GastronomyUrlService.getPublicDetailUrlFromTerritory",
    );
    expect(favoriteCard).toContain(
      "GastronomyUrlService.getPublicDetailUrlFromTerritory",
    );
    expect(gastronomyCard).not.toContain("useBusinessUrls");
    expect(foodItemCard).not.toContain("useBusinessUrls");
    expect(favoriteCard).not.toContain("useBusinessUrls");
  });

  it("surfaces a clear operational error when delivery_create_order is ambiguous in PostgREST", () => {
    const deliverySso = read(
      "src/core/mobility/delivery/services/OrderDeliverySSOTService.ts",
    );

    expect(deliverySso).toContain('code === "PGRST203"');
    expect(deliverySso).toContain("delivery_create_order");
    expect(deliverySso).toContain("Checkout indisponivel temporariamente.");
  });

  it("keeps cart and checkout success toasts away from bottom-fixed conversion CTAs", () => {
    const detailDrawer = read(
      "src/modules/business/gastronomy/components/MenuItemDetailDrawer.tsx",
    );
    const checkoutPage = read(
      "src/modules/business/gastronomy/pages/GastronomyCheckoutPage.tsx",
    );
    const checkoutSheet = read(
      "src/modules/business/gastronomy/components/GastronomyCheckoutSheet.tsx",
    );

    expect(detailDrawer).toContain('{ position: "top-center" }');
    expect(checkoutPage).toContain('position: "top-center"');
    expect(checkoutSheet).toContain('position: "top-center"');
  });
});
