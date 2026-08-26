import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

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
  it("keeps tests/ root free from test implementations", () => {
    expect(rootTestFiles()).toEqual([]);
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
