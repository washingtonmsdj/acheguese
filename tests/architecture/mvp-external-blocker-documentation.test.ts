import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("MVP external dependency documentation", () => {
  it("keeps Supabase as the sole active external blocker", () => {
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
      expect(content).not.toMatch(/\b[0-9a-f]{40}\b/i);
    }

    expect(execution).toContain("## Blocker externo atual");
    expect(execution).not.toContain("## Blockers externos atuais");
    expect(execution).toContain("Dependência externa normalizada — Vercel / #445");
    expect(nextSteps).toContain("fechar o blocker externo restante");
    expect(nextSteps).toContain("#445 — Vercel** encerrado");
  });

  it("preserves release identity semantics after the Vercel rate-limit recovery", () => {
    const execution = readFileSync(
      "docs/08-roadmap/EXECUCAO_MAIN_ONLY.md",
      "utf8",
    );

    expect(execution).toContain("Supabase data plane / sessão autenticada");
    expect(execution).toContain("Ignored Build Step");
    expect(execution).toContain("último commit deploy-relevante");
    expect(execution).toContain("smoke autenticado exact-SHA");
    expect(execution).toContain("deployment `READY` + smoke");
  });
});
