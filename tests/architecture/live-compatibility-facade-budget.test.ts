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

describe("runtime compatibility facade budget", () => {
  it("keeps runtime compatibility forwarding facades at zero", () => {
    expect(filesContaining("mobilityService.getRideWithAddresses")).toEqual([]);

    const runtime = fs.readFileSync(
      path.join(ROOT, "src/core/mobility/services/MobilityRuntimeService.ts"),
      "utf8",
    );
    const searchPage = fs.readFileSync(
      path.join(ROOT, "src/modules/mobility/pages/BuscandoMotoristaPage.tsx"),
      "utf8",
    );

    expect(runtime).not.toContain("getRideWithAddresses(");
    expect(searchPage).toContain(
      '@/core/mobility/services/mobility.ride-read-queries',
    );
    expect(searchPage).toContain("getRideWithAddresses(rideId!)");
  });
});
