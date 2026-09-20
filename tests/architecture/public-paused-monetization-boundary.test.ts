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

  it("does not retain a hidden premium write path while Billing is paused", () => {
    expect(jobsPublishPage).not.toContain("setDestaque");
    expect(jobsPublishPage).not.toContain("destaque,");
    expect(jobsPublishWorkflow).not.toContain("form.destaque");
    expect(jobsPublishWorkflow).not.toContain('highlightType = "premium"');
    expect(jobsPublishWorkflow).toContain(
      'const highlightType: VagaHighlightType = form.urgente ? "featured" : "none";',
    );
  });


  it("gates public pricing, checkout and subscription management at the router", () => {
    expect(appLayoutRoutes).toContain('path="/planos"');
    expect(appLayoutRoutes).toContain('path="/checkout/success"');
    expect(appLayoutRoutes).toContain('path="/checkout/cancel"');
    expect(appLayoutRoutes).toContain('path="/settings/subscription"');
    expect(appLayoutRoutes.match(/launchElement\(\s*"billing"/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
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

  it("turns paused gastronomy upsells into factual entitlement states", () => {
    expect(gastronomyUpgradePrompt).toContain(
      "const showBilling = isLaunchSurfaceEnabled('billing')",
    );
    expect(gastronomyUpgradePrompt).toContain("if (!showBilling)");
    expect(gastronomyUpgradePrompt).toContain(
      "Recurso não habilitado para esta empresa no lançamento atual.",
    );
    expect(gastronomyPlanStatus).toContain(
      "const showUpgradeCTA = showBilling && !isDelivery",
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

  it("does not restore unsupported conversion claims", () => {
    expect(jobsSalaryStep).not.toContain("3x mais candidaturas");
    expect(jobsSalaryStep).toContain(
      "Informar a faixa salarial ajuda candidatos a avaliar a oportunidade",
    );
  });
});
