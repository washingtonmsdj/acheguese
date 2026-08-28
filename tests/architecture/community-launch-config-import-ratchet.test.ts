import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const srcRoot = resolve(root, "src");
const legacyImport = "@/config/communityLaunch";
const legacyBridge = "src/config/communityLaunch.ts";
const canonicalImport = "@/core/community/config/communityLaunch";

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
  it("keeps communityLaunch on the canonical core owner and forbids bridge recreation", () => {
    expect(existsSync(resolve(root, legacyBridge))).toBe(false);

    const callers = collectSourceFiles(srcRoot)
      .map((absolutePath) => relative(root, absolutePath).replaceAll("\\", "/"))
      .filter((path) => readFileSync(resolve(root, path), "utf8").includes(legacyImport))
      .sort();

    expect(callers).toEqual([]);

    const comunidadePage = readFileSync(
      resolve(root, "src/core/community/pages/ComunidadePage.tsx"),
      "utf8",
    );
    expect(comunidadePage).toContain(canonicalImport);
  });
});
