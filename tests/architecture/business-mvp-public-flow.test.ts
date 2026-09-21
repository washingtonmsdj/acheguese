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
  it("filters paused business categories before user-visible list derivations", () => {
    expect(launchScope).toContain('educacao: "education"');
    expect(launchScope).toContain("education: false");
    expect(constants).toContain("isLaunchBusinessCategoryEnabled(category.slug)");
    expect(page).toContain("isLaunchBusinessCategoryEnabled(");
    expect(page).toContain("normalizeBusinessCategoryId(business.category)");

    const normalizeIndex = page.indexOf(".map(normalizeRealBusinessEntry)");
    const launchFilterIndex = page.indexOf(
      "isLaunchBusinessCategoryEnabled(",
      normalizeIndex,
    );
    const favoritesIndex = page.indexOf("const favoriteCandidateIds");

    expect(normalizeIndex).toBeGreaterThanOrEqual(0);
    expect(launchFilterIndex).toBeGreaterThan(normalizeIndex);
    expect(favoritesIndex).toBeGreaterThan(launchFilterIndex);
  });

  it("keeps a rollback-only real-data proof for list to canonical detail", () => {
    expect(remoteProbe).toContain("BEGIN;");
    expect(remoteProbe).toContain("ROLLBACK;");
    expect(remoteProbe).toContain("public.public_business_search");
    expect(remoteProbe).toContain("complexo-do-nordeste-de-amaralina");
    expect(remoteProbe).toContain("COALESCE(b.category, '') <> 'educacao'");
    expect(remoteProbe).toContain("public.get_public_business_snapshot_by_slug(");
    expect(remoteProbe).toContain("'{identity,businessId}'");
    expect(remoteProbe).toContain("'{seo,canonical}'");
    expect(remoteProbe).toContain("MVP_BUSINESS_PUBLIC_FLOW_OK");
  });
});
