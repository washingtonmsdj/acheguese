import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const PERMANENT_PLAN = "URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md";
const LEGACY_FEATURE_ROOTS = ["events"] as const;
const RETIRED_SOURCE_ROOTS = ["src/test", "src/__tests__", "src/types"] as const;

const CONFIG_BRIDGES = new Map([
  ["src/config/security.config.ts", "@/shared/config/security.config"],
  ["src/config/reactQuery.config.ts", "@/shared/config/reactQuery.config"],
  ["src/config/moduleSlugs.ts", "@/app/config/moduleSlugs"],
  ["src/config/modules.ts", "@/app/config/modules"],
  ["src/config/launchScope.ts", "@/app/config/launchScope"],
  ["src/config/territory.ts", "@/app/config/territory"],
  ["src/config/communityLaunch.ts", "@/core/community/config/communityLaunch"],
] as const);

const CANONICAL_CONFIG_TARGETS = [
  "src/shared/config/security.config.ts",
  "src/shared/config/reactQuery.config.ts",
  "src/app/config/moduleSlugs.ts",
  "src/app/config/modules.ts",
  "src/app/config/launchScope.ts",
  "src/app/config/territory.ts",
  "src/core/community/config/communityLaunch.ts",
] as const;

function listDirectories(relativePath: string): string[] {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return [];

  return fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listFiles(relativePath: string): string[] {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return [];

  return fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
}

describe("global repository reorganization contract", () => {
  it("keeps the urgent architecture plan permanently at repository root", () => {
    const planPath = path.join(ROOT, PERMANENT_PLAN);
    expect(fs.existsSync(planPath)).toBe(true);

    const content = fs.readFileSync(planPath, "utf8");
    expect(content).toContain("ARQUIVO PERMANENTE DA RAIZ");
    expect(content).toContain("NÃO MOVA ESTE ARQUIVO");
    expect(content).toContain("G0 — Repository Census");
    expect(content).toContain("G7 — Repository / MVP Certification");
  });

  it("does not recreate retired generic source roots", () => {
    for (const relativePath of RETIRED_SOURCE_ROOTS) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(false);
    }
  });

  it("ratchets src/features to the single known legacy owner during migration", () => {
    expect(listDirectories("src/features")).toEqual([...LEGACY_FEATURE_ROOTS]);
  });

  it("keeps the canonical Events product destination present before the physical move", () => {
    expect(fs.existsSync(path.join(ROOT, "src/modules/community-events"))).toBe(true);
  });

  it("keeps migrated config implementations under canonical owners", () => {
    for (const relativePath of CANONICAL_CONFIG_TARGETS) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps legacy src/config paths as one-way compatibility bridges", () => {
    for (const [bridgeFile, canonicalImport] of CONFIG_BRIDGES) {
      const absolutePath = path.join(ROOT, bridgeFile);
      expect(fs.existsSync(absolutePath), bridgeFile).toBe(true);

      const content = fs.readFileSync(absolutePath, "utf8");
      expect(content).toContain("Compatibility bridge");
      expect(content).toContain(canonicalImport);
    }
  });

  it("freezes src/config to the known taxonomy debt plus compatibility bridges", () => {
    expect(listFiles("src/config")).toEqual([
      "categories.ts",
      "communityLaunch.ts",
      "launchScope.ts",
      "moduleSlugs.ts",
      "modules.ts",
      "reactQuery.config.ts",
      "security.config.ts",
      "territory.ts",
    ]);
  });
});
