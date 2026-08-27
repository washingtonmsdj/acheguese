import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const srcRoot = resolve(root, "src");
const legacyImport = "@/config/communityLaunch";
const legacyBridge = "src/config/communityLaunch.ts";

const ALLOWED_LEGACY_CALLERS = new Set([
  "src/app/pages/TerritoryEntryPage.tsx",
  "src/app/pages/TerritoryHomePage.tsx",
  "src/core/community/pages/ComunidadePage.tsx",
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

describe("communityLaunch legacy config import ratchet", () => {
  it("allows the legacy bridge only in the three remaining runtime callers", () => {
    const callers = collectSourceFiles(srcRoot)
      .map((absolutePath) => relative(root, absolutePath).replaceAll("\\", "/"))
      .filter((path) => path !== legacyBridge)
      .filter((path) => readFileSync(resolve(root, path), "utf8").includes(legacyImport))
      .sort();

    expect(callers).toEqual([...ALLOWED_LEGACY_CALLERS].sort());
  });
});
