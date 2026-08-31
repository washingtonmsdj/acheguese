import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isSkippableVercelPath,
  previousCommitFetchArgs,
  shouldSkipVercelBuild,
} from "../../tools/release/vercel-ignore-build.mjs";

const ROOT = process.cwd();

describe("Vercel ignored build step", () => {
  it("is wired through the canonical Vercel project config", () => {
    const config = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));

    expect(config.ignoreCommand).toBe(
      "node tools/release/vercel-ignore-build.mjs",
    );
    expect(config.buildCommand).toBe(
      "node tools/release/run-vercel-production-build.mjs",
    );
  });

  it("skips only known non-deploy paths", () => {
    const skippable = [
      "docs/03-architecture/G5_LIVE_REVALIDATION_2026-08-30.md",
      ".github/workflows/ssot-tests.yml",
      ".kiro/specs/example/design.md",
      "tests/security/example.test.ts",
      "e2e/example.spec.ts",
      "URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md",
    ];

    for (const path of skippable) {
      expect(isSkippableVercelPath(path), path).toBe(true);
    }
    expect(shouldSkipVercelBuild(skippable)).toBe(true);
  });

  it("forces a build for runtime, build, migrations, Supabase runtime, and critical governance inputs", () => {
    const buildRequired = [
      "src/main.tsx",
      "api/example.ts",
      "public/manifest.json",
      "tools/release/run-vercel-production-build.mjs",
      "supabase/migrations/20260831040000_example.sql",
      "supabase/functions/health-check/index.ts",
      "supabase/config.toml",
      "package.json",
      "package-lock.json",
      "vercel.json",
      "docs/architecture/core-platform-ownership.json",
      "docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json",
    ];

    for (const path of buildRequired) {
      expect(isSkippableVercelPath(path), path).toBe(false);
    }
  });

  it("fails open to a real build for mixed or empty change sets", () => {
    expect(
      shouldSkipVercelBuild([
        "docs/03-architecture/checkpoint.md",
        "src/main.tsx",
      ]),
    ).toBe(false);
    expect(
      shouldSkipVercelBuild([
        "docs/03-architecture/checkpoint.md",
        "supabase/migrations/20260831040000_example.sql",
      ]),
    ).toBe(false);
    expect(shouldSkipVercelBuild([])).toBe(false);
  });

  it("preserves last-successful-deployment semantics in shallow clones", () => {
    const previousSha = "a".repeat(40);
    expect(previousCommitFetchArgs(previousSha)).toEqual([
      "fetch",
      "--no-tags",
      "--depth=1",
      "origin",
      previousSha,
    ]);

    const source = readFileSync(
      join(ROOT, "tools/release/vercel-ignore-build.mjs"),
      "utf8",
    );
    expect(source).toContain("VERCEL_GIT_PREVIOUS_SHA");
    expect(source).toContain('runGit(["cat-file", "-e"');
    expect(source).not.toContain("HEAD^");
  });
});
