#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(
  npx,
  [
    "playwright",
    "test",
    "tests/e2e/education-lifecycle-authenticated.spec.ts",
    "--project=chromium",
    "--reporter=list",
    "--retries=0",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      E2E_EDUCATION_LIFECYCLE_AUTHENTICATED: "true",
    },
  },
);

if (result.error) {
  console.error(
    "[education-lifecycle-authenticated] failed to start Playwright:",
    result.error,
  );
  process.exit(1);
}

process.exit(result.status ?? 1);
