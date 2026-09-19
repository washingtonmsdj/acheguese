import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public professional profile real-data boundary", () => {
  const page = readFileSync(
    "src/modules/professionals/pages/ProfissionalPublicPage.tsx",
    "utf8",
  );

  it("does not expose a concept-mock runtime profile", () => {
    expect(page).not.toContain("concept-mock");
    expect(page).not.toContain("PROFESSIONAL_CONCEPT_MOCK");
    expect(page).not.toContain("PROFESSIONAL_CONCEPT_DETAILS");
    expect(page).not.toContain("conceptMockEnabled");
    expect(
      existsSync("src/modules/professionals/mocks/professionalConceptMock.ts"),
    ).toBe(false);
  });

  it("always loads the public profile from the canonical hook", () => {
    expect(page).toContain("useProfessionalBySlug");
    expect(page).toContain("const profile = professional;");
    expect(page).not.toContain("enabled: !conceptMockEnabled");
  });

  it("does not invent portfolio or coverage data", () => {
    expect(page).toContain("const portfolio: string[] = [];");
    expect(page).toContain(
      "const coverage = profile.city ? [profile.city] : [];",
    );
    expect(page).toContain(
      'const profileLocationLabel = [profile.city, profile.state].filter(Boolean).join(" · ");',
    );
  });
});
