#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BUSINESS_ROOT = "src/modules/business";
const BUSINESS_CREATE_HOOK = "src/modules/business/hooks/useBusinessCreateMultiProfile.ts";

const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/;
const TYPE_ONLY_IMPORT_RE = /import\s+type\s+[\s\S]*?from\s+["'][^"']+["'];?/g;
const DIRECT_INTEGRATION_RE = /(?:from\s+["']@\/integrations\/|import\(\s*["']@\/integrations\/)/;
const DIRECT_SUPABASE_PACKAGE_RE = /(?:from\s+["']@supabase\/supabase-js["']|import\(\s*["']@supabase\/supabase-js["']\s*\))/;

const RETIRED_PUBLIC_SNAPSHOT_BRIDGES = [
  "src/modules/business/public/types/publicSnapshots.ts",
  "src/modules/business/public/services/PublicSnapshotRpcService.ts",
] as const;

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function isRuntimeCodeFile(filePath: string): boolean {
  const normalized = normalize(filePath);
  return CODE_FILE_RE.test(normalized)
    && !normalized.includes("/__tests__/")
    && !normalized.includes(".test.")
    && !normalized.includes(".spec.");
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && isRuntimeCodeFile(fullPath)) files.push(fullPath);
  }
  return files;
}

function withoutTypeOnlyImports(content: string): string {
  return content.replace(TYPE_ONLY_IMPORT_RE, "");
}

function main(): void {
  const root = path.join(ROOT, BUSINESS_ROOT);
  if (!fs.existsSync(root)) {
    console.error(`Business module root missing: ${BUSINESS_ROOT}`);
    process.exit(1);
  }

  const violations: string[] = [];

  for (const filePath of walk(root)) {
    const relative = normalize(path.relative(ROOT, filePath));
    const content = fs.readFileSync(filePath, "utf8");
    const runtimeContent = withoutTypeOnlyImports(content);

    if (DIRECT_SUPABASE_PACKAGE_RE.test(runtimeContent)) {
      violations.push(
        `${relative}: direct runtime @supabase/supabase-js access is forbidden in src/modules/business. Move infrastructure ownership to core.`,
      );
    }

    if (DIRECT_INTEGRATION_RE.test(runtimeContent)) {
      violations.push(
        `${relative}: direct runtime @/integrations/* access is forbidden in src/modules/business. Move infrastructure ownership to core.`,
      );
    }
  }

  const createHookPath = path.join(ROOT, BUSINESS_CREATE_HOOK);
  if (!fs.existsSync(createHookPath)) {
    violations.push(`${BUSINESS_CREATE_HOOK}: compatibility create hook is missing.`);
  } else {
    const createHook = fs.readFileSync(createHookPath, "utf8");
    if (!createHook.includes("BusinessService.createBusiness(")) {
      violations.push(
        `${BUSINESS_CREATE_HOOK}: business creation must delegate to BusinessService.createBusiness().`,
      );
    }
    if (createHook.includes("MultiProfileService")) {
      violations.push(
        `${BUSINESS_CREATE_HOOK}: parallel profile-first business creation via MultiProfileService is retired.`,
      );
    }
    if (/\.createProfile\s*\(/.test(createHook)) {
      violations.push(
        `${BUSINESS_CREATE_HOOK}: module-level profile creation is forbidden; BusinessService owns the create orchestration.`,
      );
    }
  }

  for (const retiredBridge of RETIRED_PUBLIC_SNAPSHOT_BRIDGES) {
    if (fs.existsSync(path.join(ROOT, retiredBridge))) {
      violations.push(`${retiredBridge}: retired compatibility bridge was recreated.`);
    }
  }

  if (violations.length > 0) {
    console.error("Business module boundary violations:\n");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log(
    "Business module boundary valid: zero direct runtime integration access; BusinessService remains the single create authority; retired public snapshot bridges remain absent.",
  );
}

main();
