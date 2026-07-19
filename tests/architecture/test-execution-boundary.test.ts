import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  getOperationalTargetIssues,
  OPERATIONAL_TEST_CONFIRMATION,
} from "../helpers/operational-env";

const root = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

describe("test execution boundary", () => {
  it("keeps deterministic and remote operational suites in separate runners", () => {
    const config = read("vitest.config.ts");
    const scripts = JSON.parse(read("package.json")).scripts as Record<
      string,
      string
    >;

    expect(config).toMatch(/mode === ["']operational["']/);
    expect(config).toMatch(/loadEnv\(["']example["']/);
    expect(config).toContain("const OPERATIONAL_ENV_KEYS = [");
    expect(config).toContain(
      "isOperational ? loadOperationalTestEnv(mode) : {}",
    );
    expect(config).toContain('"SUPABASE_SERVICE_ROLE_KEY"');
    expect(config).toContain('"OPERATIONAL_TEST_CONFIRM"');
    expect(config).toMatch(
      /include: \[["']tests\/operational\/\*\*\/\*\.test\.ts["']\]/,
    );
    expect(config).toMatch(
      /isOperational \? \[\] : \[["']tests\/operational\/\*\*["']\]/,
    );
    expect(config).toMatch(
      /["']\.\/tests\/helpers\/deterministic-network-guard\.ts["']/,
    );
    expect(config).toMatch(
      /globalSetup: \[["']\.\/tests\/helpers\/operational-suite-setup\.ts["']\]/,
    );
    expect(config).toContain("fileParallelism: !isOperational");
    expect(config).toContain(
      "maxWorkers: isOperational ? 1 : deterministicMaxWorkers",
    );
    expect(scripts.test).toBe("vitest --run");
    expect(scripts["test:operational"]).toBe(
      "node scripts/run-operational-suite.mjs alpha",
    );
    expect(scripts["test:operational:all"]).toBe(
      "vitest --run --mode operational",
    );
    expect(scripts["test:all"]).toBeUndefined();
  });

  it("keeps the release operational suite scoped to active alpha surfaces", () => {
    const runner = read("scripts/run-operational-suite.mjs");

    expect(runner).toContain("private-alpha-access-runtime.test.ts");
    expect(runner).toContain("professional-review-authz-runtime.test.ts");
    expect(runner).toContain("rls-posts-auth-flow.test.ts");
    expect(runner).toContain("posts-territorial-feed-runtime.test.ts");
    expect(runner).not.toMatch(/gate[2-7]-/i);
  });

  it("accepts only an explicitly declared local or non-production remote target", () => {
    expect(
      getOperationalTargetIssues({
        confirmation: OPERATIONAL_TEST_CONFIRMATION,
        projectRef: "developmentref",
        supabaseUrl: "https://developmentref.supabase.co",
        target: "development",
      }),
    ).toEqual([]);
    expect(
      getOperationalTargetIssues({
        supabaseUrl: "http://127.0.0.1:54321",
        target: "local",
      }),
    ).toEqual([]);

    expect(
      getOperationalTargetIssues({
        confirmation: OPERATIONAL_TEST_CONFIRMATION,
        projectRef: "stagingref",
        supabaseUrl: "https://productionref.supabase.co",
        target: "staging",
      }),
    ).toContain(
      "VITE_SUPABASE_URL must match the explicitly declared non-production project ref",
    );
    expect(
      getOperationalTargetIssues({
        supabaseUrl: "https://productionref.supabase.co",
        target: "production",
      }),
    ).toContain("OPERATIONAL_TEST_TARGET (development, staging or local)");
  });

  it("never resets credentials of users discovered in a remote environment", () => {
    const authHelper = read("tests/helpers/auth-helper.ts");
    const educationSetup = read("tests/helpers/education-setup.ts");

    expect(authHelper).not.toContain("updateUserById");
    expect(authHelper).not.toContain("TestPass123");
    expect(authHelper).toContain("type: 'magiclink'");
    expect(authHelper).toContain("authenticateAsConfiguredAdminProfile");
    expect(educationSetup).not.toContain("updateUserById");
    expect(educationSetup).not.toContain("TestPass123");
  });

  it("centralizes operational Admin Auth mutations in the fixture helper", () => {
    const allowedPath = "tests/helpers/operational-auth-fixture.ts";
    const violations: string[] = [];

    const visit = (directory: string): void => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          visit(absolutePath);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name)) continue;

        const relativePath = path
          .relative(root, absolutePath)
          .replaceAll("\\", "/");
        if (relativePath === allowedPath) continue;

        const source = fs.readFileSync(absolutePath, "utf8");
        if (/auth\.admin\.(createUser|deleteUser)\s*\(/.test(source)) {
          violations.push(relativePath);
        }
      }
    };

    visit(path.join(root, "tests"));
    expect(violations).toEqual([]);
  });

  it("keeps runtime tests outside deterministic source suites", () => {
    expect(
      fs.existsSync(
        path.join(
          root,
          "src/core/pricing/__tests__/PricingService.runtime.test.ts",
        ),
      ),
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(root, "tests/operational/pricing-service-runtime.test.ts"),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(root, "tests/operational/ai-search-runtime.test.ts"),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          root,
          "tests/operational/tourist-points-service-runtime.test.ts",
        ),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(root, "src/core/mobility/core/RideStateMachine.test.ts"),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          root,
          "src/core/mobility/types/FailedDeliveryMetadata.test.ts",
        ),
      ),
    ).toBe(true);
  });

  it("requires deterministic tests with direct Supabase calls to mock that boundary", () => {
    const testRoots = ["src", "tests"];
    const violations: string[] = [];
    const visit = (directory: string): void => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolutePath = path.join(directory, entry.name);
        const relativePath = path
          .relative(root, absolutePath)
          .replaceAll("\\", "/");
        if (entry.isDirectory()) {
          if (
            relativePath === "tests/operational" ||
            relativePath === "tests/e2e"
          )
            continue;
          visit(absolutePath);
          continue;
        }
        if (!/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) continue;

        const source = fs.readFileSync(absolutePath, "utf8");
        const importsSupabase =
          /from\s+['"][^'"]*integrations\/supabase['"]/.test(source);
        const callsSupabase =
          /\.(from|rpc)\s*\(|\.functions\.invoke|\.auth\./.test(source);
        const mocksSupabase =
          /vi\.mock\s*\([\s\S]{0,160}integrations\/supabase/.test(source);
        if (importsSupabase && callsSupabase && !mocksSupabase)
          violations.push(relativePath);
      }
    };

    for (const testRoot of testRoots) visit(path.join(root, testRoot));
    expect(violations).toEqual([]);
  });
});
