import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const RETIRED_PATH = "src/app/pages/PreLaunchTerritoryMap.tsx";

function collectSourceFiles(directory: string): string[] {
  const output: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...collectSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      output.push(fullPath);
    }
  }
  return output;
}

describe("retired pre-launch territory map", () => {
  it("keeps the obsolete pre-launch map out of the runtime source tree", () => {
    expect(fs.existsSync(path.join(ROOT, RETIRED_PATH))).toBe(false);
    const sources = collectSourceFiles(path.join(ROOT, "src"));
    for (const sourcePath of sources) {
      const source = fs.readFileSync(sourcePath, "utf8");
      expect(source, sourcePath).not.toContain("PreLaunchTerritoryMap");
    }
  });
});
