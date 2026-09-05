import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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
      "npm run test:e2e:business-lifecycle-authenticated && npm run test:e2e:education-lifecycle-authenticated",
    );
  });

  it("keeps the public Education surface paused during authenticated certification", () => {
    const launchScope = readFileSync(
      join(ROOT, "src/app/config/launchScope.ts"),
      "utf8",
    );
    const publicLazy = readFileSync(
      join(ROOT, "src/app/routes/lazyImports.ts"),
      "utf8",
    );

    expect(launchScope).toContain("education: false");
    expect(publicLazy).toContain(
      'EducationExplorerPage = createLaunchPausedRoute("Educacao")',
    );
    expect(publicLazy).toContain(
      'EducationDetailPage = createLaunchPausedRoute("Educacao")',
    );
  });
});
