import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public paused monetization boundary", () => {
  const launchScope = readFileSync("src/app/config/launchScope.ts", "utf8");
  const jobsSalaryStep = readFileSync(
    "src/modules/classifieds/jobs/pages/steps/SalaryStep.tsx",
    "utf8",
  );
  const classifiedsVisibility = readFileSync(
    "src/modules/classifieds/pages/NovoClassificadoPageSections.tsx",
    "utf8",
  );
  const jobsPublishPage = readFileSync(
    "src/modules/classifieds/jobs/pages/PublicarVagaPage.tsx",
    "utf8",
  );
  const jobsPublishWorkflow = readFileSync(
    "src/modules/classifieds/jobs/services/VagasPublishWorkflowService.ts",
    "utf8",
  );
  const businessShell = readFileSync(
    "src/modules/business/dashboard/pages/BusinessDashboardShellPage.tsx",
    "utf8",
  );
  const businessOverview = readFileSync(
    "src/modules/business/dashboard/pages/BusinessOverviewPage.tsx",
    "utf8",
  );
  const businessHub = readFileSync(
    "src/core/profiles/components/hub/BusinessModulesSection.tsx",
    "utf8",
  );
  const premiumSite = readFileSync(
    "src/modules/business/dashboard/pages/BusinessPremiumSitePage.tsx",
    "utf8",
  );
  const premiumPublicResolver = readFileSync(
    "src/core/business/services/PremiumBusinessSiteResolver.ts",
    "utf8",
  );
  const premiumPublicRoute = readFileSync(
    "src/modules/business/premium/pages/PremiumBusinessSiteRoute.tsx",
    "utf8",
  );
  const appRoutes = readFileSync(
    "src/app/routes/AppRoutes.tsx",
    "utf8",
  );
  const gastronomyDashboard = readFileSync(
    "src/modules/business/gastronomy/pages/GastronomyDashboardPage.tsx",
    "utf8",
  );
  const gastronomyPlanStatus = readFileSync(
    "src/modules/business/gastronomy/components/PlanStatusWidget.tsx",
    "utf8",
  );
  const gastronomyUpgradePrompt = readFileSync(
    "src/modules/business/gastronomy/components/UpgradePrompt.tsx",
    "utf8",
  );
  const menuManagement = readFileSync(
    "src/modules/business/gastronomy/pages/MenuManagementPage.tsx",
    "utf8",
  );
  const appLayoutRoutes = readFileSync(
    "src/app/routes/sections/AppLayoutRoutes.tsx",
    "utf8",
  );
  const appTopbar = readFileSync(
    "src/app/components/navigation/AppTopbar.tsx",
    "utf8",
  );
  const centralHeader = readFileSync(
    "src/modules/central/components/CentralHeader.tsx",
    "utf8",
  );
  const gastronomyDetail = readFileSync(
    "src/modules/business/gastronomy/pages/GastronomyDetailPage.tsx",
    "utf8",
  );
  const premiumBusinessMenu = readFileSync(
    "src/modules/business/premium/pages/PremiumBusinessMenuPage.tsx",
    "utf8",
  );
  const premiumGastronomyDetail = readFileSync(
    "src/modules/business/gastronomy/pages/GastronomyPremiumDetailPage.tsx",
    "utf8",
  );
  const gastronomyMenuHook = readFileSync(
    "src/modules/business/gastronomy/hooks/useMenu.ts",
    "utf8",
  );
  const classifiedsPage = readFileSync(
    "src/modules/classifieds/pages/ClassificadosPage.tsx",
    "utf8",
  );
  const classifiedsSections = readFileSync(
    "src/modules/classifieds/sections/index.ts",
    "utf8",
  );
  const classifiedsCards = readFileSync(
    "src/modules/classifieds/components/cards/index.ts",
    "utf8",
  );
  const classifiedsHorizontalSection = readFileSync(
    "src/modules/classifieds/components/sections/HorizontalSection.tsx",
    "utf8",
  );
  const classifiedsListingSection = readFileSync(
    "src/modules/classifieds/sections/ClassifiedsListagemSection.tsx",
    "utf8",
  );

  it("keeps Billing outside the MVP launch scope", () => {
    expect(launchScope).toContain("billing: false");
  });

  it("does not advertise paused premium placement in public publish flows", () => {
    expect(jobsSalaryStep).not.toContain("Destaque Premium");
    expect(jobsSalaryStep).not.toContain("topo dos resultados por 7 dias");
    expect(classifiedsVisibility).not.toContain("Destaque Premium");
    expect(classifiedsVisibility).not.toContain(
      "Destaque seu anúncio no topo dos resultados",
    );
  });

  it("does not fabricate sponsored or premium classifieds while Billing is paused", () => {
    expect(classifiedsPage).not.toContain("ClassifiedsSponsoredSection");
    expect(classifiedsPage).not.toContain("ClassifiedsFeaturedSection");
    expect(classifiedsPage).not.toContain("featuredAds");
    expect(classifiedsPage).not.toContain("maior tração");
    expect(classifiedsPage).not.toContain("Mais procurados");
    expect(classifiedsPage).toContain("recentAds");
    expect(classifiedsPage).toContain("categorySampleAds");
    expect(classifiedsSections).not.toContain("ClassifiedsSponsoredSection");
    expect(classifiedsSections).not.toContain("ClassifiedsFeaturedSection");
    expect(classifiedsCards).not.toContain("SponsoredCard");
  });

  it("keeps classifieds collection navigation functional without a fake CTA", () => {
    expect(classifiedsHorizontalSection).toContain('href="#classificados-listagem"');
    expect(classifiedsHorizontalSection).not.toContain("<button className=");
    expect(classifiedsListingSection).toContain('id="classificados-listagem"');
  });

  it("does not retain a hidden premium write path while Billing is paused", () => {
    expect(jobsPublishPage).not.toContain("setDestaque");
    expect(jobsPublishPage).not.toContain("destaque,");
    expect(jobsPublishWorkflow).not.toContain("form.destaque");
    expect(jobsPublishWorkflow).not.toContain('highlightType = "premium"');
    expect(jobsPublishWorkflow).toContain(
      'const highlightType: VagaHighlightType = form.urgente ? "featured" : "none";',
    );
  });


  it("keeps paused Billing purchase routes out of the active public router", () => {
    expect(appLayoutRoutes).not.toContain('path="/planos"');
    expect(appLayoutRoutes).not.toContain('path="/checkout/success"');
    expect(appLayoutRoutes).not.toContain('path="/checkout/cancel"');
    expect(appLayoutRoutes).not.toContain('path="/settings/subscription"');
    expect(appLayoutRoutes).not.toContain('launchElement("billing"');
    expect(appLayoutRoutes).not.toContain("LaunchPausedPage");
  });

  it("keeps authenticated plan and upgrade entry points behind Billing launch scope", () => {
    expect(businessShell).toContain(
      'const showBilling = isLaunchSurfaceEnabled("billing")',
    );
    expect(businessShell).toContain("...(showBilling");
    expect(businessShell).toContain("{showBilling && (");
    expect(businessOverview).toContain(
      'const showBilling = isLaunchSurfaceEnabled("billing")',
    );
    expect(businessOverview).toContain("{showBilling && (");
    expect(businessHub).toContain(
      'const showBilling = isLaunchSurfaceEnabled("billing")',
    );
    expect(businessHub).toContain("{showBilling ? (");
    expect(appTopbar).toContain(
      'const showBilling = isLaunchSurfaceEnabled("billing")',
    );
    expect(appTopbar).toContain("{showBilling ? (");
    expect(centralHeader).toContain(
      'const showBilling = isLaunchSurfaceEnabled("billing")',
    );
    expect(centralHeader).toContain("{showBilling ? (");
  });

  it("preserves already-granted premium capabilities without exposing a purchase path", () => {
    expect(businessShell).toContain(
      'const showPremiumManagement = showBilling || Boolean(premiumUrl)',
    );
    expect(businessOverview).toContain(
      'const showPremiumManagement = showBilling || Boolean(premiumUrl)',
    );
    expect(premiumSite).toContain("if (!isPremiumEnabled && !showBilling)");
    expect(premiumSite).toContain(
      "Este recurso não está habilitado para esta empresa no lançamento atual.",
    );
    expect(gastronomyDashboard).toContain("hasShortPremiumLink ? (");
    expect(gastronomyDashboard).toContain(
      "QR Code personalizado não está habilitado para esta empresa no lançamento atual.",
    );
  });

  it("keeps premium public-site code preserved but outside the MVP route tree", () => {
    expect(appRoutes).not.toContain('path="/p/:slug/*"');
    expect(appRoutes).not.toContain("PremiumBusinessSiteRoute");
    expect(premiumPublicRoute).toContain("PremiumBusinessSiteResolver.resolve");
    expect(premiumPublicResolver).toContain("if (!context?.is_premium)");
    expect(premiumPublicResolver).toContain("return null");
    expect(premiumPublicResolver).not.toContain("createCheckout");
    expect(premiumPublicResolver).not.toContain("upgrade");
    expect(premiumPublicResolver).not.toContain("subscription");
  });

  it("turns paused gastronomy upsells into factual entitlement states", () => {
    expect(gastronomyUpgradePrompt).toContain(
      "const showBilling = isLaunchSurfaceEnabled('billing')",
    );
    expect(gastronomyUpgradePrompt).toContain("if (!showBilling)");
    expect(gastronomyUpgradePrompt).toContain(
      "useBillingPlan(showBilling ? offer.planCode : '')",
    );
    expect(gastronomyUpgradePrompt).toContain(
      "Recurso não habilitado para esta empresa no lançamento atual.",
    );
    expect(gastronomyPlanStatus).toContain(
      "const showUpgradeCTA = showBilling && !isDelivery",
    );
    expect(gastronomyPlanStatus).toContain(
      "{showBilling ? 'Plano Atual' : 'Recursos habilitados'}",
    );
    expect(gastronomyPlanStatus).toContain("showBilling && isFree");
    expect(gastronomyPlanStatus).toContain("showBilling && isPro");
    expect(menuManagement).toContain(
      "const showBilling = isLaunchSurfaceEnabled('billing')",
    );
    expect(menuManagement).toContain(
      "itens habilitado para esta empresa.",
    );
  });

  it("keeps paused coupons and promotions out of active gastronomy surfaces", () => {
    expect(launchScope).toContain("coupons: false");
    expect(gastronomyDetail).toContain(
      'const showCoupons = isLaunchSurfaceEnabled("coupons")',
    );
    expect(gastronomyDetail).toContain(
      "const promotions = showCoupons ? snapshot?.gastronomy.promotions ?? [] : [];",
    );
    expect(premiumBusinessMenu).toContain(
      'const showCoupons = isLaunchSurfaceEnabled("coupons")',
    );
    expect(premiumBusinessMenu).toContain(
      "const promotions = showCoupons ? gastronomySnapshot?.gastronomy.promotions ?? [] : [];",
    );
    expect(premiumGastronomyDetail).toContain(
      "const showCoupons = isLaunchSurfaceEnabled('coupons')",
    );
    expect(premiumGastronomyDetail).toContain(
      "useActivePromotions(\n    business?.business_data_id,\n    showCoupons,",
    );
    expect(gastronomyMenuHook).toContain("enabled: enabled && !!businessId");
    expect(premiumGastronomyDetail).not.toContain("premium-coupon-code");
    expect(premiumGastronomyDetail).not.toContain("couponCode");
    expect(premiumGastronomyDetail).not.toContain('aria-label="Cupom"');
  });

  it("does not restore unsupported conversion claims", () => {
    expect(jobsSalaryStep).not.toContain("3x mais candidaturas");
    expect(jobsSalaryStep).toContain(
      "Informar a faixa salarial ajuda candidatos a avaliar a oportunidade",
    );
  });
});
