import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const PERMANENT_PLAN = "URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md";
const CANONICAL_SOURCE_ROOTS = [
  "app",
  "assets",
  "config",
  "core",
  "integrations",
  "modules",
  "shared",
  "styles",
] as const;
const RETIRED_SOURCE_ROOTS = [
  "src/test",
  "src/__tests__",
  "src/types",
  "src/features",
] as const;
const RETIRED_SOURCE_FILES = [
  "src/App.css",
  "src/global.d.ts",
  "src/config/security.config.ts",
  "src/app/config/moduleSlugs.ts",
  "src/app/config/territory.ts",
] as const;
const RETIRED_ROOT_ARTIFACTS = [
  "handoff",
  "product-qa-screenshots",
  "templates",
  "e2e",
] as const;
const RETIRED_E2E_FILES = [
  "e2e/helpers/geolocation.ts",
  "tests/e2e/helpers/geolocation.ts",
  "e2e/helpers/network.ts",
  "tests/e2e/helpers/network.ts",
  "e2e/network-branches.spec.ts",
  "e2e/helpers/auth.ts",
] as const;

const CONFIG_BRIDGES = new Map([
  ["src/config/moduleSlugs.ts", "@/shared/config/moduleSlugs"],
  ["src/config/modules.ts", "@/app/config/modules"],
  ["src/config/launchScope.ts", "@/app/config/launchScope"],
  ["src/config/territory.ts", "@/core/routing/config/territory"],
  ["src/config/communityLaunch.ts", "@/core/community/config/communityLaunch"],
] as const);

const CANONICAL_CONFIG_TARGETS = [
  "src/shared/config/security.config.ts",
  "src/shared/config/reactQuery.config.ts",
  "src/shared/config/moduleSlugs.ts",
  "src/app/config/modules.ts",
  "src/app/config/launchScope.ts",
  "src/core/routing/config/territory.ts",
  "src/core/community/config/communityLaunch.ts",
  "src/core/taxonomy/categories.ts",
] as const;

const CANONICAL_SOURCE_TARGETS = [
  "src/core/maps/types/mapE2EState.d.ts",
] as const;

const CANONICAL_TOOLING_TARGETS = [
  "tools/templates/COMO_USAR_TEMPLATE.md",
  "tools/templates/module-template",
] as const;

const RETIRED_TEMPLATE_FILES = [
  "tools/templates/module-template/.eslintrc.json",
  "tools/templates/module-template/index.ts",
  "tools/templates/module-template/hooks/use[Nome].ts",
  "tools/templates/module-template/services/[nome].service.ts",
  "tools/templates/module-template/types/[nome].types.ts",
] as const;

const CANONICAL_TEMPLATE_FILES = [
  "tools/templates/module-template/core/index.ts",
  "tools/templates/module-template/core/repositories/[nome].repository.ts",
  "tools/templates/module-template/core/services/[nome].service.ts",
  "tools/templates/module-template/core/types/[nome].types.ts",
  "tools/templates/module-template/module/index.ts",
  "tools/templates/module-template/module/hooks/use[Nome].ts",
] as const;

const CANONICAL_E2E_TARGETS = [
  "tests/e2e/helpers/auth.ts",
  "tests/e2e/network-branches.spec.ts",
] as const;

const ARCHIVED_ROOT_ARTIFACT_TARGETS = [
  "docs/08-roadmap/handoff/CP-016_MEDIA_ASSET_CONTINUATION.md",
  "docs/08-roadmap/handoff/README.md",
  "docs/10-archive/root-legacy/PRODUCT-QA.md",
  "docs/10-archive/root-legacy/product-qa-screenshots",
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

function listFilesRecursively(relativePath: string): string[] {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return [];

  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absoluteEntry = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absoluteEntry);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!/\.(?:[cm]?[jt]sx?)$/.test(entry.name)) continue;
      files.push(path.relative(ROOT, absoluteEntry).split(path.sep).join("/"));
    }
  };

  visit(absolutePath);
  return files.sort();
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

  it("freezes top-level src directories to the canonical architecture taxonomy", () => {
    expect(listDirectories("src")).toEqual([...CANONICAL_SOURCE_ROOTS].sort());
  });

  it("does not recreate retired generic source roots", () => {
    for (const relativePath of RETIRED_SOURCE_ROOTS) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(false);
    }
  });

  it("does not recreate retired source files", () => {
    for (const relativePath of RETIRED_SOURCE_FILES) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(false);
    }
  });

  it("keeps migrated source files under canonical owners", () => {
    for (const relativePath of CANONICAL_SOURCE_TARGETS) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps migrated tooling under canonical owners", () => {
    for (const relativePath of CANONICAL_TOOLING_TARGETS) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps the module template aligned with core/module boundaries", () => {
    for (const relativePath of RETIRED_TEMPLATE_FILES) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(false);
    }

    for (const relativePath of CANONICAL_TEMPLATE_FILES) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(true);
    }

    const moduleFiles = listFilesRecursively("tools/templates/module-template/module");
    expect(moduleFiles.some((relativePath) => relativePath.includes("/services/"))).toBe(false);

    for (const relativePath of moduleFiles) {
      const content = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
      expect(content).not.toMatch(/from\s+["']@\/integrations\//);
      expect(content).not.toMatch(/import\s+.*supabase/i);
      expect(content).not.toContain("@/lib/supabase");
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

  it("does not recreate retired E2E compatibility files", () => {
    for (const relativePath of RETIRED_E2E_FILES) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(false);
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
      "territory.ts",
    ]);
  });

  it("keeps E2E helpers and specs under the canonical tests/e2e owner", () => {
    expect(fs.existsSync(path.join(ROOT, "e2e"))).toBe(false);

    for (const relativePath of CANONICAL_E2E_TARGETS) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(true);
    }
  });
});
