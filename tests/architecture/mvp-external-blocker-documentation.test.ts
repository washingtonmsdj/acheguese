import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("MVP external blocker documentation", () => {
  it("keeps both active external blockers explicit in living roadmap docs", () => {
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
  });

  it("keeps Supabase and Vercel blockers separated by responsibility", () => {
    const execution = readFileSync(
      "docs/08-roadmap/EXECUCAO_MAIN_ONLY.md",
      "utf8",
    );

    expect(execution).toContain("Supabase data plane / sessão autenticada");
    expect(execution).toContain("Vercel build/deployment rate limit");
    expect(execution).toContain("deployment Vercel `READY` desse exact-SHA");
    expect(execution).toContain("smoke autenticado exact-SHA");
  });
});
