import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("MVP external dependency documentation", () => {
  it("keeps resolved infrastructure dependencies out of active blocker status", () => {
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
      expect(content).toMatch(/não há blocker externo ativo/i);
      expect(content).not.toMatch(/\b[0-9a-f]{40}\b/i);
    }

    expect(execution).toContain("## Dependências externas resolvidas");
    expect(execution).not.toContain("## Blocker externo atual");
    expect(nextSteps).not.toContain("fechar o blocker externo restante");
    expect(nextSteps).toContain("#305 — Supabase** encerrado");
    expect(nextSteps).toContain("#445 — Vercel** encerrado");
  });

  it("preserves canonical release identity semantics after blocker closure", () => {
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
