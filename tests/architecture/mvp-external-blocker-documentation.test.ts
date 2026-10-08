import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("MVP external dependency documentation", () => {
  it("represents reopened infrastructure gates and the Business P0 without a false READY", () => {
    const execution = readFileSync(
      "docs/08-roadmap/EXECUCAO_MAIN_ONLY.md",
      "utf8",
    );
    const nextSteps = readFileSync(
      "docs/08-roadmap/NEXT-STEPS.md",
      "utf8",
    );

    for (const content of [execution, nextSteps]) {
      expect(content).toContain("#305");
      expect(content).toContain("#445");
      expect(content).toContain("#649");
      expect(content).not.toMatch(/não há blocker externo ativo/i);
      expect(content).not.toMatch(/\b[0-9a-f]{40}\b/i);
    }

    expect(execution).toContain("## Blockers ativos de infraestrutura");
    expect(execution).toContain("### #305 — Supabase / PostgREST territorial");
    expect(execution).toContain("### #445 — Vercel / identidade de release");
    expect(execution).toContain("### #649 — Business / Endereço e idempotência");
    expect(execution).toContain("MVP NÃO HOMOLOGADO");
    expect(nextSteps).toContain("**#305 e #445 estão abertos**");
    expect(nextSteps).toContain("broker SQL/Address com testes negativos (#649)");
  });

  it("preserves release identity semantics while gates are open", () => {
    const execution = readFileSync(
      "docs/08-roadmap/EXECUCAO_MAIN_ONLY.md",
      "utf8",
    );
    const nextSteps = readFileSync(
      "docs/08-roadmap/NEXT-STEPS.md",
      "utf8",
    );

    expect(execution).toContain("`exact/equivalent`");
    expect(execution).toContain("Ignored Build Step");
    expect(execution).toContain("fingerprint");
    expect(execution).toContain("deployment `READY` + smoke");
    expect(execution).toContain("regressão de infraestrutura reabre o gate");
    expect(execution).toContain("somente paths classificados como **skippable**");
    expect(execution).toContain("incluindo este `EXECUCAO_MAIN_ONLY.md`");
    expect(nextSteps).toContain("paths explicitamente classificados como skippable");
    expect(nextSteps).toContain("`EXECUCAO_MAIN_ONLY.md`, exigem nova prova de release");
  });
});
