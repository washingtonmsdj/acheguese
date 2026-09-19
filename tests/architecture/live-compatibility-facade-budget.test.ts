import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    if (!/\.(ts|tsx)$/.test(entry.name)) return [];
    return [fullPath];
  });
}

function relative(file: string): string {
  return path.relative(ROOT, file).replaceAll("\\", "/");
}

function filesContaining(pattern: string): string[] {
  return sourceFiles(SRC)
    .filter((file) => fs.readFileSync(file, "utf8").includes(pattern))
    .map(relative)
    .sort();
}

describe("remaining compatibility facade caller budget", () => {
  it("keeps the paused Mobility runtime forwarding method at one UI caller", () => {
    expect(filesContaining("mobilityService.getRideWithAddresses")).toEqual([
      "src/modules/mobility/pages/BuscandoMotoristaPage.tsx",
    ]);
  });
});
