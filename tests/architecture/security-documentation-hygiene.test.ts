import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SECURITY_AUTHORITY_PATH =
  "docs/09-reference/governance/security/SECURITY_AUTHORITY.md";

describe("security documentation hygiene", () => {
  it("keeps Security Authority linked to live operational owners", () => {
    const authority = readFileSync(SECURITY_AUTHORITY_PATH, "utf8");

    expect(authority).toContain(
      "[Security Policy raiz](../../../../SECURITY.md)",
    );
    expect(authority).toContain(
      "[Execucao operacional atual](../../../08-roadmap/EXECUCAO_MAIN_ONLY.md)",
    );
    expect(authority).toContain(
      "`tools/migrations/validate-supabase-migrations.ts`",
    );
    expect(authority).toContain(
      "`docs/09-reference/SUPABASE_SECRETS.md`",
    );

    expect(authority).not.toContain("STATUS_ATUAL.md");
    expect(authority).not.toContain("`docs/SUPABASE_SECRETS.md`");
    expect(authority).not.toContain("`scripts/validate-supabase-migrations.ts`");
    expect(authority).not.toContain(
      "[Security Policy raiz](../../../SECURITY.md)",
    );
  });

  it("keeps dated security evidence explicitly archived", () => {
    const authority = readFileSync(SECURITY_AUTHORITY_PATH, "utf8");

    for (const evidence of [
      "SUPABASE_REMOTE_SECURITY_ADVISOR_2026-07-06.md",
      "SUPABASE_REMOTE_MIGRATION_DRIFT_2026-07-06.md",
      "SECURITY_AUTHORITY_PILOT_2026-07-07.md",
    ]) {
      expect(authority).toContain(`../../../10-archive/audits/${evidence}`);
    }

    expect(authority).not.toContain("(../../audits/");
    expect(authority).toContain(
      "Relatorios datados em `docs/10-archive/` sao evidencia historica.",
    );
  });
});
