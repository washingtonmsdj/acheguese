import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const srcRoot = resolve(root, "src");
const historicalOwnerRoot = "src/core/verticals/events";
const historicalImport = "@/core/verticals/events";

const ALLOWED_HISTORICAL_EVENTS_CALLERS = new Set([
  "src/app/pages/TerritoryHomePage.tsx",
  "src/core/community/components/page/CommunityOverviewSurface.tsx",
  "src/core/landing/services/HomeDiscoveryService.ts",
]);

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

describe("Events historical owner import ratchet", () => {
  it("allows historical Events imports only in the remaining migration callers", () => {
    const actualCallers = collectSourceFiles(srcRoot)
      .map((absolutePath) =>
        relative(root, absolutePath).replaceAll("\\", "/"),
      )
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
