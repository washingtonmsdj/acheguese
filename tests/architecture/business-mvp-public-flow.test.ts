import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/pages/EmpresasLandingPage.tsx", "utf8");
const detailPage = readFileSync(
  "src/app/pages/EmpresaDetailLandingPage.tsx",
  "utf8",
);
const heroSection = readFileSync(
  "src/app/features/business-landing/sections/EmpresasHeroSection.tsx",
  "utf8",
);
const filtersSection = readFileSync(
  "src/app/features/business-landing/sections/EmpresasFiltrosSection.tsx",
  "utf8",
);
const relatedSection = readFileSync(
  "src/modules/business/company/sections/EmpresaProximasSection.tsx",
  "utf8",
);
const constants = readFileSync(
  "src/app/features/business-landing/utils/landing.constants.ts",
  "utf8",
);
const launchScope = readFileSync("src/app/config/launchScope.ts", "utf8");
const remoteProbe = readFileSync(
  "tests/security/business-mvp-public-flow-remote-probe.sql",
  "utf8",
);

describe("MVP Business public flow", () => {
  it("keeps Business category visibility independent from specialized vertical lifecycle", () => {
    expect(launchScope).not.toContain("BUSINESS_CATEGORY_SURFACES");
    expect(launchScope).not.toContain("isLaunchBusinessCategoryEnabled");
    expect(constants).toContain("getAllCategories().map(");
    expect(constants).not.toContain("isLaunchBusinessCategoryEnabled");
    expect(page).not.toContain("isLaunchBusinessCategoryEnabled");
    expect(page).toContain("realBusinesses.map(normalizeRealBusinessEntry)");
  });

  it("keeps the hero map truthful when active filters return zero results", () => {
    expect(page).toContain("businesses={filteredBusinesses}");
    expect(page).not.toContain(
      "filteredBusinesses.length > 0 ? filteredBusinesses : businessesToShow",
    );
  });

  it("keeps the public hero claims conditional instead of universal", () => {
    expect(heroSection).toContain(
      "sinais de verificação quando disponíveis",
    );
    expect(heroSection).not.toContain(
      "Negocios locais verificados, recomendados por moradores e proximos de voce.",
    );
  });

  it("keeps personal proximity owned by Perto de mim", () => {
    expect(filtersSection).toContain(
      '.filter(([value]) => value !== "distance")',
    );
    expect(page).not.toContain('["distance", "Mais proximas"]');
    expect(page).not.toContain("useSpatialSearchHybrid");
    expect(page).not.toContain("useRobustGeolocation");
    expect(page).toContain("const nearbyHref = moduleUrls.nearby");
    expect(page).toContain('secondaryLabel="Perto de mim"');
  });

  it("labels category-similar businesses as related, not geographically near", () => {
    expect(detailPage).toContain("BusinessService.getSimilarBusinesses(");
    expect(detailPage).toContain(">Relacionadas</TabsTrigger>");
    expect(relatedSection).toContain("Empresas relacionadas");
    expect(relatedSection).not.toContain("Empresas proximas");
  });

  it("keeps Business CTAs inside the active MVP module set", () => {
    expect(page).not.toContain('"/recomendacoes/nova"');
    expect(page).not.toContain('secondaryLabel="Indicar negocio"');
  });

  it("keeps the public detail on the Business Hours authority", () => {
    expect(detailPage).toContain("BusinessHoursService.getStatus(");
    expect(detailPage).toContain("BusinessHoursService.getOperationConfig(");
    expect(detailPage).not.toContain("currentMinutes");
    expect(detailPage).not.toContain("openMinutes");
    expect(detailPage).not.toContain("closeMinutes");
    expect(detailPage).not.toContain('today.open.split(\":\")');
    expect(detailPage).not.toContain('today.close.split(\":\")');
  });

  it("uses the public snapshot only as a status presentation fallback", () => {
    expect(detailPage).toContain("snapshot?.institutional.openStatus");
    expect(detailPage).toContain("if (!businessHoursStatus)");
    expect(detailPage).toContain("return base;");
  });

  it("keeps a rollback-only real-data proof for list to canonical detail", () => {
    expect(remoteProbe).toContain("BEGIN;");
    expect(remoteProbe).toContain("ROLLBACK;");
    expect(remoteProbe).toContain("public.public_business_search");
    expect(remoteProbe).toContain("complexo-do-nordeste-de-amaralina");
    expect(remoteProbe).not.toContain("COALESCE(b.category, '') <> 'educacao'");
    expect(remoteProbe).toContain("public.get_public_business_snapshot_by_slug(");
    expect(remoteProbe).toContain("'{identity,businessId}'");
    expect(remoteProbe).toContain("'{seo,canonical}'");
    expect(remoteProbe).toContain("MVP_BUSINESS_PUBLIC_FLOW_OK");
  });
});
