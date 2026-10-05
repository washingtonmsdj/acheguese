import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("MVP external dependency documentation", () => {
  it("keeps resolved Supabase history separate from the current release blocker", () => {
    const execution = readFileSync(
      "docs/08-roadmap/EXECUCAO_MAIN_ONLY.md",
      "utf8",
    );
    const nextSteps = readFileSync(
      "docs/08-roadmap/NEXT-STEPS.md",
      "utf8",
    );

    for (const content of [execution, nextSteps]) {
      expect(content).not.toContain("auth_upstream_unavailable");
      expect(content).not.toContain(
        "Connection terminated due to connection timeout",
      );
      expect(content).not.toMatch(/\b[0-9a-f]{40}\b/i);
    }

    expect(execution).toContain("Supabase / #305 — encerrado");
    expect(execution).toContain("Release/Vercel / #445 — aberto");
    expect(nextSteps).toContain("#305 — Supabase** encerrado");
    expect(nextSteps).toContain("#445 — Vercel / certificação de produção permanece aberto");
  });

  it("preserves exact/equivalent release identity without weakening the smoke", () => {
    const execution = readFileSync(
      "docs/08-roadmap/EXECUCAO_MAIN_ONLY.md",
      "utf8",
    );

    expect(execution).toContain("`exact`");
    expect(execution).toContain("`equivalent`");
    expect(execution).toContain("Business lifecycle");
    expect(execution).toContain("Business Messaging");
    expect(execution).toContain("All Tests Passed");
    expect(execution).toContain("service-role key");
  });
});
