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
    const activeLazy = read("src/app/routes/activeLazyImports.ts");

    expect(readme).toContain("HARDENING — NOT MVP CERTIFIED");
    expect(readme).not.toContain("✅ Production Ready");
    expect(readme).not.toContain("234/234");
    expect(activeLazy).not.toContain("EducationExplorerPage");
    expect(activeLazy).not.toContain("EducationDetailPage");
    expect(exists("src/modules/business/education/pages/EducationExplorerPage.tsx")).toBe(true);
    expect(exists("src/modules/business/education/pages/EducationDetailPage.tsx")).toBe(true);
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

  it("keeps private Education owners preserved outside the active Central graph", () => {
    const activeLazy = read("src/app/routes/activeLazyImports.ts");
    const activeCentralLazy = read("src/app/routes/activeCentralLazyImports.ts");
    const centralRoutes = read("src/app/routes/sections/CentralRoutes.tsx");

    expect(activeLazy).not.toContain("EducationExplorerPage");
    expect(activeLazy).not.toContain("EducationDetailPage");

    const privatePages = [
      ["EducationDashboardPage", "src/modules/business/education/pages/EducationDashboardPage.tsx"],
      ["EducationSetupPage", "src/modules/business/education/pages/EducationSetupPage.tsx"],
      ["EducationLeadsPage", "src/modules/business/education/pages/EducationLeadsPage.tsx"],
      ["EducationEventsPage", "src/modules/business/education/pages/EducationEventsPage.tsx"],
      ["EducationProgramsPage", "src/modules/business/education/pages/EducationProgramsPage.tsx"],
      ["EducationAnalyticsPage", "src/modules/business/education/pages/EducationAnalyticsPage.tsx"],
      ["EducationPlansPage", "src/modules/business/education/pages/EducationPlansPage.tsx"],
    ] as const;

    for (const [privatePage, ownerPath] of privatePages) {
      expect(activeCentralLazy).not.toContain(privatePage);
      expect(exists(ownerPath)).toBe(true);
    }

    expect(centralRoutes).toContain('from "../activeCentralLazyImports"');
    expect(centralRoutes).not.toContain("Education");
    expect(centralRoutes).not.toContain("launchElement");
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

    expect(subscription).toContain("CatalogService.getPublishedPlanEntitlements");
    expect(subscription).toContain("EntitlementsService.getAll");
    expect(subscription).not.toContain("maxPrograms");
    expect(subscription).not.toContain("maxLeadsPerMonth");
    expect(subscription).not.toContain("maxEvents");
    expect(subscriptionHook).not.toContain("calculateLimits");
    expect(subscriptionHook).toContain("const planTier = status?.planTier;");
    expect(subscriptionHook).toContain("planType: status?.planType");
    expect(subscriptionHook).toContain("isActive: status?.isActive");
    expect(subscriptionHook).not.toContain("status?.planTier ?? PlanTier.FREE");
    expect(subscriptionHook).not.toContain("status?.planType ?? 'free'");

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

  it("keeps public Education lead collection privacy-minimized in the UI", () => {
    const form = read(
      "src/modules/business/education/components/EducationLeadForm.tsx",
    );

    expect(form).toContain("Não informe CPF");
    expect(form).toContain("dados sensíveis do aluno");
    expect(form).toContain("Este formulário registra interesse e não conclui matrícula");
    expect(form).toContain("Primeiro nome do aluno (opcional)");
    expect(form).toContain("grid grid-cols-1 gap-3 sm:grid-cols-2");
    expect(form).toContain('maxLength={1000}');
    expect(form).toContain("useReducedMotion");
    expect(form).toContain("onlyDigits(formData.phone)");
    expect(form).toContain("phoneDigits.length < 10 || phoneDigits.length > 15");
    expect(form).toContain("EDUCATION_PROGRAM_SHIFT_OPTIONS");
    expect(form).toContain("Este envio não confirma matrícula, vaga ou prazo de resposta.");
  });

  it("keeps Education administrative motion accessible", () => {
    const leads = read(
      "src/modules/business/education/pages/EducationLeadsPage.tsx",
    );
    const plans = read(
      "src/modules/business/education/pages/EducationPlansPage.tsx",
    );
    const setupControls = read(
      "src/modules/business/education/pages/EducationSetupControls.tsx",
    );

    for (const source of [leads, plans, setupControls]) {
      expect(source).toContain("useReducedMotion");
      expect(source).toContain("prefersReducedMotion");
    }
  });

  it("counts only newly created public Education leads", () => {
    const detail = read(
      "src/modules/business/education/pages/EducationDetailPage.tsx",
    );

    expect(detail).toContain("if (lead.created)");
    expect(detail).not.toContain("if (lead) {\n      trackLeadSubmitted");
  });

  it("keeps the Education dashboard truthful before and after setup", () => {
    const dashboard = read(
      "src/modules/business/education/pages/EducationDashboardPage.tsx",
    );

    expect(dashboard).toContain("EducationStatusBadge");
    expect(dashboard).toContain("profile || item.key === 'setup'");
    expect(dashboard).toContain("'Não informado'");
    expect(dashboard).toContain("formatInfrastructureCount");
    expect(dashboard).toContain("useReducedMotion");
    expect(dashboard).not.toContain("{profile.status}");
    expect(dashboard).not.toContain("profile.institution_type ??");
  });

  it("keeps Education lead loss explicit, privacy-minimized, and paginated", () => {
    const leadsPage = read(
      "src/modules/business/education/pages/EducationLeadsPage.tsx",
    );
    const pipeline = read(
      "src/modules/business/education/components/EducationPipelineView.tsx",
    );
    const lostDialog = read(
      "src/modules/business/education/components/EducationLeadLostDialog.tsx",
    );
    const leadsHook = read(
      "src/modules/business/education/hooks/useEducationLeads.ts",
    );

    expect(pipeline).toContain("EducationLeadLostDialog");
    expect(pipeline).toContain("setLostLead(lead)");
    expect(pipeline).toContain("'lost', reason");
    expect(leadsPage).toContain("lostReason?: string");
    expect(leadsPage).toContain("await moveLead({ leadId, toStatus, lostReason })");
    expect(lostDialog).toContain("Motivo operacional *");
    expect(lostDialog).toContain("Não inclua CPF");
    expect(lostDialog).toContain("EDUCATION_LEAD_LOST_REASON_MAX_LENGTH");
    expect(lostDialog).toContain("getEducationLeadLostReasonValidationError");
    expect(leadsHook).toContain(
      "queryKey: ['education', 'leads', profileId, status, page, pageSize]",
    );
    expect(leadsPage).toContain("Página {page} de {totalPages}");
    expect(leadsPage).toContain("As contagens por etapa consideram todo o pipeline.");
  });

  it("keeps Education admin empty states distinct from missing profile setup", () => {
    const programs = read(
      "src/modules/business/education/pages/EducationProgramsPage.tsx",
    );
    const events = read(
      "src/modules/business/education/pages/EducationEventsPage.tsx",
    );
    const leads = read(
      "src/modules/business/education/pages/EducationLeadsPage.tsx",
    );
    const analytics = read(
      "src/modules/business/education/pages/EducationAnalyticsPage.tsx",
    );

    for (const source of [programs, events, leads, analytics]) {
      expect(source).toContain("EducationProfileRequiredState");
    }

    expect(programs).toContain("getEducationProgramNameValidationError");
    expect(programs).toContain("getEducationProgramNumericValidationError");
    expect(programs).toContain("availableSlots: null as number | null");
    expect(programs).toContain("priceFrom: null as number | null");
    expect(programs).toContain("program.price_from === 0");
    expect(programs).toContain("max-h-[90vh]");
    expect(programs).toContain("useReducedMotion");
    expect(programs).toContain("enabled: Boolean(profile?.id)");
    expect(events).toContain("enabled: Boolean(profile?.id)");
    expect(events).toContain("max-h-[90vh]");
    expect(events).toContain("useReducedMotion");
    expect(events).toContain("SCHOOL_EVENT_TYPE_LABELS");
    expect(events).toContain("SCHOOL_EVENT_TYPE_OPTIONS");
    expect(events).not.toContain("const SCHOOL_EVENT_TYPE_LABELS:");
    expect(events).not.toContain("const SCHOOL_EVENT_TYPE_OPTIONS:");

    const pipeline = read(
      "src/modules/business/education/components/EducationPipelineView.tsx",
    );
    expect(pipeline).toContain("disabled={isMoving}");
    expect(pipeline).toContain("useReducedMotion");
    expect(leads).toContain("isMoving={isMoving}");
    expect(leads).toContain("Não foi possível atualizar o lead");
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
    expect(page).toContain("enrollmentOpen: profile?.enrollment_open ?? null");

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
    expect(analyticsHook).toContain("profile?.enrollment_open ?? null");
    expect(analyticsHook).not.toContain("profile?.enrollment_open ?? false");
    expect(analyticsHook).toContain("enrollmentWindowOpen: enrollmentOpen");
    expect(analyticsHook).not.toContain("getEducationProfileById(profileId)");
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
    expect(conversionCard).toContain("Sem contatos medidos");
    expect(conversionCard).toContain("Distribuição do pipeline");
    expect(conversionCard).toContain("motion-safe:animate-pulse");
    expect(conversionCard).not.toContain("avgDaysToConversion");

    const queries = read(
      "src/core/education/services/education.queries.ts",
    );
    expect(queries).toContain("analyticsQueryError");
    expect(queries).toContain(": null;");
    expect(queries).not.toContain("firstContactDays.length > 0\n      ? Math.round(\n          firstContactDays.reduce((sum, days) => sum + days, 0) /\n            firstContactDays.length,\n        )\n      : 0;");
    expect(queries).not.toContain("getProfileViewMetrics");
    expect(queries).not.toContain("getConversionFunnel");
    expect(queries).not.toContain("getProgramViewMetrics");
    expect(queries).not.toContain("getEventMetrics");
  });

  it("keeps Education setup validation owned by core and submitted through one form path", () => {
    const setupPage = read(
      "src/modules/business/education/pages/EducationSetupPage.tsx",
    );
    const setupControls = read(
      "src/modules/business/education/pages/EducationSetupControls.tsx",
    );
    const profileValidation = read(
      "src/core/education/profileValidation.ts",
    );
    const mutations = read(
      "src/core/education/services/education.mutations.ts",
    );

    expect(setupPage).toContain("getEducationProfileSetupValidationErrors");
    expect(setupPage).toContain("formData.schoolInepCode.trim()");
    expect(setupControls).toContain('type="submit"');
    expect(setupControls).not.toContain("onSave: () => void");
    expect(profileValidation).toContain("EDUCATION_PROFILE_MAX_AGE");
    expect(profileValidation).toContain("O código INEP deve conter exatamente 8 dígitos.");
    expect(profileValidation).toContain("A fonte pública deve ser uma URL http ou https válida.");
    expect(mutations).toContain("getEducationProfileSetupValidationErrors");
    expect(mutations).toContain("payload.school_inep_code?.trim() || null");
    expect(mutations).toContain("payload.school_source_url?.trim() || null");
    expect(mutations).toContain("payload.whatsapp_number != null");
    expect(mutations).toContain("payload.summary != null");
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
