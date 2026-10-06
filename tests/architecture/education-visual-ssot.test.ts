import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { PRODUCT_MODULE_REGISTRY } from "../../src/app/config/productModuleRegistry";

const ROOT = process.cwd();
const EDUCATION_VISUAL_OWNERS = [
  "src/modules/business/education/pages/explorerNicheChip.tsx",
  "src/modules/business/education/pages/explorerPresentation.constants.ts",
  "src/modules/business/education/pages/explorerCards.tsx",
  "src/modules/business/education/pages/explorerFilterControls.tsx",
  "src/modules/business/education/pages/explorerMarketingSections.tsx",
  "src/modules/business/education/pages/EducationExplorerPage.tsx",
  "src/modules/business/education/pages/EducationDetailPage.tsx",
  "src/modules/business/education/pages/EducationDetailPresentationData.ts",
  "src/modules/business/education/pages/EducationDetailStateViews.tsx",
  "src/modules/business/education/pages/EducationDetailPresentation.tsx",
  "src/modules/business/education/pages/EducationDetailSidebar.tsx",
  "src/modules/business/education/pages/EducationAnalyticsPage.tsx",
  "src/modules/business/education/pages/EducationDashboardPage.tsx",
  "src/modules/business/education/pages/EducationLeadsPage.tsx",
  "src/modules/business/education/pages/EducationProgramsPage.tsx",
  "src/modules/business/education/pages/EducationEventsPage.tsx",
  "src/modules/business/education/pages/EducationPlansPage.tsx",
  "src/modules/business/education/pages/EducationSetupPage.tsx",
  "src/modules/business/education/pages/EducationSetupControls.tsx",
  "src/modules/business/education/pages/EducationSetupSections.tsx",
  "src/modules/business/education/components/analytics/EducationAnalyticsOverviewCard.tsx",
  "src/modules/business/education/components/analytics/EducationAnalyticsConversionCard.tsx",
  "src/modules/business/education/components/EducationLeadForm.tsx",
  "src/modules/business/education/components/EducationAdminReadError.tsx",
  "src/modules/business/education/niches/components/EducationUpgradeBanner.tsx",
  "src/modules/business/education/niches/components/EducationCapabilityGuard.tsx",
] as const;

const LEGACY_VISUAL_TOKENS = [
  "bg-background",
  "bg-card",
  "text-foreground",
  "text-muted-foreground",
  "text-primary",
  "bg-primary",
  "border-input",
  "border-destructive",
  "bg-destructive",
  "text-destructive",
  "ring-ring",
  "ring-offset-background",
  "text-gray-",
  "bg-gray-",
  "border-gray-",
  "text-blue-",
  "bg-blue-",
  "border-blue-",
  "text-green-",
  "bg-green-",
  "text-orange-",
  "bg-orange-",
  "text-purple-",
  "bg-purple-",
  "text-cyan-",
  "bg-cyan-",
  "text-red-",
  "bg-red-",
  "border-red-",
  "text-amber-",
  "bg-amber-",
  "border-amber-",
  "from-blue-",
  "to-indigo-",
  "from-amber-",
  "to-orange-",
] as const;

function readSource(relativePath: string): string {
  const absolutePath = path.join(ROOT, relativePath);
  expect(fs.existsSync(absolutePath), relativePath).toBe(true);
  return fs.readFileSync(absolutePath, "utf8");
}

