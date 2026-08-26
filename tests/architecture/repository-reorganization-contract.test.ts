import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const PERMANENT_PLAN = "URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md";
const RETIRED_SOURCE_ROOTS = [
  "src/test",
  "src/__tests__",
  "src/types",
  "src/features",
] as const;
const RETIRED_ROOT_ARTIFACTS = ["handoff", "product-qa-screenshots"] as const;

const CONFIG_BRIDGES = new Map([
  ["src/config/security.config.ts", "@/shared/config/security.config"],
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
  "src/core/taxonomy/categories.ts",
] as const;

const LEGACY_E2E_BRIDGES = new Map([
  ["e2e/helpers/auth.ts", "tests/e2e/helpers/auth"],
  ["e2e/helpers/geolocation.ts", "tests/e2e/helpers/geolocation"],
  ["e2e/helpers/network.ts", "tests/e2e/helpers/network"],
  ["e2e/network-branches.spec.ts", "tests/e2e/network-branches.spec"],
] as const);

const CANONICAL_E2E_TARGETS = [
  "tests/e2e/helpers/auth.ts",
  "tests/e2e/helpers/geolocation.ts",
  "tests/e2e/helpers/network.ts",
  "tests/e2e/network-branches.spec.ts",
] as const;

const ARCHIVED_ROOT_ARTIFACT_TARGETS = [
  "docs/08-roadmap/handoff/CP-016_MEDIA_ASSET_CONTINUATION.md",
  "docs/08-roadmap/handoff/README.md",
  "docs/10-archive/root-legacy/PRODUCT-QA.md",
  "docs/10-archive/root-legacy/product-qa-screenshots",
] as const;

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

  it("does not recreate retired root artifact directories", () => {
    for (const relativePath of RETIRED_ROOT_ARTIFACTS) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(false);
    }

    for (const relativePath of ARCHIVED_ROOT_ARTIFACT_TARGETS) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps Events implemented under the canonical community module owner", () => {
    expect(fs.existsSync(path.join(ROOT, "src/modules/community-events"))).toBe(true);
    expect(
      fs.existsSync(
        path.join(ROOT, "src/modules/community-events/pages/EventsListPage.tsx"),
      ),
    ).toBe(true);
    expect(fs.existsSync(path.join(ROOT, "src/features"))).toBe(false);
  });

  it("keeps migrated config implementations under canonical owners", () => {
    for (const relativePath of CANONICAL_CONFIG_TARGETS) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps remaining legacy src/config paths as one-way compatibility bridges", () => {
    for (const [bridgeFile, canonicalImport] of CONFIG_BRIDGES) {
      const absolutePath = path.join(ROOT, bridgeFile);
      expect(fs.existsSync(absolutePath), bridgeFile).toBe(true);

      const content = fs.readFileSync(absolutePath, "utf8");
      expect(content).toContain("Compatibility bridge");
      expect(content).toContain(canonicalImport);
      expect(content.length, `${bridgeFile} must stay bridge-sized`).toBeLessThan(512);
    }
  });

  it("freezes src/config to the remaining compatibility bridges only", () => {
    expect(listFiles("src/config")).toEqual([
      "communityLaunch.ts",
      "launchScope.ts",
      "moduleSlugs.ts",
      "modules.ts",
      "security.config.ts",
      "territory.ts",
    ]);
  });

  it("keeps legacy root e2e files as compatibility bridges only", () => {
    for (const relativePath of CANONICAL_E2E_TARGETS) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(true);
    }

    for (const [bridgeFile, canonicalTarget] of LEGACY_E2E_BRIDGES) {
      const absolutePath = path.join(ROOT, bridgeFile);
      expect(fs.existsSync(absolutePath), bridgeFile).toBe(true);

      const content = fs.readFileSync(absolutePath, "utf8");
      expect(content).toContain(canonicalTarget);
      expect(content.length, `${bridgeFile} must stay bridge-sized`).toBeLessThan(256);
      expect(content).not.toContain("test.describe(");
      expect(content).not.toContain("dotenv.config(");
    }
  });
});
