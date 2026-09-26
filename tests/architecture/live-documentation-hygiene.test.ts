import { existsSync, readFileSync, readdirSync } from "node:fs";
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
      expect(content).not.toContain("#309");
    }

    expect(execution).toContain("SSOT OPERACIONAL");
    expect(execution).toContain("#305");
    expect(nextSteps).toContain("#305");
    expect(nextSteps).toContain("Business / Empresas");
  });

  it("keeps completed handoffs and superseded roadmaps out of the live roadmap", () => {
    expect(
      existsSync("docs/08-roadmap/handoff/CP-016_MEDIA_ASSET_CONTINUATION.md"),
    ).toBe(false);
    expect(existsSync("docs/08-roadmap/handoff/README.md")).toBe(false);
    expect(existsSync("docs/08-roadmap/RECOVERY-ROADMAP.md")).toBe(false);

    expect(
      existsSync("docs/10-archive/handoffs/CP-016_MEDIA_ASSET_CUTOVER.md"),
    ).toBe(true);
    expect(
      existsSync("docs/10-archive/roadmaps/RECOVERY-ROADMAP.md"),
    ).toBe(true);
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

  it("keeps the retired root pointer absent from live documentation", () => {
    expect(
      existsSync("URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md"),
    ).toBe(false);

    const docsIndex = readFileSync("docs/README.md", "utf8");
    expect(docsIndex).not.toContain(
      "URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md",
    );
  });

  it("keeps retired Feed and Post delivery planning out of live documentation", () => {
    expect(existsSync("docs/feed")).toBe(false);
    expect(existsSync("docs/10-archive/feed/FEED-GOVERNANCE.md")).toBe(true);
    expect(existsSync("docs/10-archive/feed/FEED-P1.C-REVIEW.md")).toBe(true);

    for (const retired of [
      "docs/05-ux/FEED-REVIEW.md",
      "docs/05-ux/FEED-CONTENT.md",
      "docs/05-ux/POST-REVIEW.md",
      "docs/05-ux/POST-CONTENT.md",
    ]) {
      expect(existsSync(retired), retired).toBe(false);
    }

    expect(
      existsSync("docs/10-archive/post-mvp/community-ux/README.md"),
    ).toBe(true);

    const decisions = readFileSync("docs/DECISIONS.md", "utf8");
    expect(decisions).not.toContain("05-ux/FEED-CONTENT.md");
    expect(decisions).not.toContain("FEED-CONTENT.md`, `POST-CONTENT.md");
    expect(decisions).toContain(
      "10-archive/post-mvp/community-ux/README.md",
    );
  });

  it("keeps obsolete UX sprint 1 planning out of live UX docs", () => {
    expect(existsSync("docs/05-ux/UX-AUDIT.md")).toBe(false);
    expect(existsSync("docs/05-ux/UX-IMPROVEMENTS.md")).toBe(false);
    expect(
      existsSync("docs/10-archive/post-mvp/ux-sprint-1/README.md"),
    ).toBe(true);

    const docsIndex = readFileSync("docs/README.md", "utf8");
    expect(docsIndex).not.toContain("05-ux/UX-AUDIT.md");
    expect(docsIndex).not.toContain("05-ux/UX-IMPROVEMENTS.md");
  });

  it("keeps superseded Home and Journey sprint docs out of live UX", () => {
    for (const retired of [
      "docs/05-ux/HOME-REVIEW.md",
      "docs/05-ux/HOME-UI-REVIEW.md",
      "docs/05-ux/HOME-CONTENT.md",
      "docs/05-ux/USER-JOURNEY-REVIEW.md",
      "docs/05-ux/FRICTION-MAP.md",
    ]) {
      expect(existsSync(retired), retired).toBe(false);
    }

    expect(
      existsSync("docs/10-archive/post-mvp/home-journey-sprints/README.md"),
    ).toBe(true);

    const docsIndex = readFileSync("docs/README.md", "utf8");
    for (const retiredRef of [
      "05-ux/HOME-REVIEW.md",
      "05-ux/HOME-UI-REVIEW.md",
      "05-ux/HOME-CONTENT.md",
      "05-ux/USER-JOURNEY-REVIEW.md",
      "05-ux/FRICTION-MAP.md",
    ]) {
      expect(docsIndex).not.toContain(retiredRef);
    }
    expect(docsIndex).toContain("05-ux/HOME-SPEC.md");
    expect(docsIndex).toContain("05-ux/HOME-INVENTORY.md");
  });

  it("keeps duplicate concept roots retired in favor of the design catalog", () => {
    expect(existsSync("docs/concepts")).toBe(false);
    for (const retired of [
      "docs/CONCEITO-CONTA-E-ACESSO.md",
      "docs/CONCEITO-MINHA-CONTA-SEGURANCA.md",
      "docs/ENTREGAS-TRES-MODALIDADES-CONCEITO.md",
      "docs/ENTREGADOR-VINCULADO-E-COMPROVANTE.md",
    ]) {
      expect(existsSync(retired), retired).toBe(false);
    }

    expect(
      existsSync(
        "docs/04-design/catalogo-conceitos/24-conta-acesso/documentos-originais/CONCEITO-CONTA-E-ACESSO.md",
      ),
    ).toBe(true);
    expect(
      existsSync(
        "docs/04-design/catalogo-conceitos/25-minha-conta/documentos-originais/CONCEITO-MINHA-CONTA-SEGURANCA.md",
      ),
    ).toBe(true);
  });

  it("keeps stale parallel Territory planning out of live documentation", () => {
    expect(existsSync("docs/domain")).toBe(false);
    expect(
      existsSync("docs/10-archive/territory/TERRITORY-GOVERNANCE.md"),
    ).toBe(true);
    expect(
      existsSync("docs/10-archive/territory/TERRITORY-ROADMAP.md"),
    ).toBe(true);
    expect(
      existsSync("docs/10-archive/territory/TERRITORY-DATA-QUALITY-V2.md"),
    ).toBe(true);
  });

  it("keeps migration forensics archived while executable audit baselines remain live", () => {
    expect(
      existsSync("docs/audits/MIGRATION_HISTORY_FALSE_REMOTE_ONLY_47_2026-08-10.csv"),
    ).toBe(false);
    expect(
      existsSync("docs/audits/MIGRATION_HISTORY_FORENSICS_2026-08-10.csv"),
    ).toBe(false);
    expect(
      existsSync("docs/audits/architecture-boundaries-incremental-baseline.json"),
    ).toBe(true);
    expect(
      existsSync("docs/audits/module-integration-runtime-allowlist.json"),
    ).toBe(true);
  });

  it("keeps living taxonomy aligned with the executable MVP lifecycle", () => {
    const taxonomy = readFileSync("docs/02-domain/TAXONOMY_SSOT.md", "utf8");
    const currentRules = readFileSync(
      "docs/03-architecture/CURRENT_RULES.md",
      "utf8",
    );
    const corePlatform = readFileSync(
      "docs/03-architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md",
      "utf8",
    );
    const modulesReadme = readFileSync("src/modules/README.md", "utf8");
    const communityContract = readFileSync(
      "docs/03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md",
      "utf8",
    );

    for (const owner of [
      "src/app/config/productModuleRegistry.ts",
      "src/app/config/platformCapabilityRegistry.ts",
      "src/app/config/lifecycleRegistry.ts",
    ]) {
      expect(taxonomy).toContain(owner);
    }

    expect(taxonomy).toContain(
      "docs/10-archive/plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md",
    );
    expect(taxonomy).not.toContain("docs/tasks");
    expect(taxonomy).not.toContain("dominio horizontal base");
    expect(taxonomy).not.toContain(
      "O core domain do produto e `Comunidade Local`",
    );

    expect(currentRules).not.toContain("domínio horizontal base");
    expect(corePlatform).not.toContain(
      "core domain do produto continua sendo `Comunidade Local`",
    );
    expect(modulesReadme).not.toContain(
      "Community First core domain is `Comunidade Local`",
    );

    expect(communityContract).toContain(
      "src/app/config/platformCapabilityRegistry.ts",
    );
    expect(communityContract).not.toContain(
      "search` está `active` no\n`src/app/config/productModuleRegistry.ts`",
    );
  });

  it("keeps dated G5 checkpoints out of live architecture docs", () => {
    const liveArchitectureFiles = readdirSync("docs/03-architecture");
    expect(
      liveArchitectureFiles.filter((name) => /^G5_.*2026-/.test(name)),
    ).toEqual([]);
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