describe("education visual SSOT", () => {
  it("keeps migrated Education UI owners versioned and territorial", () => {
    for (const relativePath of EDUCATION_VISUAL_OWNERS) {
      const source = readSource(relativePath);

      expect(source, relativePath).toContain("territory-");
      for (const token of LEGACY_VISUAL_TOKENS) {
        expect(source, `${relativePath}: legacy visual token returned: ${token}`).not.toContain(token);
      }
    }
  });

  it("does not advertise an Education comparison action without a real comparison owner", () => {
    const explorer = readSource(
      "src/modules/business/education/pages/EducationExplorerPage.tsx",
    );
    const cards = readSource(
      "src/modules/business/education/pages/explorerCards.tsx",
    );
    const marketing = readSource(
      "src/modules/business/education/pages/explorerMarketingSections.tsx",
    );

    expect(explorer).not.toContain("EducationCompareBar");
    expect(explorer).not.toContain("setComparing");
    expect(cards).not.toContain("onCompareToggle");
    expect(marketing).not.toContain("EducationCompareBar");
  });

  it("keeps the Education explorer truthful and free of internal versioning", () => {
    const explorer = readSource(
      "src/modules/business/education/pages/EducationExplorerPage.tsx",
    );
    const cards = readSource(
      "src/modules/business/education/pages/explorerCards.tsx",
    );
    const marketing = readSource(
      "src/modules/business/education/pages/explorerMarketingSections.tsx",
    );

    expect(explorer).toContain("useReducedMotion");
    expect(explorer).not.toContain("Vitrine V3");
    expect(explorer).not.toContain("Vitrine educacional V3");
    expect(explorer).not.toContain("profile.institution_type");

    expect(cards).toContain("getEducationLevelLabel");
    expect(cards).not.toContain("profile.institution_type");
    expect(cards).not.toContain("level.replace(/_/g, ' ')");

    expect(marketing).toContain("useReducedMotion");
    expect(marketing).toContain("getEducationLevelLabel");
    expect(marketing).toContain("SCHOOL_NETWORK_LABELS");
    expect(marketing).toContain("Uma amostra dos perfis disponíveis");
    expect(marketing).not.toContain("Curadoria com base");
    expect(marketing).not.toContain("profile.institution_type");
    expect(marketing).not.toContain("level.replace(/_/g, ' ')");
  });

  it("keeps the Education explorer states and niche toggles accessible", () => {
    const explorer = readSource(
      "src/modules/business/education/pages/EducationExplorerPage.tsx",
    );
    const marketing = readSource(
      "src/modules/business/education/pages/explorerMarketingSections.tsx",
    );

    expect(explorer).toContain('role="alert"');
    expect(explorer).toContain('aria-label="Carregando instituições de Educação"');
    expect(explorer).toContain('aria-live="polite"');
    expect(marketing).toContain("aria-pressed={selectedNiches.includes(niche.nicheKey)}");
    expect(marketing).toContain("Filtrar por");
  });

  it("keeps public Education CTA motion accessible", () => {
    const sidebar = readSource(
      "src/modules/business/education/pages/EducationDetailSidebar.tsx",
    );

    expect(sidebar).toContain("useReducedMotion");
    expect(sidebar).toContain("prefersReducedMotion ? 'auto' : 'smooth'");
  });

  it("keeps primary Education public touch targets mobile-sized", () => {
    const detail = readSource(
      "src/modules/business/education/pages/EducationDetailPage.tsx",
    );
    const presentation = readSource(
      "src/modules/business/education/pages/EducationDetailPresentation.tsx",
    );
    const explorer = readSource(
      "src/modules/business/education/pages/EducationExplorerPage.tsx",
    );
    const nicheChip = readSource(
      "src/modules/business/education/pages/explorerNicheChip.tsx",
    );

    expect(detail).toContain("h-11 w-11");
    expect(presentation).toContain("min-h-11");
    expect(explorer).toContain("h-11 w-11");
    expect(nicheChip).toContain("min-h-11");
  });

  it("keeps public Education sharing fail-loud for unsupported browsers", () => {
    const detail = readSource(
      "src/modules/business/education/pages/EducationDetailPage.tsx",
    );

    expect(detail).toContain("Compartilhamento indisponível");
    expect(detail).toContain("Copie o endereço desta página pela barra do navegador.");
  });

  it("keeps public Education hero actions keyboard-visible", () => {
    const detail = readSource(
      "src/modules/business/education/pages/EducationDetailPage.tsx",
    );

    expect(detail).toContain('aria-label="Breadcrumb"');
    expect(detail).toContain("focus-visible:ring-territory-on-image");
    expect(detail).toContain("aria-label=\"Compartilhar\"");
    expect(detail).toContain("aria-pressed={isFavorite}");
  });

  it("keeps public Education detail tabs navigable and accessible", () => {
    const detail = readSource(
      "src/modules/business/education/pages/EducationDetailPage.tsx",
    );
    const presentation = readSource(
      "src/modules/business/education/pages/EducationDetailPresentation.tsx",
    );

    expect(detail).toContain("const handleSectionChange");
    expect(detail).toContain("scrollIntoView");
    expect(detail).toContain("prefersReducedMotion ? 'auto' : 'smooth'");
    expect(detail).toContain("onChange={handleSectionChange}");
    expect(presentation).toContain('aria-label="Seções da instituição"');
    expect(presentation).toContain("aria-controls={section.id}");
    expect(presentation).toContain("aria-current={isActive ? 'location' : undefined}");
    expect(presentation).toContain("focus-visible:ring-2");
  });

  it("keeps public Education cards truthful and impression-based", () => {
    const detail = readSource(
      "src/modules/business/education/pages/EducationDetailPage.tsx",
    );
    const presentation = readSource(
      "src/modules/business/education/pages/EducationDetailPresentation.tsx",
    );

    expect(presentation).toContain("onViewportEnter={onVisible}");
    expect(presentation).toContain("useReducedMotion");
    expect(presentation).toContain("program.price_from === 0");
    expect(presentation).toContain("'Gratuito'");
    expect(presentation).toContain("program.available_slots === 0");
    expect(presentation).toContain("'Sem vagas'");
    expect(presentation).toContain("getEducationProgramModalityLabel");
    expect(presentation).toContain("getEducationProgramShiftLabel");
    expect(presentation).toContain("program.current_enrollment != null");
    expect(presentation).not.toContain("program.current_enrollment ?? 0");
    expect(presentation).toContain("program.max_capacity} alunos");
    expect(presentation).not.toContain('program.modality ?? "Presencial"');
    expect(presentation).not.toContain("Ver detalhes");
    expect(presentation).not.toContain("cursor-pointer");

    expect(detail).toContain("trackedProgramViews");
    expect(detail).toContain("trackedEventViews");
    expect(detail).toContain("active: true");
    expect(detail).not.toContain("upcoming: true");
    expect(detail).toContain("'Instituição educacional'");
    expect(detail).toContain("INEP {profile.school_inep_code}");
    expect(detail).toContain("Referência atualizada em");
    expect(detail).not.toContain("Cadastro público · INEP");
    expect(detail).not.toContain("Fonte revisada em");
    expect(detail).not.toContain("profile?.institution_type ??");
    expect(detail).toContain("trackProgramImpression");
    expect(detail).toContain("trackEventImpression");
    expect(detail).toContain("onViewportEnter={() => trackEventImpression(event.id)}");
    expect(detail).not.toContain("onClick={() => trackEventView(event.id)}");
  });

  it("keeps institutional Education claims on shared safe URL handling", () => {
    const sidebar = readSource(
      "src/modules/business/education/pages/EducationDetailSidebar.tsx",
    );

    expect(sidebar).toContain("resolveSafeHttpUrl");
    expect(sidebar).toContain("education-institutional-claim");
    expect(sidebar).toContain("forceHttps: false");
    expect(sidebar).toContain("hasInvalidInstitutionalEvidence");
    expect(sidebar).toContain("Informe uma URL pública válida usando http ou https.");
    expect(sidebar).toContain("normalizedInstitutionalEvidenceUrl ?? undefined");
    expect(sidebar).not.toContain(
      "void requestClaim(institutionalEvidenceUrl.trim())",
    );
  });

  it("keeps Education Explorer card CTAs uniquely named", () => {
    const cards = readSource(
      "src/modules/business/education/pages/explorerCards.tsx",
    );

    expect(cards).toContain("Ver detalhes de ${institutionName}");
    expect(cards).toContain("Abrir WhatsApp de ${institutionName}");
  });

  it("keeps Education Explorer filters keyboard and screen-reader visible", () => {
    const explorer = readSource(
      "src/modules/business/education/pages/EducationExplorerPage.tsx",
    );
    const nicheChip = readSource(
      "src/modules/business/education/pages/explorerNicheChip.tsx",
    );

    expect(explorer).toContain('aria-label="Buscar instituições de Educação"');
    expect(explorer).toContain('role="status"');
    expect(explorer).toContain('aria-live="polite"');
    expect(nicheChip).toContain("aria-pressed={Boolean(active)}");
    expect(nicheChip).toContain("focus-visible:ring-2");
  });

  it("keeps Education favorites and map links on canonical shared owners", () => {
    const detail = readSource(
      "src/modules/business/education/pages/EducationDetailPage.tsx",
    );
    const presentationData = readSource(
      "src/modules/business/education/pages/EducationDetailPresentationData.ts",
    );

    expect(detail).toContain("useCanonicalBusinessFavorite");
    expect(detail).toContain("buildGoogleMapsSearchUrl");
    expect(detail).not.toContain("setFavorited");
    expect(detail).not.toContain("https://www.google.com/maps/search");
    expect(presentationData).toContain("buildWhatsAppUrl");
    expect(presentationData).not.toContain("https://wa.me/");

    const urlService = readSource(
      "src/modules/business/education/services/EducationUrlService.ts",
    );
    expect(urlService).toContain("buildWhatsAppUrl");
    expect(urlService).not.toContain("https://wa.me/");
  });

  it("keeps AnalyticsGuard bound to the analytics authority", () => {
    const guard = readSource(
      "src/modules/business/education/niches/components/EducationCapabilityGuard.tsx",
    );
    const analyticsGuard = guard.slice(guard.indexOf("export function AnalyticsGuard"));

    expect(analyticsGuard).toContain('capability="analytics_basic"');
    expect(analyticsGuard).not.toContain('capability="basic_programs_catalog"');
  });

  it("keeps Education billing consumers on canonical PlanTier authority", () => {
    const subscription = readSource(
      "src/modules/business/education/services/education-subscription.service.ts",
    );
    const nicheBilling = readSource(
      "src/modules/business/education/niches/hooks/useEducationNicheBilling.ts",
    );
    const plansPage = readSource(
      "src/modules/business/education/pages/EducationPlansPage.tsx",
    );

    expect(subscription).toContain("planTier: subscription.plan_tier");
    expect(nicheBilling).toContain("planTier: subscriptionData.status.planTier");
    expect(nicheBilling).not.toContain("mapPlanTypeToTier");
    expect(plansPage).toContain("const currentPlanCode = status?.planTier ?? null;");
    expect(plansPage).not.toContain("planType === 'premium'");
  });

  it("keeps Education paused while its owners are hardened for later activation", () => {
    expect(PRODUCT_MODULE_REGISTRY.education.status).toBe("paused");
  });
});
