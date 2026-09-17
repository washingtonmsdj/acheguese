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
  it("retires the Guide URL compatibility facade after direct migration", () => {
    expect(filesContaining("useGuideUrls")).toEqual([]);
    expect(fs.existsSync(path.join(SRC, "modules/guide/hooks/useGuideUrls.ts"))).toBe(false);
  });

  it("does not add external callers to the multi-profile Business facade", () => {
    expect(filesContaining("multi-profile/businessService")).toEqual([
      "src/core/profiles/utils/profileDomainRules.ts",
    ]);

    const multiProfileDirectory = path.join(
      SRC,
      "core/profiles/services/multi-profile",
    );
    const relativeFacadeCallers = sourceFiles(multiProfileDirectory)
      .filter((file) => fs.readFileSync(file, "utf8").includes("'./businessService'"))
      .map(relative)
      .sort();

    expect(relativeFacadeCallers).toEqual([
      "src/core/profiles/services/multi-profile/index.ts",
      "src/core/profiles/services/multi-profile/profileService.ts",
    ]);
  });

  it("keeps the temporary mobility runtime forwarding method at one UI caller", () => {
    expect(filesContaining("mobilityService.getRideWithAddresses")).toEqual([
      "src/modules/mobility/pages/BuscandoMotoristaPage.tsx",
    ]);
  });
});
