import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const PUBLIC_SEARCH_PAGES = [
  "src/modules/guide/pages/TouristPointsPage.tsx",
  "src/modules/professionals/services/pages/ServicosLandingPage.tsx",
  "src/modules/classifieds/jobs/pages/VagasListingPage.tsx",
] as const;

describe("public launch CTA hygiene", () => {
  it("does not ship no-op click handlers on public search surfaces", () => {
    for (const path of PUBLIC_SEARCH_PAGES) {
      const source = readFileSync(path, "utf8");
      expect(source, path).not.toContain("onClick: () => {}");
      expect(source, path).toContain("onSubmit: handleHeroSearch");
      expect(source, path).toContain("onClick: handleHeroSearch");
      expect(source, path).toContain("resultsSectionRef");
    }
  });

  it("keeps public jobs quick filters wired to real filter state", () => {
    const page = readFileSync(
      "src/modules/classifieds/jobs/pages/VagasListingPage.tsx",
      "utf8",
    );
    const hook = readFileSync(
      "src/modules/classifieds/jobs/hooks/useVagas.ts",
      "utf8",
    );
    const filters = readFileSync(
      "src/modules/classifieds/jobs/components/VagasFilters.tsx",
      "utf8",
    );

    expect(page).toContain("setSelectedContract");
    expect(page).toContain("setSelectedModality");
    expect(page).toContain("setSelectedUrgency");
    expect(hook).toContain("normalizeFilterToken");
    expect(hook).toContain("selectedUrgency");
    expect(filters).toContain("URGENCIA_LABELS");
    expect(filters).toContain("onUrgencyChange");
  });

  it("does not advertise an unavailable tourist-point suggestion action", () => {
    const page = readFileSync(
      "src/modules/guide/pages/TouristPointsPage.tsx",
      "utf8",
    );

    expect(page).not.toContain("Sugerir Ponto Turístico");
  });
});
