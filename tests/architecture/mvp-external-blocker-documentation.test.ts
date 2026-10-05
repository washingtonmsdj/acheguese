import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("MVP external dependency documentation", () => {
  it("keeps living release docs free of resolved external blockers", () => {
    const execution = readFileSync(
      "docs/08-roadmap/EXECUCAO_MAIN_ONLY.md",
      "utf8",
    );
    const nextSteps = readFileSync(
      "docs/08-roadmap/NEXT-STEPS.md",
      "utf8",
    );

    for (const content of [execution, nextSteps]) {
      expect(content).not.toContain("blocker externo restante");
      expect(content).not.toContain("auth_upstream_unavailable");
      expect(content).not.toContain("Connection terminated due to connection timeout");
      expect(content).not.toMatch(/\b[0-9a-f]{40}\b/i);
    }

    expect(execution).toContain("## Estado da certificação externa");
    expect(execution).toContain("Dependência externa normalizada — Vercel / #445");
    expect(nextSteps).toContain("#305 — Supabase** encerrado");
    expect(nextSteps).toContain("#445 — Vercel** encerrado");
  });

  it("preserves release identity semantics after external recovery", () => {
    const execution = readFileSync(
      "docs/08-roadmap/EXECUCAO_MAIN_ONLY.md",
      "utf8",
    );

    expect(execution).toContain("certificação autenticada de produção");
    expect(execution).toContain("Ignored Build Step");
    expect(execution).toContain("último commit deploy-relevante");
    expect(execution).toContain("E2E autenticado");
    expect(execution).toContain("deployment `READY` + smoke");
  });
});
