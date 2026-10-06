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

  it("keeps Education subscription failures distinct from a real Free plan", () => {
    const subscriptionTest = read(
      "src/modules/business/education/services/__tests__/education-subscription.service.test.ts",
    );

    expect(subscriptionTest).toContain(
      "propagates subscription read failures instead of inventing a Free plan",
    );
    expect(subscriptionTest).toContain(
      "propagates catalog failures instead of replacing the canonical tier",
    );
    expect(subscriptionTest).toContain(
      "uses baseline entitlements for the same canonical tier",
    );
    expect(subscriptionTest).toContain(
      "reports Free only when the canonical Business subscription is actually Free",
    );
    expect(subscriptionTest).toContain(
      "expect(mocks.getAll).toHaveBeenCalledWith(PlanTier.PRO)",
    );
  });

  it("keeps Education analytics null and read-error semantics behaviorally tested", () => {
    const pipelineMetricsTest = read(
      "src/core/education/services/__tests__/educationLeadPipelineMetrics.test.ts",
    );
    const exportTest = read(
      "src/core/education/services/__tests__/educationAnalyticsExport.test.ts",
    );

    expect(pipelineMetricsTest).toContain(
      "returns null for average first-contact time when there is no valid sample",
    );
    expect(pipelineMetricsTest).toContain(
      "propagates analytics read failures instead of returning synthetic zeros",
    );
    expect(pipelineMetricsTest).toContain(
      "averages only valid non-negative first-contact samples",
    );

    expect(exportTest).toContain(
      "keeps a missing first-contact average empty instead of exporting zero",
    );
    expect(exportTest).toContain(
      "keeps an unmeasurable program occupancy rate empty",
    );
    expect(exportTest).toContain(
      "preserves an unknown enrollment window as an empty CSV value",
    );
    expect(exportTest).toContain(
      "neutralizes spreadsheet formulas in text dimensions",
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

    expect(subscription).toContain("CatalogService.getPublishedPlanEntitlements");
    expect(subscription).toContain("EntitlementsService.getAll");
    expect(subscription).not.toContain("maxPrograms");
    expect(subscription).not.toContain("maxLeadsPerMonth");
    expect(subscription).not.toContain("maxEvents");
    expect(subscription).not.toContain("planType");
    expect(subscription).not.toContain("resolvePlanType");
    expect(subscription).not.toContain("async canUsePremiumPublicPage(");
    expect(subscription).not.toContain("async canUseShortPremiumLink(");
    expect(subscription).not.toContain("async canUseAnalytics(");
    expect(subscription).not.toContain("async canExportData(");
    expect(subscriptionHook).not.toContain("calculateLimits");
    expect(subscriptionHook).toContain("const planTier = status?.planTier;");
    expect(subscriptionHook).toContain("isActive: status?.isActive");
    expect(subscriptionHook).not.toContain("planType");
    expect(subscriptionHook).not.toContain("status?.planTier ?? PlanTier.FREE");
    expect(subscriptionHook).not.toContain("status?.planType ?? 'free'");
    expect(subscriptionHook).not.toContain("const permissions =");
    expect(subscriptionHook).not.toContain("canUsePremiumSite:");
    expect(subscriptionHook).not.toContain("canUseShortLink:");
    expect(subscriptionHook).not.toContain("isPremium:");

    expect(nicheRegistry).toContain("maxPrograms");
    expect(nicheRegistry).toContain("maxLeadsPerMonth");
    expect(nicheRegistry).toContain("maxEvents");

    expect(plansPage).toContain("useBillingPlans");
    expect(plansPage).toContain("plan.features.map");
    expect(plansPage).not.toContain("EDUCATION_PLAN_TEMPLATES");
    expect(plansPage).not.toMatch(/maxPrograms:\s*\d+/);
    expect(plansPage).toContain("checkoutPlanCode");
    expect(plansPage).toContain("Abrindo checkout...");
    expect(plansPage).toContain("error: accessError");
    expect(plansPage).toContain("refetch: refetchAccess");
    expect(plansPage).toContain(
      "Não foi possível verificar sua permissão de cobrança",
    );
    expect(plansPage).toContain("Data de renovação não informada");
    expect(plansPage).toContain("Assinatura sem período ativo");
    expect(plansPage).not.toContain("Sem data de expiração");

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
    expect(form).toContain('maxLength={160}');
    expect(form).toContain('maxLength={254}');
    expect(form).toContain('maxLength={32}');
    expect(form).toContain("useReducedMotion");
    expect(form).toContain("onlyDigits(formData.phone)");
    expect(form).toContain("phoneDigits.length < 10 || phoneDigits.length > 15");
    expect(form).toContain("EDUCATION_PROGRAM_SHIFT_OPTIONS");
    expect(form).toContain("Este envio não confirma matrícula, vaga ou prazo de resposta.");
    expect(form).toContain('role="status"');
    expect(form).toContain('aria-live="polite"');
    expect(form).toContain("aria-busy={isLoading}");
    expect(form).toContain("if (submissionError) setSubmissionError(null)");
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

  it("keeps lost lead validation feedback accessible", () => {
    const dialog = read(
      "src/modules/business/education/components/EducationLeadLostDialog.tsx",
    );

    expect(dialog).toContain("hasTouchedReason");
    expect(dialog).toContain("aria-invalid={shouldShowValidationError}");
    expect(dialog).toContain("education-lost-reason-error");
    expect(dialog).toContain("aria-live=\"polite\"");
    expect(dialog).toContain("validationError");
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
    expect(pipeline).toContain("lead.student_name ?? lead.child_name");
    expect(pipeline).toContain("lead.student_age ?? lead.child_age");
    expect(pipeline).toContain("studentAge != null");
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

  it("keeps Education event schedule conflicts advisory and core-owned", () => {
    const events = read(
      "src/modules/business/education/pages/EducationEventsPage.tsx",
    );
    const validation = read("src/core/education/eventValidation.ts");

    expect(validation).toContain("areEducationEventTimesOverlapping");
    expect(events).toContain("areEducationEventTimesOverlapping");
    expect(events).toContain("const scheduleConflicts = useMemo");
    expect(events).toContain('role="status"');
    expect(events).toContain("O aviso é consultivo");
    expect(events).not.toContain("Conflito de agenda impede");
  });

  it("keeps invalid Education events visible to administrators", () => {
    const events = read(
      "src/modules/business/education/pages/EducationEventsPage.tsx",
    );

    expect(events).toContain("const invalidEvents = events.filter");
    expect(events).toContain("getTemporalState(event) === 'invalid'");
    expect(events).toContain(">Revisar<");
    expect(events).toContain("{invalidEvents.length}");
    expect(events).toContain("Number.isNaN(date.getTime())");
    expect(events).toContain("'Data inválida'");
  });

  it("keeps zero program slots truthful in the Education admin", () => {
    const programs = read(
      "src/modules/business/education/pages/EducationProgramsPage.tsx",
    );

    expect(programs).toContain("program.available_slots === 0");
    expect(programs).toContain("'Sem vagas'");
    expect(programs).toContain("vagas disponíveis");
  });

  it("keeps Education curriculum validation owned by core", () => {
    const programs = read(
      "src/modules/business/education/pages/EducationProgramsPage.tsx",
    );
    const mutations = read(
      "src/core/education/services/education.mutations.ts",
    );
    const validation = read("src/core/education/programValidation.ts");

    expect(validation).toContain("EDUCATION_PROGRAM_CURRICULUM_MAX_TOPICS");
    expect(validation).toContain("EDUCATION_PROGRAM_CURRICULUM_TOPIC_MAX_LENGTH");
    expect(validation).toContain("getEducationProgramCurriculumValidationError");
    expect(validation).toContain("normalizeEducationProgramCurriculumTopics");
    expect(mutations).toContain("getEducationProgramCurriculumValidationError");
    expect(programs).toContain("getEducationProgramCurriculumValidationError");
    expect(programs).toContain("normalizeEducationProgramCurriculumTopics");
    expect(mutations).not.toContain("function normalizeCurriculumTopics");
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
    expect(programs).toContain("prefersReducedMotion ? false : { opacity: 0, y: 20 }");
    expect(programs).toContain("enabled: Boolean(profile?.id)");
    expect(events).toContain("enabled: Boolean(profile?.id)");
    expect(events).toContain("max-h-[90vh]");
    expect(events).toContain("useReducedMotion");
    expect(events).toContain("prefersReducedMotion ? false : { opacity: 0, y: 20 }");
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

  it("keeps Education event temporal semantics centralized", () => {
    const events = read(
      "src/modules/business/education/pages/EducationEventsPage.tsx",
    );
    const eventsHook = read(
      "src/modules/business/education/hooks/useEducationEvents.ts",
    );
    const queries = read(
      "src/core/education/services/education.queries.ts",
    );
    const temporal = read(
      "src/core/education/eventTemporalState.ts",
    );

    expect(temporal).toContain("getEducationEventTemporalState");
    expect(temporal).toContain("'ongoing'");
    expect(events).toContain("getEducationEventTemporalState");
    expect(events).toContain("Em andamento");
    expect(events).toContain("Revisar data");
    expect(events).not.toContain("const isUpcoming =");
    expect(eventsHook).toContain("active?: boolean");
    expect(eventsHook).toContain("isPublic, upcoming, active");
    expect(queries).toContain("active?: boolean");
    expect(queries).toContain("ends_at.gte.");
  });

  it("keeps program capacity invariants in the Education write model", () => {
    const validation = read("src/core/education/programValidation.ts");
    const mutations = read(
      "src/core/education/services/education.mutations.ts",
    );

    expect(validation).toContain("maxCapacity?: number | null");
    expect(validation).toContain("currentEnrollment?: number | null");
    expect(validation).toContain("Number.isInteger(input.availableSlots)");
    expect(validation).toContain(
      "input.currentEnrollment > input.maxCapacity",
    );
    expect(mutations).toContain(
      ".select('education_profile_id,max_capacity,current_enrollment')",
    );
    expect(mutations).toContain("const capacityTouched =");
  });

  it("does not collapse unknown program vacancies into unavailable", () => {
    const service = read(
      "src/modules/business/education/services/EducationService.ts",
    );

    expect(service).not.toContain("isProgramAvailable");
    expect(service).not.toContain("(program.available_slots ?? 0) > 0");
  });

  it("does not expose synthetic Education lead conversion probability", () => {
    const service = read(
      "src/modules/business/education/services/EducationService.ts",
    );

    expect(service).not.toContain("calculateLeadConversionProbability");
    expect(service).not.toMatch(/new:\s*20/);
    expect(service).not.toMatch(/contacted:\s*35/);
    expect(service).not.toMatch(/proposal_sent:\s*75/);
  });

  it("keeps active public Education events filtered by the temporal owner", () => {
    const queries = read("src/core/education/services/education.queries.ts");

    expect(queries).toContain("isEducationEventActive");
    expect(queries).toContain("return options.active");
    expect(queries).toContain("startsAt: event.starts_at");
    expect(queries).toContain("endsAt: event.ends_at");
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
    expect(analyticsHook).not.toContain("queries: educationQueries");
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

    const contracts = read("src/core/education/contracts.ts");
    expect(contracts).toContain("avgEnrollmentRate?: number | null");

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
    expect(profileValidation).toContain("resolveEducationSourceProvenance");
    expect(mutations).toContain("getEducationProfileSetupValidationErrors");
    expect(mutations).toContain("resolveEducationSourceProvenance");
    expect(mutations).toContain("payload.school_inep_code?.trim() || null");
    expect(mutations).toContain("payload.school_source_url?.trim() || null");
    expect(mutations).toContain("payload.whatsapp_number != null");
    expect(mutations).toContain("payload.summary != null");
  });

  it("keeps Education admin write patches owned by core contracts", () => {
    const contracts = read("src/core/education/contracts.ts");
    const mutations = read(
      "src/core/education/services/education.mutations.ts",
    );
    const service = read(
      "src/modules/business/education/services/EducationService.ts",
    );
    const leadsHook = read(
      "src/modules/business/education/hooks/useEducationLeads.ts",
    );
    const programsHook = read(
      "src/modules/business/education/hooks/useEducationPrograms.ts",
    );
    const eventsHook = read(
      "src/modules/business/education/hooks/useEducationEvents.ts",
    );

    expect(contracts).toContain("export type EducationLeadAdminPatch");
    expect(contracts).toContain("export type EducationProgramAdminPatch");
    expect(contracts).toContain("export type EducationEventAdminPatch");
    expect(contracts).not.toContain("| 'status'");
    expect(contracts).not.toContain("| 'created_at'");
    expect(contracts).not.toContain("| 'updated_at'");
    expect(contracts).not.toContain("| 'education_profile_id'");
    expect(contracts).not.toContain("| 'first_contact_at'");
    expect(contracts).not.toContain("| 'lost_reason'");
    expect(service).toContain("payload: EducationLeadAdminPatch");
    expect(service).toContain("payload: EducationProgramAdminPatch");
    expect(service).toContain("payload: EducationEventAdminPatch");
    expect(leadsHook).toContain("payload: EducationLeadAdminPatch");
    expect(programsHook).toContain("payload: EducationProgramAdminPatch");
    expect(eventsHook).toContain("payload: EducationEventAdminPatch");
    expect(mutations).toContain("IMMUTABLE_EDUCATION_ENTITY_FIELDS");
    expect(mutations).toContain("hasForbiddenMutationKey");
  });

  it("keeps EducationService focused on orchestration", () => {
    const service = read(
      "src/modules/business/education/services/EducationService.ts",
    );

    expect(service).not.toContain("AUXILIARY / UTILITY METHODS");
    expect(service).not.toContain("calculatePipelineSummary");
    expect(service).not.toContain("formatLeadContactInfo");
    expect(service).not.toContain("getProfileStatusColor");
    expect(service).not.toContain("getLeadStatusColor");
    expect(service).not.toContain("sortProgramsByDisplayOrder");
  });

  it("does not create Education profiles from a read-like facade API", () => {
    const service = read(
      "src/modules/business/education/services/EducationService.ts",
    );

    expect(service).not.toContain("getOrCreateProfile");
    expect(service).toContain("async saveSetupProfile");
    expect(service).toContain("createDraftEducationProfile");
  });

  it("keeps public lead intake on the canonical broker", () => {
    const service = read(
      "src/modules/business/education/services/EducationService.ts",
    );
    const hook = read(
      "src/modules/business/education/hooks/useEducationLeads.ts",
    );

    expect(service).not.toContain("CreateLeadPayload");
    expect(service).not.toContain("async createLead(");
    expect(service).not.toContain("function validateEmail(");
    expect(service).not.toContain("function validatePhone(");
    expect(service).not.toContain("trackLeadCreated");
    expect(hook).toContain("PublicEducationLeadService.create");
    expect(hook).not.toContain("const createMutation =");
    expect(hook).not.toContain("create: createMutation.mutateAsync");
  });

  it("keeps Education validation out of the business facade", () => {
    const service = read(
      "src/modules/business/education/services/EducationService.ts",
    );

    expect(service).not.toContain("validateProfilePayload(");
    expect(service).not.toContain("validateProgramPayload(");
    expect(service).not.toContain("validateLeadPayload(");
    expect(service).not.toContain("validateEventPayload(");
    expect(service).not.toContain("Program name too short");
    expect(service).not.toContain("Event title too short");
  });

  it("keeps Education Leads operational smoke deterministic", () => {
    const leadsE2e = read(
      "tests/e2e/education/education-leads.spec.ts",
    );

    expect(leadsE2e).toContain("authenticateAsBusinessOwner");
    expect(leadsE2e).toContain("first_contact_at");
    expect(leadsE2e).toContain("lost_reason");
    expect(leadsE2e).toContain("Página 1 de 2");
    expect(leadsE2e).toContain("Página 2 de 2");
    expect(leadsE2e).not.toContain("waitForTimeout");
    expect(leadsE2e).not.toContain("body.innerText.trim().length");
    expect(leadsE2e).not.toContain("Campo de busca não encontrado");
    expect(leadsE2e).not.toContain("hasContent ||");
  });

  it("keeps Education Programs operational smoke deterministic", () => {
    const programsE2e = read(
      "tests/e2e/education/education-programs.spec.ts",
    );

    expect(programsE2e).toContain("authenticateAsBusinessOwner");
    expect(programsE2e).toContain("createTestProgram");
    expect(programsE2e).toContain("Sem vagas");
    expect(programsE2e).toContain("Salvar alterações");
    expect(programsE2e).toContain("Excluir programa");
    expect(programsE2e).not.toContain("waitForTimeout");
    expect(programsE2e).not.toContain("body.innerText.trim().length");
    expect(programsE2e).not.toContain("Campo de busca não encontrado");
    expect(programsE2e).not.toContain("Botão de criar programa não encontrado");
  });

  it("keeps legacy Education debug E2E outside certification", () => {
    for (const path of [
      "tests/e2e/education/education-debug.spec.ts",
      "tests/e2e/education/education-cookie-debug.spec.ts",
      "tests/e2e/education/education-network-debug.spec.ts",
      "tests/e2e/education/education-dashboard-debug.spec.ts",
    ]) {
      const source = read(path);
      expect(source).toContain("test.skip(");
      expect(source).toContain(
        "Diagnóstico legado: não conta como certificação E2E de Education.",
      );
    }
  });

  it("keeps Education institution identity owned by core", () => {
    const setupModel = read(
      "src/modules/business/education/pages/EducationSetupPage.model.ts",
    );
    const mutations = read(
      "src/core/education/services/education.mutations.ts",
    );
    const identity = read("src/core/education/profileIdentity.ts");

    expect(identity).toContain("EDUCATION_INSTITUTION_TYPE_BY_NICHE");
    expect(setupModel).toContain("resolveEducationInstitutionTypeForNiche");
    expect(setupModel).not.toContain("const INSTITUTION_TYPE_BY_NICHE");
    expect(mutations).toContain("isEducationInstitutionTypeForNiche");
    expect(mutations).toContain("getEducationProfileIdentityPatchError");
    expect(mutations).toContain("institution_type,niche_key");
    expect(mutations).toContain(
      "Tipo de instituicao incompativel com o nicho",
    );
  });

  it("keeps Education support levels owned by core", () => {
    const constants = read(
      "src/modules/business/education/constants/index.ts",
    );
    const supportLevel = read("src/core/education/supportLevel.ts");
    const mutations = read(
      "src/core/education/services/education.mutations.ts",
    );

    expect(supportLevel).toContain("EDUCATION_SUPPORT_LEVELS_CANONICAL");
    expect(constants).toContain(
      "EDUCATION_SUPPORT_LEVELS = EDUCATION_SUPPORT_LEVELS_CANONICAL",
    );
    expect(constants).not.toContain("FULL_ENABLED: 'full_enabled'");
    expect(mutations).toContain("isEducationSupportLevel");
    expect(mutations).toContain("Nivel de suporte invalido");
  });

  it("keeps Education niche keys owned by core", () => {
    const nicheTypes = read(
      "src/modules/business/education/niches/types.ts",
    );
    const nicheKey = read("src/core/education/nicheKey.ts");
    const mutations = read(
      "src/core/education/services/education.mutations.ts",
    );

    expect(nicheKey).toContain("EDUCATION_NICHE_KEYS_CANONICAL");
    expect(nicheTypes).toContain("isEducationNicheKeyCore(key)");
    expect(nicheTypes).not.toContain("const EDUCATION_NICHE_KEYS");
    expect(mutations).toContain("isEducationNicheKey(payload.niche_key)");
    expect(mutations).not.toContain("const validNiches");
  });

  it("keeps Education school identity owned by core", () => {
    const setupModel = read(
      "src/modules/business/education/pages/EducationSetupPage.model.ts",
    );
    const schoolIdentity = read("src/core/education/schoolIdentity.ts");
    const mutations = read(
      "src/core/education/services/education.mutations.ts",
    );

    expect(schoolIdentity).toContain("EDUCATION_SCHOOL_TYPES_CANONICAL");
    expect(schoolIdentity).toContain("EDUCATION_SCHOOL_NETWORKS_CANONICAL");
    expect(setupModel).toContain("isEducationSchoolNetworkCompatible");
    expect(setupModel).toContain("normalizeEducationSchoolNetwork");
    expect(mutations).toContain("getEducationSchoolIdentityPatchError");
    expect(mutations).toContain("school_type,school_network");
    expect(mutations).toContain(
      "Rede administrativa incompativel com o tipo de escola",
    );
  });

  it("keeps Education profile statuses owned by core", () => {
    const statusContract = read("src/core/education/profileStatus.ts");
    const mutations = read(
      "src/core/education/services/education.mutations.ts",
    );

    expect(statusContract).toContain("EDUCATION_PROFILE_STATUSES_CANONICAL");
    expect(mutations).toContain("isEducationProfileStatus");
    expect(mutations).not.toContain("const validStatuses");
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
