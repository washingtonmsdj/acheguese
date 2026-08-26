#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EDUCATION_ROOT = "src/modules/business/education";

// Zero is the architectural target and current baseline. Any new runtime
// direct integration from the module is a regression.
const ALLOWED_DIRECT_INTEGRATION_FILES = new Set<string>();

const REQUIRED_CORE_BRIDGES = new Map([
  [
    "src/modules/business/education/services/education.queries.ts",
    "@/core/education/services/education.queries",
  ],
  [
    "src/modules/business/education/services/education.mutations.ts",
    "@/core/education/services/education.mutations",
  ],
  [
    "src/modules/business/education/constants/schoolStageOptions.ts",
    "@/core/education/constants/schoolStageOptions",
  ],
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
  const actualDirectIntegrationFiles = new Set<string>();

  for (const filePath of walk(fullRoot)) {
    const relative = normalize(path.relative(ROOT, filePath));
    const content = fs.readFileSync(filePath, "utf8");

    if (DIRECT_SUPABASE_PACKAGE_RE.test(content)) {
      violations.push(
        `${relative}: direct Supabase package import is forbidden in the Education module.`,
      );
    }

    if (DIRECT_INTEGRATION_RE.test(content)) {
      actualDirectIntegrationFiles.add(relative);
      if (!ALLOWED_DIRECT_INTEGRATION_FILES.has(relative)) {
        violations.push(
          `${relative}: direct integrations access is forbidden; persistence belongs to src/core/education.`,
        );
      }
    }
  }

  for (const legacyFile of ALLOWED_DIRECT_INTEGRATION_FILES) {
    if (!actualDirectIntegrationFiles.has(legacyFile)) {
      violations.push(
        `${legacyFile}: transitional allowlist entry is stale and must be removed in the same migration commit.`,
      );
    }
  }

  for (const [bridgeFile, canonicalImport] of REQUIRED_CORE_BRIDGES) {
    const absolute = path.join(ROOT, bridgeFile);
    if (!fs.existsSync(absolute)) {
      violations.push(`${bridgeFile}: required compatibility bridge is missing.`);
      continue;
    }

    const content = fs.readFileSync(absolute, "utf8");
    if (!content.includes(canonicalImport)) {
      violations.push(
        `${bridgeFile}: compatibility bridge must point one-way to ${canonicalImport}.`,
      );
    }
  }

  if (violations.length > 0) {
    console.error("Education module boundary violations:\n");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log(
    "Education module boundary valid: zero direct runtime integrations; canonical read/write/constants bridges enforced.",
  );
}

main();
