import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");
const exists = (path: string) => existsSync(resolve(repoRoot, path));

const RETIRED_EDUCATION_BRIDGES = [
  "src/modules/business/education/types/index.ts",
  "src/modules/business/education/services/education.queries.ts",
  "src/modules/business/education/services/education.mutations.ts",
  "src/modules/business/education/constants/schoolStageOptions.ts",
  "src/modules/business/education/services/EducationTrackingService.ts",
  "src/modules/business/education/services/EducationObservabilityService.ts",
] as const;

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

  it("keeps funnel persistence exclusive to EducationTrackingService", () => {
    const observability = read(
      "src/core/education/services/EducationObservabilityService.ts",
    );
    const tracking = read(
      "src/core/education/services/EducationTrackingService.ts",
    );

    expect(observability).not.toContain("@/integrations/supabase");
    expect(observability).not.toContain("education_analytics_events");
    expect(tracking).toContain("@/integrations/supabase");
    expect(tracking).toContain("@/core/education/contracts");
    expect(tracking).toContain(".from('education_analytics_events')");
    expect(tracking).not.toContain("@/modules/business/education");
  });

  it("keeps Education domain contracts owned by core", () => {
    const contracts = read("src/core/education/contracts.ts");

    expect(contracts).toContain("export type EducationNicheKey");
    expect(contracts).toContain("export interface EducationProfile");
    expect(contracts).toContain("export type EducationAnalyticsEventType");
  });

  it("keeps the remote Education authorization probe rollback-only and admin-safe", () => {
    const probe = read(
      "tests/security/education-management-authority-remote-probe.sql",
    );

    expect(probe).toContain("BEGIN;");
    expect(probe).toContain("ROLLBACK;");
    expect(probe).toContain("SET LOCAL ROLE authenticated");
    expect(probe).toContain("private.can_operate_business_profile");
    expect(probe).toContain("g6_education_probe_non_owner_helper_allowed");
    expect(probe).toContain("g6_education_probe_admin_membership_not_authorized");
    expect(probe).toContain("education_leads");
    expect(probe).toContain("education_events");
    expect(probe).toContain("education_lead_events");
    expect(probe).toContain("washingtonmsdj");
    expect(probe).toContain("'transaction', 'rollback'");
    expect(probe).not.toMatch(/\bCOMMIT\b/i);
  });

  it("retires all Education core bridges and blocks their recreation", () => {
    const validator = read("tools/architecture/validate-education-module-boundaries.ts");

    for (const path of RETIRED_EDUCATION_BRIDGES) {
      expect(exists(path), path).toBe(false);
      expect(validator).toContain(path);
    }

    expect(validator).toContain("RETIRED_CORE_BRIDGES");
    expect(validator).not.toContain("REQUIRED_CORE_BRIDGES");
    expect(validator).not.toContain("ALLOWED_DIRECT_INTEGRATION_FILES");
    expect(validator).toContain("direct integrations access is forbidden");
    expect(validator).toContain(
      "retired compatibility bridge must not be recreated",
    );
  });
});
