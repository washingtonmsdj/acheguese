#!/usr/bin/env node

import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve, relative } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const TEST_FILE_RE = /\.(?:test|spec)\.(?:ts|tsx|js|jsx|mjs|cjs)$/;

const ACTIVE_OWNER_ROOTS = [
  "src/app/config",
  "src/app/features/onboarding",
  "src/core/auth",
  "src/core/session",
  "src/core/business",
  "src/core/maps",
  "src/core/nearby",
  "src/core/search",
  "src/core/location",
  "src/core/privacy",
];

const EXPLICIT_MVP_CONTRACTS = [
  "src/app/pages/__tests__/BuscaPage.spec.tsx",
  "src/core/routing/seo/__tests__/generateSitemap.spec.ts",
  "tests/architecture/mvp-core-module-boundary.test.ts",
  "tests/architecture/map-business-bounded-read.test.ts",
  "tests/architecture/nearby-proximity-truthfulness.test.ts",
  "tests/architecture/business-mvp-public-flow.test.ts",
  "tests/architecture/production-sitemap-release-boundary.test.ts",
  "tests/architecture/territory-home-owner.test.ts",
  "tests/architecture/launch-scope-e2e-alignment.test.ts",
  "tests/architecture/auth-session-authority.test.ts",
  "tests/architecture/session-ssot-ownership.test.ts",
  "tests/architecture/business-management-authority-ssot.test.ts",
  "tests/architecture/business-service-canonical-owner.test.ts",
  "tests/architecture/business-spatial-read-model.test.ts",
  "tests/architecture/business-discovery-launch-boundary.test.ts",
  "tests/architecture/geolocation-ssot-boundary.test.ts",
  "tests/regression/public/search-route.test.ts",
  "tests/release/vercel-ignore-build.test.mjs",
  "tests/release/release-identity.test.mjs",
  "tests/security/lgpd-purge-policy-security.test.ts",
  "tests/security/account-operational-edge-policy.test.ts",
  "tests/security/session-rpc-auth-authority-security.test.ts",
  "tests/security/account-password-reauthentication.test.ts",
  "tests/security/auth-google-oauth-readiness.test.ts",
  "tests/security/business-data-grants-security.test.ts",
  "tests/security/business-claims-owner-security.test.ts",
  "tests/security/maplibre-runtime-security.test.ts",
];

function normalize(path) {
  return path.replace(/\\/g, "/");
}

function collectTests(relativeRoot) {
  const absoluteRoot = resolve(ROOT, relativeRoot);
  if (!existsSync(absoluteRoot)) {
    throw new Error(`Active MVP test root is missing: ${relativeRoot}`);
  }

  const discovered = [];
  const stack = [absoluteRoot];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = resolve(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      if (entry.isFile() && TEST_FILE_RE.test(entry.name)) {
        discovered.push(normalize(relative(ROOT, absolute)));
      }
    }
  }

  return discovered;
}

const testFiles = new Set();
for (const root of ACTIVE_OWNER_ROOTS) {
  for (const testFile of collectTests(root)) {
    testFiles.add(testFile);
  }
}

for (const testFile of EXPLICIT_MVP_CONTRACTS) {
  const absolute = resolve(ROOT, testFile);
  if (!existsSync(absolute) || !statSync(absolute).isFile()) {
    throw new Error(`Explicit MVP contract is missing: ${testFile}`);
  }
  testFiles.add(testFile);
}

const orderedTests = [...testFiles].sort();
if (orderedTests.length < 30) {
  throw new Error(
    `MVP unit scope unexpectedly small (${orderedTests.length} tests files). Refusing a weak release gate.`,
  );
}

console.log(`MVP_UNIT_SCOPE files=${orderedTests.length}`);
for (const testFile of orderedTests) {
  console.log(` - ${testFile}`);
}

const vitestCli = resolve(ROOT, "node_modules", "vitest", "vitest.mjs");
if (!existsSync(vitestCli)) {
  throw new Error("Vitest CLI is missing. Run npm ci before the MVP unit gate.");
}

const result = spawnSync(
  process.execPath,
  [vitestCli, "--run", ...orderedTests],
  {
    cwd: ROOT,
    env: { ...process.env, CI: process.env.CI ?? "true" },
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
