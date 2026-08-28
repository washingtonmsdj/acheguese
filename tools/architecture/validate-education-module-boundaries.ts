#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EDUCATION_ROOT = "src/modules/business/education";

const RETIRED_CORE_BRIDGES = new Set([
  "src/modules/business/education/types/index.ts",
  "src/modules/business/education/services/education.queries.ts",
  "src/modules/business/education/services/education.mutations.ts",
  "src/modules/business/education/constants/schoolStageOptions.ts",
  "src/modules/business/education/services/EducationTrackingService.ts",
  "src/modules/business/education/services/EducationObservabilityService.ts",
]);

const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/;
const DIRECT_INTEGRATION_RE = /(?:from\s+["']@\/integrations\/|import\(\s*["']@\/integrations\/)/;
const DIRECT_SUPABASE_PACKAGE_RE = /@supabase\/supabase-js/;

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function isRuntimeCodeFile(filePath: string): boolean {
  const normalized = normalize(filePath);
  return (
    CODE_FILE_RE.test(normalized) &&
    !normalized.includes("/__tests__/") &&
    !normalized.includes(".test.") &&
    !normalized.includes(".spec.")
  );
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && isRuntimeCodeFile(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function main(): void {
  const fullRoot = path.join(ROOT, EDUCATION_ROOT);
  if (!fs.existsSync(fullRoot)) {
    console.error(`Education module root missing: ${EDUCATION_ROOT}`);
    process.exit(1);
  }

  const violations: string[] = [];

  for (const filePath of walk(fullRoot)) {
    const relative = normalize(path.relative(ROOT, filePath));
    const content = fs.readFileSync(filePath, "utf8");

    if (DIRECT_SUPABASE_PACKAGE_RE.test(content)) {
      violations.push(
        `${relative}: direct Supabase package import is forbidden in the Education module.`,
      );
    }

    if (DIRECT_INTEGRATION_RE.test(content)) {
      violations.push(
        `${relative}: direct integrations access is forbidden; persistence belongs to src/core/education.`,
      );
    }
  }

  for (const bridgeFile of RETIRED_CORE_BRIDGES) {
    if (fs.existsSync(path.join(ROOT, bridgeFile))) {
      violations.push(
        `${bridgeFile}: retired compatibility bridge must not be recreated. Import the canonical src/core/education owner directly.`,
      );
    }
  }

  if (violations.length > 0) {
    console.error("Education module boundary violations:\n");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log(
    "Education module boundary valid: zero direct runtime integrations; retired core bridges remain absent.",
  );
}

main();
