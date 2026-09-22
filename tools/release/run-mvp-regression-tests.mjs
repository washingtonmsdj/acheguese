#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();

const MVP_REGRESSION_FILES = [
  "tests/regression/admin-privacy-dpo-authority.test.ts",
  "tests/regression/auth-concept-flow.test.ts",
  "tests/regression/auth-confirmation-resend-turnstile.test.ts",
  "tests/regression/auth-email-change-callback.test.ts",
  "tests/regression/auth-email-confirmation-callback.test.ts",
  "tests/regression/auth-entry-session-gate.test.ts",
  "tests/regression/auth-google-oauth.test.ts",
  "tests/regression/auth-mobile-concept.test.ts",
  "tests/regression/auth-password-recovery-callback.test.ts",
  "tests/regression/auth-redirect-allowlist.test.ts",
  "tests/regression/auth-return-context.test.ts",
  "tests/regression/auth-route-ownership.test.ts",
  "tests/regression/auth-routed-callback-boundary.test.ts",
  "tests/regression/auth-url-config-ssot.test.ts",
  "tests/regression/auth/linked-providers.test.ts",
  "tests/regression/auth/logout.test.ts",
  "tests/regression/cadastro-error-surface.test.ts",
  "tests/regression/home-header-runtime-regression.test.ts",
  "tests/regression/loading/full-screen-loader-retired.test.ts",
  "tests/regression/multi-profile-session-hydration.test.ts",
  "tests/regression/profile-links-failure-semantics.test.ts",
  "tests/regression/public-home-auth-cta.test.ts",
  "tests/regression/public/first-paint-theme-fallback.test.ts",
  "tests/regression/public/root-entry-auth-marker-runtime.test.ts",
  "tests/regression/public/root-entry-font-source-boundary.test.ts",
  "tests/regression/public/root-entry-readiness-performance.test.ts",
  "tests/regression/public/search-route.test.ts",
  "tests/regression/public/shell-admin-boundary.test.ts",
  "tests/regression/public/territory-home-launch-scope.test.ts",
  "tests/regression/release/release.test.ts",
  "tests/regression/runtime-profile-read-dedup.test.ts",
  "tests/regression/security/report-rpc-authorization-batch-2.test.ts",
];

const missing = MVP_REGRESSION_FILES.filter(
  (file) => !existsSync(resolve(ROOT, file)),
);
if (missing.length > 0) {
  throw new Error(
    `MVP regression contract references missing files:\n${missing
      .map((file) => ` - ${file}`)
      .join("\n")}`,
  );
}

if (MVP_REGRESSION_FILES.length < 25) {
  throw new Error(
    `MVP regression scope unexpectedly small: ${MVP_REGRESSION_FILES.length}`,
  );
}

console.log(`MVP_REGRESSION_SCOPE files=${MVP_REGRESSION_FILES.length}`);
for (const file of MVP_REGRESSION_FILES) {
  console.log(` - ${file}`);
}

const vitestCli = resolve(ROOT, "node_modules", "vitest", "vitest.mjs");
if (!existsSync(vitestCli)) {
  throw new Error("Vitest CLI is missing. Run npm ci before regression tests.");
}

const result = spawnSync(
  process.execPath,
  [vitestCli, "--run", ...MVP_REGRESSION_FILES],
  {
    cwd: ROOT,
    env: { ...process.env, CI: process.env.CI ?? "true" },
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
