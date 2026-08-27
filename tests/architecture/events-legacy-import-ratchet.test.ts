import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const srcRoot = resolve(root, "src");
const historicalOwnerRoot = "src/core/verticals/events";
const historicalImport = "@/core/verticals/events";

const ALLOWED_HISTORICAL_EVENTS_CALLERS = new Set<string>();

function collectSourceFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(absolutePath));
      continue;
    }

    if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files;
}

function isRuntimeSource(path: string): boolean {
  return (
    !path.includes("/__tests__/") &&
    !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path)
  );
}

describe("Events historical owner runtime import ratchet", () => {
  it("keeps the historical Events owner physically retired", () => {
    expect(existsSync(resolve(root, historicalOwnerRoot))).toBe(false);
  });

  it("allows historical Events imports only in the remaining runtime migration callers", () => {
    const actualCallers = collectSourceFiles(srcRoot)
      .map((absolutePath) =>
        relative(root, absolutePath).replaceAll("\\", "/"),
      )
      .filter(isRuntimeSource)
      .filter((path) => !path.startsWith(`${historicalOwnerRoot}/`))
      .filter((path) =>
        readFileSync(resolve(root, path), "utf8").includes(historicalImport),
      )
      .sort();

    expect(actualCallers).toEqual(
      [...ALLOWED_HISTORICAL_EVENTS_CALLERS].sort(),
    );
  });
});
