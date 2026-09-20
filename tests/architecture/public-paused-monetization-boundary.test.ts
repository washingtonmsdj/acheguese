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

  it("does not restore unsupported conversion claims", () => {
    expect(jobsSalaryStep).not.toContain("3x mais candidaturas");
    expect(jobsSalaryStep).toContain(
      "Informar a faixa salarial ajuda candidatos a avaliar a oportunidade",
    );
  });
});
