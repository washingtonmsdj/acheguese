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

  it("keeps observability and tracking persistence owned by core", () => {
    const observability = read(
      "src/core/education/services/EducationObservabilityService.ts",
    );
    const tracking = read(
      "src/core/education/services/EducationTrackingService.ts",
    );
    const legacyObservability = read(
      "src/modules/business/education/services/EducationObservabilityService.ts",
    );
    const legacyTracking = read(
      "src/modules/business/education/services/EducationTrackingService.ts",
    );

    expect(observability).toContain("@/integrations/supabase");
    expect(tracking).toContain("@/integrations/supabase");
    expect(legacyObservability).toContain(
      "@/core/education/services/EducationObservabilityService",
    );
    expect(legacyTracking).toContain(
      "@/core/education/services/EducationTrackingService",
    );
    expect(legacyObservability).not.toContain("@/integrations/");
    expect(legacyTracking).not.toContain("@/integrations/");
  });

  it("keeps Education domain contracts owned by core", () => {
    const contracts = read("src/core/education/contracts.ts");
    const moduleTypes = read("src/modules/business/education/types/index.ts");
    const tracking = read(
      "src/core/education/services/EducationTrackingService.ts",
    );

    expect(contracts).toContain("export type EducationNicheKey");
    expect(contracts).toContain("export interface EducationProfile");
    expect(contracts).toContain("export type EducationAnalyticsEventType");
    expect(moduleTypes).toContain("@/core/education/contracts");
    expect(moduleTypes).not.toContain("export interface EducationProfile");
    expect(tracking).toContain("@/core/education/contracts");
    expect(tracking).not.toContain("@/modules/business/education");
  });

  it("freezes only the remaining read/write model integration debt", () => {
    const validator = read("tools/architecture/validate-education-module-boundaries.ts");

    for (const path of [
      "src/modules/business/education/services/education.mutations.ts",
      "src/modules/business/education/services/education.queries.ts",
    ]) {
      expect(validator).toContain(path);
    }

    expect(validator).not.toContain(
      "src/modules/business/education/services/EducationObservabilityService.ts",
    );
    expect(validator).not.toContain(
      "src/modules/business/education/services/EducationTrackingService.ts",
    );
    expect(validator).toContain("ALLOWED_DIRECT_INTEGRATION_FILES");
    expect(validator).toContain("direct integrations access is forbidden");
    expect(validator).toContain("transitional allowlist entry is stale");
  });
});
