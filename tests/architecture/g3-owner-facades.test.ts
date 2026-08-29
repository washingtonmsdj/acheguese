import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const ONE_WAY_OWNER_FACADES = [
  [
    "src/modules/admin/services/OperationalDiagnosticsService.ts",
    "@/core/admin/services/OperationalDiagnosticsService",
  ],
  [
    "src/modules/admin/services/PlanChangeValidator.ts",
    "@/core/admin/services/PlanChangeValidator",
  ],
  [
    "src/modules/ai/core/client/aiClient.ts",
    "@/core/ai/platform/client/aiClient",
  ],
  [
    "src/modules/ai/core/domain/types.ts",
    "@/core/ai/platform/domain/types",
  ],
  [
    "src/modules/ai/virtual-tryon/services/tryon.service.ts",
    "@/core/ai/virtual-tryon/services/tryon.service",
  ],
  [
    "src/modules/ai/virtual-tryon/domain/types.ts",
    "@/core/ai/virtual-tryon/domain/types",
  ],
  [
    "src/modules/ai/virtual-tryon/constants/tryonConfig.ts",
    "@/core/ai/virtual-tryon/constants/tryonConfig",
  ],
  [
    "src/modules/classifieds/jobs/services/VagaReportService.ts",
    "@/core/classifieds/jobs/services/VagaReportService",
  ],
  [
    "src/modules/classifieds/jobs/services/VagasPublishPermissionService.ts",
    "@/core/classifieds/jobs/services/VagasPublishPermissionService",
  ],
  [
    "src/modules/classifieds/jobs/services/VagasService.ts",
    "@/core/classifieds/jobs/services/VagasService",
  ],
  [
    "src/modules/classifieds/jobs/types/vagas.types.ts",
    "@/core/classifieds/jobs/types/vagas.types",
  ],
  [
    "src/modules/classifieds/jobs/constants/query-limits.ts",
    "@/core/classifieds/jobs/constants/query-limits",
  ],
] as const;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("G3 one-way owner facades", () => {
  it.each(ONE_WAY_OWNER_FACADES)(
    "%s remains a facade to %s",
    (legacyPath, canonicalSpecifier) => {
      const legacyFullPath = path.join(ROOT, legacyPath);
      const canonicalPath = canonicalSpecifier.replace(/^@\//, "src/");
      const canonicalCandidates = [
        path.join(ROOT, `${canonicalPath}.ts`),
        path.join(ROOT, `${canonicalPath}.tsx`),
        path.join(ROOT, canonicalPath, "index.ts"),
      ];

      expect(fs.existsSync(legacyFullPath)).toBe(true);
      expect(canonicalCandidates.some((candidate) => fs.existsSync(candidate))).toBe(true);

      const legacyContent = fs.readFileSync(legacyFullPath, "utf8").trim();
      expect(legacyContent).toMatch(
        new RegExp(
          `^export \\* from ["']${escapeRegex(canonicalSpecifier)}["'];$`,
        ),
      );
    },
  );

  it("keeps mobility dispatch validation out of the module runtime", () => {
    expect(
      fs.existsSync(path.join(ROOT, "src/modules/mobility/scripts/validateDispatch.ts")),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(ROOT, "tools/maintenance/validate-mobility-dispatch.ts")),
    ).toBe(true);
  });
});
