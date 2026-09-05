import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");
const exists = (path: string) => existsSync(resolve(repoRoot, path));

const RETIRED_EDUCATION_BRIDGES = [
  "src/modules/business/education/types/index.ts",
  "src/modules/business/education/services/education.queries.ts",
  "src/modules/business/education/services/education.mutations.ts",
  "src/modules/business/education/constants/schoolStageOptions.ts",
  "src/modules/business/education/services/EducationTrackingService.ts",
  "src/modules/business/education/services/EducationObservabilityService.ts",
  "src/modules/business/education/services/EducationLimitValidationService.ts",
  "src/modules/business/education/hooks/useEducationLimits.ts",
] as const;

const RETIRED_EDUCATION_PRESENTATION_COMPONENTS = [
  "src/modules/business/education/components/EducationCard.tsx",
  "src/modules/business/education/components/EducationProgramsSection.tsx",
  "src/modules/business/education/components/EducationContactSidebar.tsx",
] as const;

describe("Education module hardening ratchet", () => {
  it("does not advertise Education as production-ready while public routes are paused", () => {
    const readme = read("src/modules/business/education/README.md");
    const lazyImports = read("src/app/routes/lazyImports.ts");

    expect(readme).toContain("HARDENING — NOT MVP CERTIFIED");
    expect(readme).not.toContain("✅ Production Ready");
    expect(readme).not.toContain("234/234");
    expect(lazyImports).toContain(
      'EducationExplorerPage = createLaunchPausedRoute("Educacao")',
    );
  });

  it("keeps funnel persistence exclusive to EducationTrackingService", () => {
    const observability = read(
      "src/core/education/services/EducationObservabilityService.ts",
    );
    const tracking = read(
      "src/core/education/services/EducationTrackingService.ts",
    );

    expect(observability).not.toContain("@/integrations/supabase");
    expect(observability).not.toContain("education_analytics_events");
    expect(tracking).toContain("@/integrations/supabase");
    expect(tracking).toContain("@/core/education/contracts");
    expect(tracking).toContain(".from('education_analytics_events')");
    expect(tracking).not.toContain("@/modules/business/education");
  });

  it("keeps private Education routes owned by centralLazyImports only", () => {
    const lazyImports = read("src/app/routes/lazyImports.ts");
    const centralLazyImports = read("src/app/routes/centralLazyImports.ts");
    const centralRoutes = read("src/app/routes/sections/CentralRoutes.tsx");

    expect(lazyImports).toContain(
      'export const EducationExplorerPage = createLaunchPausedRoute("Educacao")',
    );
    expect(lazyImports).toContain(
      'export const EducationDetailPage = createLaunchPausedRoute("Educacao")',
    );

    const privatePages = [
      "EducationDashboardPage",
      "EducationSetupPage",
      "EducationLeadsPage",
      "EducationEventsPage",
      "EducationProgramsPage",
      "EducationAnalyticsPage",
      "EducationPlansPage",
    ] as const;

    for (const privatePage of privatePages) {
      expect(lazyImports).not.toContain(`export const ${privatePage}`);
      expect(centralLazyImports).toContain(`export const ${privatePage} = lazy`);
      expect(centralLazyImports).not.toContain(
        `${privatePage} = createLaunchPausedRoute`,
      );
    }

    expect(centralRoutes).toContain('import * as P from "../centralLazyImports"');
    expect(centralRoutes).not.toMatch(
      /path="educacao[^"]*"[^\n]*launchElement\("education"/,
    );

    const dashboardShell = read(
      "src/modules/business/dashboard/pages/BusinessDashboardShellPage.tsx",
    );
    expect(dashboardShell).toContain(
      'isEligibleForVertical(\n    business.category,\n    "education",\n  )',
    );
    expect(dashboardShell).not.toContain(
      'isLaunchSurfaceEnabled("education") && isEligibleForVertical',
    );
  });

  it("keeps Education billing offer and operational limits on separate SSOTs", () => {
    const subscription = read(
      "src/modules/business/education/services/education-subscription.service.ts",
    );
    const subscriptionHook = read(
      "src/modules/business/education/hooks/useEducationSubscription.ts",
    );
    const nicheRegistry = read(
      "src/modules/business/education/niches/registry.ts",
    );
    const plansPage = read(
      "src/modules/business/education/pages/EducationPlansPage.tsx",
    );
    const nicheBillingHook = read(
      "src/modules/business/education/niches/hooks/useEducationNicheBilling.ts",
    );

    expect(subscription).toContain("BillingPlanService.getEntitlements");
    expect(subscription).toContain("EntitlementsService.getAll");
    expect(subscription).not.toContain("maxPrograms");
    expect(subscription).not.toContain("maxLeadsPerMonth");
    expect(subscription).not.toContain("maxEvents");
    expect(subscriptionHook).not.toContain("calculateLimits");

    expect(nicheRegistry).toContain("maxPrograms");
    expect(nicheRegistry).toContain("maxLeadsPerMonth");
    expect(nicheRegistry).toContain("maxEvents");

    expect(plansPage).toContain("useBillingPlans");
    expect(plansPage).toContain("plan.features.map");
    expect(plansPage).not.toContain("EDUCATION_PLAN_TEMPLATES");
    expect(plansPage).not.toMatch(/maxPrograms:\s*\d+/);

    expect(nicheBillingHook).not.toMatch(/current:\s*0/);
    expect(nicheBillingHook).not.toContain("Limites base (sem uso)");
  });

  it("keeps public Education lead capture truthful and actionable", () => {
    const form = read(
      "src/modules/business/education/components/EducationLeadForm.tsx",
    );
    const sidebar = read(
      "src/modules/business/education/pages/EducationDetailSidebar.tsx",
    );

    expect(form).toContain("onSubmit: (data: LeadFormData) => Promise<void> | void");
    expect(form).toContain('id="education-lead-form"');
    expect(form).toContain('role="alert"');
    expect(form).not.toContain("onLeadCreated");
    expect(form).not.toContain("educationProfileId");
    expect(form).not.toContain("onSubmit?.");

    expect(sidebar).toContain("focusLeadForm");
    expect(sidebar).toContain("Solicitar visita");
    expect(sidebar).toContain("Solicitar informacoes");
    expect(sidebar).not.toContain("Agendar visita");
    expect(sidebar).not.toContain("Solicitar orçamento");
  });

  it("keeps Education analytics on the real profile and real export contract", () => {
    const page = read(
      "src/modules/business/education/pages/EducationAnalyticsPage.tsx",
    );
    const exportService = read(
      "src/core/education/services/educationAnalyticsExport.ts",
    );

    expect(page).toContain("profileId: profile?.id");
    expect(page).toContain("nicheKey: profile?.niche_key");

    const analyticsHook = read(
      "src/modules/business/education/hooks/useEducationAnalytics.ts",
    );
    expect(analyticsHook).not.toContain("period?: '7d'");
    expect(analyticsHook).not.toContain("period = '30d'");
    expect(analyticsHook).toContain("throw error;");
    expect(analyticsHook).toContain("getLeadPipelineMetrics");
    expect(analyticsHook).not.toContain("getProfileViewMetrics");
    expect(analyticsHook).not.toContain("getConversionFunnel");
    expect(analyticsHook).not.toContain("guardianVsStudentRatio");
    expect(analyticsHook).not.toContain("avgDaysToConversion");
    expect(page).toContain("canExportAnalytics = canExport && nicheAllowsExport");
    expect(page).toContain("buildEducationAnalyticsCsv(data)");
    expect(page).toContain("onClick={handleExport}");
    expect(page).not.toMatch(/<Button[^>]*>\s*Exportar Relat[oó]rio\s*<\/Button>/);

    expect(exportService).toContain("buildEducationAnalyticsCsv");
    expect(exportService).toContain("formulaSafe");
    expect(exportService).not.toContain("@/integrations/");
    expect(exportService).not.toContain("totalAttendees");
    expect(exportService).not.toContain("avgViews");
    expect(exportService).not.toContain("avgInquiries");

    const conversionCard = read(
      "src/modules/business/education/components/analytics/EducationAnalyticsConversionCard.tsx",
    );
    expect(conversionCard).toContain("avgDaysToFirstContact");
    expect(conversionCard).toContain("dias ate o 1º contato");
    expect(conversionCard).not.toContain("avgDaysToConversion");

    const queries = read(
      "src/core/education/services/education.queries.ts",
    );
    expect(queries).toContain("analyticsQueryError");
    expect(queries).not.toContain("getProfileViewMetrics");
    expect(queries).not.toContain("getConversionFunnel");
    expect(queries).not.toContain("getProgramViewMetrics");
    expect(queries).not.toContain("getEventMetrics");
  });

  it("keeps Education domain contracts owned by core", () => {
    const contracts = read("src/core/education/contracts.ts");

    expect(contracts).toContain("export type EducationNicheKey");
    expect(contracts).toContain("export interface EducationProfile");
    expect(contracts).toContain("export type EducationAnalyticsEventType");
  });

  it("keeps the remote Education authorization probe rollback-only and admin-safe", () => {
    const probe = read(
      "tests/security/education-management-authority-remote-probe.sql",
    );

    expect(probe).toContain("BEGIN;");
    expect(probe).toContain("ROLLBACK;");
    expect(probe).toContain("SET LOCAL ROLE authenticated");
    expect(probe).toContain("private.can_operate_business_profile");
    expect(probe).toContain("g6_education_probe_non_owner_helper_allowed");
    expect(probe).toContain("g6_education_probe_admin_membership_not_authorized");
    expect(probe).toContain("education_leads");
    expect(probe).toContain("education_events");
    expect(probe).toContain("education_lead_events");
    expect(probe).toContain("washingtonmsdj");
    expect(probe).toContain("'transaction', 'rollback'");
    expect(probe).not.toMatch(/\bCOMMIT\b/i);
  });

  it("keeps callerless Education presentation duplicates retired", () => {
    const componentsBarrel = read(
      "src/modules/business/education/components/index.ts",
    );

    for (const path of RETIRED_EDUCATION_PRESENTATION_COMPONENTS) {
      expect(exists(path), path).toBe(false);
    }

    expect(componentsBarrel).not.toContain("EducationCard");
    expect(componentsBarrel).not.toContain("EducationProgramsSection");
    expect(componentsBarrel).not.toContain("EducationContactSidebar");
  });

  it("retires all Education core bridges and blocks their recreation", () => {
    const validator = read("tools/architecture/validate-education-module-boundaries.ts");

    for (const path of RETIRED_EDUCATION_BRIDGES) {
      expect(exists(path), path).toBe(false);
      expect(validator).toContain(path);
    }

    expect(validator).toContain("RETIRED_CORE_BRIDGES");
    expect(validator).not.toContain("REQUIRED_CORE_BRIDGES");
    expect(validator).not.toContain("ALLOWED_DIRECT_INTEGRATION_FILES");
    expect(validator).toContain("direct integrations access is forbidden");
    expect(validator).toContain(
      "retired compatibility bridge must not be recreated",
    );
  });
});
