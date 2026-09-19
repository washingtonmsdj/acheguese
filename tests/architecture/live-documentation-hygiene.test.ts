import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("live documentation hygiene", () => {
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
