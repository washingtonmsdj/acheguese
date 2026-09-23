import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/pages/EmpresasLandingPage.tsx", "utf8");
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

  it("keeps Business CTAs inside the active MVP module set", () => {
    expect(page).toContain("const nearbyHref = moduleUrls.nearby");
    expect(page).toContain('secondaryLabel="Perto de mim"');
    expect(page).not.toContain('"/recomendacoes/nova"');
    expect(page).not.toContain('secondaryLabel="Indicar negocio"');
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
