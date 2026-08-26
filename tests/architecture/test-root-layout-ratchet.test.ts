import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ALLOWED_LEGACY_ROOT_TESTS = new Set([
  "mobility-integration.test.ts",
]);

const CANONICAL_TEST_DIRECTORIES = [
  "architecture",
  "e2e",
  "integration",
  "operational",
  "regression",
  "security",
] as const;

function rootTestFiles(): string[] {
  return readdirSync("tests", { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort();
}

describe("tests root layout ratchet", () => {
  it("does not allow new test implementations at tests/ root", () => {
    const unexpected = rootTestFiles().filter(
      (file) => !ALLOWED_LEGACY_ROOT_TESTS.has(file),
    );

    expect(unexpected).toEqual([]);
  });

  it("keeps the remaining legacy root debt explicit", () => {
    expect(rootTestFiles()).toEqual(["mobility-integration.test.ts"]);
  });

  it("keeps canonical responsibility directories present", () => {
    const directories = new Set(
      readdirSync("tests", { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name),
    );

    for (const directory of CANONICAL_TEST_DIRECTORIES) {
      expect(directories.has(directory), `${directory}/ must exist`).toBe(true);
    }
  });
});
