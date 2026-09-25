import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("live documentation hygiene", () => {
  it("keeps dated G5 checkpoints out of live architecture docs", () => {
    const liveArchitectureDocs = readdirSync("docs/03-architecture");

    expect(
      liveArchitectureDocs.filter((name) => /^G5_.*\.md$/.test(name)),
    ).toEqual([]);
  });

  it("keeps the profile identity contract on current session owners", () => {
    const contract = readFileSync(
      "src/core/profiles/docs/CONTRACT_AUDIT_USERID_PROFILEID.md",
      "utf8",
    );

    expect(contract).toContain("SessionService");
    expect(contract).toContain("SessionState");
    expect(contract).toContain("SessionProfileView");
    expect(contract).toContain("useSessionContext");
    expect(contract).toContain("foram aposentados");

    expect(contract).not.toContain("Próxima Fase");
    expect(contract).not.toContain("Migração planejada");
    expect(contract).not.toContain("AuthContext.activeProfile");
    expect(contract).not.toContain("services usam \`string\` com \`@ts-nocheck\`");
  });

  it("keeps retired Gastronomy audits out of operational module docs", () => {
    expect(
      existsSync("src/modules/business/gastronomy/PRODUCTION_AUDIT.md"),
    ).toBe(false);

    const readme = readFileSync(
      "src/modules/business/gastronomy/README.md",
      "utf8",
    );
    expect(readme).toContain("docs/08-roadmap/EXECUCAO_MAIN_ONLY.md");
    expect(readme).not.toContain("PRODUCTION_AUDIT.md");
  });

  it("keeps live MVP roadmap docs free of stale commit snapshots", () => {
    const execution = readFileSync(
      "docs/08-roadmap/EXECUCAO_MAIN_ONLY.md",
      "utf8",
    );
    const nextSteps = readFileSync(
      "docs/08-roadmap/NEXT-STEPS.md",
      "utf8",
    );

    for (const content of [execution, nextSteps]) {
      expect(content).not.toMatch(/\b[0-9a-f]{40}\b/i);
      expect(content).not.toContain("A `main` atual é");
      expect(content).not.toContain("Baseline operacional auditada:");
    }

    expect(execution).toContain("SSOT OPERACIONAL");
    expect(execution).toContain("#305");
    expect(execution).toContain("#309");
    expect(nextSteps).toContain("Business / Empresas");
  });

  it("keeps Business validation as a living domain contract", () => {
    const validation = readFileSync(
      "src/modules/business/VALIDATION.md",
      "utf8",
    );

    expect(validation).toContain("contrato vivo do domínio Business");
    expect(validation).not.toMatch(/\b[0-9a-f]{40}\b/i);
    expect(validation).not.toContain("Checkpoint tecnico");
    expect(validation).not.toContain("G6 EM CERTIFICACAO");
    expect(validation).toContain("deploy exact-SHA");
  });

  it("keeps active source comments descriptive instead of migration logs", () => {
    const hook = readFileSync(
      "src/core/posts/hooks/usePostActions.ts",
      "utf8",
    );

    expect(hook).toContain("useSessionContext");
    expect(hook).not.toContain("AuthContext");
    expect(hook).not.toContain("MIGRADO");
    expect(hook).not.toContain("FASE PROFILE");
  });
});
