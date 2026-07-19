import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ALPHA_OPERATIONAL_TESTS = [
  "tests/operational/ai-search-runtime.test.ts",
  "tests/operational/posts-territorial-feed-runtime.test.ts",
  "tests/operational/pricing-service-runtime.test.ts",
  "tests/operational/private-alpha-access-runtime.test.ts",
  "tests/operational/professional-review-authz-runtime.test.ts",
  "tests/operational/rls-posts-auth-flow.test.ts",
  "tests/operational/tourist-points-service-runtime.test.ts",
  "tests/operational/tourist-points-territory-runtime.test.ts",
];

const suite = process.argv[2] ?? "alpha";
if (suite !== "alpha") {
  console.error(`Suite operacional desconhecida: ${suite}.`);
  process.exit(1);
}

const vitestEntry = resolve("node_modules/vitest/vitest.mjs");
const result = spawnSync(
  process.execPath,
  [vitestEntry, "--run", "--mode", "operational", ...ALPHA_OPERATIONAL_TESTS],
  {
    env: {
      ...process.env,
      RUN_ALPHA_ACCESS_REAL_TESTS: "1",
      RUN_PROFESSIONAL_REVIEW_REAL_TESTS: "1",
      RUN_RLS_REAL_TESTS: "1",
    },
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
