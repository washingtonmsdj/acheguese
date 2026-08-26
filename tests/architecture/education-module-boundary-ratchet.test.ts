import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");

describe("Education module hardening ratchet", () => {
  it("does not advertise Education as production-ready while public routes are paused", () => {
    const readme = read("src/modules/business/education/README.md");
    const lazyImports = read("src/app/routes/lazyImports.ts");

    expect(readme).toContain("HARDENING — NOT MVP CERTIFIED");
    expect(readme).not.toContain("✅ Production Ready");
    expect(readme).not.toContain("234/234");
    expect(lazyImports).toContain(
      'EducationExplorerPage = createLaunchPausedRoute("Educacao")',
    );
  });

  it("freezes the known direct-integration debt instead of allowing it to grow", () => {
    const validator = read("scripts/validate-education-module-boundaries.ts");

    for (const path of [
      "src/modules/business/education/services/EducationObservabilityService.ts",
      "src/modules/business/education/services/EducationTrackingService.ts",
      "src/modules/business/education/services/education.mutations.ts",
      "src/modules/business/education/services/education.queries.ts",
    ]) {
      expect(validator).toContain(path);
    }

    expect(validator).toContain("ALLOWED_DIRECT_INTEGRATION_FILES");
    expect(validator).toContain("new direct integrations access is forbidden");
    expect(validator).toContain("transitional allowlist entry is stale");
  });

  it("keeps the architectural destination explicit", () => {
    const readme = read("src/modules/business/education/README.md");

    expect(readme).toContain("src/core/education");
    expect(readme).toContain("não acessam Supabase diretamente");
    expect(readme).toContain("não remover `launch-paused`");
  });
});
