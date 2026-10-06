import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("G6 Education authenticated lifecycle gate", () => {
  it("keeps the lifecycle scoped to the dedicated authenticated fixture", () => {
    const spec = readFileSync(
      join(ROOT, "tests/e2e/education-lifecycle-authenticated.spec.ts"),
      "utf8",
    );
    const runner = readFileSync(
      join(ROOT, "tools/release/run-education-lifecycle-authenticated.mjs"),
      "utf8",
    );
    const config = readFileSync(join(ROOT, "playwright.config.ts"), "utf8");
    const packageJson = readFileSync(join(ROOT, "package.json"), "utf8");

    expect(spec).toContain(
      'const FIXTURE_MARKER = "account-authenticated-e2e"',
    );
    expect(spec).toContain('const EDUCATION_PREFIX = "G6 E2E Education"');
    expect(spec).toContain("cleanupEducationFixtures(client)");
    expect(spec).toContain('getByTestId("education-school-inep")');
    expect(spec).toContain('getByTestId("education-school-source-url")');
    expect(spec).toContain('getByTestId("education-age-min").fill("0")');
    expect(spec).toContain("expect(inactiveProgram?.available_slots).toBe(0)");
    expect(spec).toContain("expect(Number(inactiveProgram?.price_from)).toBe(0)");
    expect(spec).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(spec).not.toContain("createOptionalOperationalAdminClient");

    expect(runner).toContain(
      'E2E_EDUCATION_LIFECYCLE_AUTHENTICATED: "true"',
    );
    expect(runner).toContain(
      '"tests/e2e/education-lifecycle-authenticated.spec.ts"',
    );
    expect(runner).toContain('"--retries=0"');
    expect(runner).not.toContain("SUPABASE_SERVICE_ROLE_KEY");

    expect(config).toContain(
      'process.env.E2E_EDUCATION_LIFECYCLE_AUTHENTICATED === "true"',
    );
    expect(config).toContain(
      "education-lifecycle-authenticated\\.spec\\.ts",
    );

    expect(packageJson).toContain(
      '"test:e2e:education-lifecycle-authenticated": "node tools/release/run-education-lifecycle-authenticated.mjs"',
    );
    expect(packageJson).toContain(
      '"test:e2e:education-lifecycle-authenticated": "node tools/release/run-education-lifecycle-authenticated.mjs"',
    );
    expect(packageJson).not.toContain(
      "npm run test:e2e:business-lifecycle-authenticated && npm run test:e2e:education-lifecycle-authenticated",
    );
  });

  it("keeps preserved Education E2E suites truthful while the module is paused", () => {
    const publicSpec = readFileSync(
      join(ROOT, "tests/e2e/education/education-public.spec.ts"),
      "utf8",
    );
    const debugSpec = readFileSync(
      join(ROOT, "tests/e2e/education/education-dashboard-debug.spec.ts"),
      "utf8",
    );
    const readme = readFileSync(
      join(ROOT, "tests/e2e/education/README.md"),
      "utf8",
    );

    expect(publicSpec).toContain("test.describe.skip('Education Public Pages'");
    expect(debugSpec).toContain("Diagnóstico legado: não conta como certificação E2E de Education.");
    expect(readme).toContain("não deve ser interpretada como prova de readiness de produção");
    expect(readme).toContain("smoke legado");
    expect(readme).not.toContain("✅ 69 testes criados e prontos para execução");
  });

  it("keeps the public Education surface paused during authenticated certification", () => {
    const launchScope = readFileSync(
      join(ROOT, "src/app/config/launchScope.ts"),
      "utf8",
    );
    const activeLazy = readFileSync(
      join(ROOT, "src/app/routes/activeLazyImports.ts"),
      "utf8",
    );

    expect(launchScope).toContain("education: false");
    expect(activeLazy).not.toContain("EducationExplorerPage");
    expect(activeLazy).not.toContain("EducationDetailPage");
    expect(
      existsSync(join(ROOT, "src/modules/business/education/pages/EducationExplorerPage.tsx")),
    ).toBe(true);
    expect(
      existsSync(join(ROOT, "src/modules/business/education/pages/EducationDetailPage.tsx")),
    ).toBe(true);
  });
});
