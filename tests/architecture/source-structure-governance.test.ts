import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function listDirectories(relativePath: string): string[] {
  const absolute = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolute)) return [];

  return fs
    .readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listFiles(relativePath: string): string[] {
  const absolute = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolute)) return [];

  return fs
    .readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
}

function listSourceFilesRecursively(relativePath: string): string[] {
  const absolute = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolute)) return [];

  const files: string[] = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFilesRecursively(child));
      continue;
    }

    if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) {
      files.push(child.replaceAll(path.sep, "/"));
    }
  }

  return files.sort();
}

function parseVerticalKeys(): string[] {
  const config = read("src/core/verticals/config.ts");
  const match = config.match(/VERTICAL_KEYS[^=]*=\s*\[([^\]]*)\]/m);
  if (!match) return [];

  return Array.from(match[1].matchAll(/["']([^"']+)["']/g)).map(
    (entry) => entry[1],
  );
}

describe("source structure governance", () => {
  it("freezes the top-level src directory taxonomy", () => {
    expect(listDirectories("src")).toEqual([
      "app",
      "assets",
      "config",
      "core",
      "features",
      "integrations",
      "modules",
      "shared",
      "styles",
      "test",
    ]);
  });

  it("does not allow new top-level domains under legacy src/features", () => {
    const roots = listDirectories("src/features");
    const allowedLegacyRoots = new Set(["events"]);
    const unexpected = roots.filter((root) => !allowedLegacyRoots.has(root));

    expect(unexpected).toEqual([]);
  });

  it("documents src/features as migration-only and points to canonical owners", () => {
    const legacyReadme = read("src/features/README.md");
    const modulesReadme = read("src/modules/README.md");

    expect(legacyReadme).toContain("closed for new code");
    expect(legacyReadme).toContain("src/modules/community-events");
    expect(modulesReadme).toContain("`src/features` **não é um namespace canônico**");
    expect(modulesReadme).toContain("src/app/features");
    expect(modulesReadme).toContain("src/integrations");
    expect(modulesReadme).toContain("src/assets");
    expect(modulesReadme).toContain("src/styles");
  });

  it("does not advertise phantom top-level component/service/hook aliases", () => {
    const rootConfig = read("tsconfig.json");
    const appConfig = read("tsconfig.app.json");
    const viteConfig = read("vite.config.ts");

    for (const config of [rootConfig, appConfig, viteConfig]) {
      expect(config).not.toContain("./src/components");
      expect(config).not.toContain("./src/services");
      expect(config).not.toContain("./src/hooks");
    }
  });

  it("requires a real canonical public API for the Events migration", () => {
    const moduleIndex = read("src/modules/community-events/index.ts");
    const moduleReadme = read("src/modules/community-events/README.md");

    expect(moduleIndex.trim()).not.toBe("export {};");
    expect(moduleIndex).toContain("EventsListPage");
    expect(moduleIndex).toContain("EventDetailPage");
    expect(moduleReadme).toContain("src/modules/community-events/index.ts");
    expect(moduleReadme).toContain("src/features/events");
  });

  it("keeps legacy Events source shim-only and the canonical module independent from it", () => {
    const legacyFiles = listSourceFilesRecursively("src/features/events");
    expect(legacyFiles.length).toBeGreaterThan(0);

    for (const file of legacyFiles) {
      const source = read(file);
      const nonEmptyLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(nonEmptyLines.length, file).toBeLessThanOrEqual(40);
      expect(source, file).toMatch(/@\/modules\/community-events|@\/core\/events/);
    }

    const canonicalFiles = listSourceFilesRecursively("src/modules/community-events");
    expect(canonicalFiles.length).toBeGreaterThan(legacyFiles.length);
    for (const file of canonicalFiles) {
      expect(read(file), file).not.toContain("@/features/events");
    }
  });

  it("keeps the vertical README synchronized with config.ts", () => {
    const keys = parseVerticalKeys();
    const readme = read("src/core/verticals/README.md");

    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(readme).toContain(`\`${key}\``);
    }

    expect(readme).not.toMatch(/[A-Za-z]:\\|\/C:\//);
  });

  it("does not let non-business domains silently become business verticals", () => {
    const officialVerticals = new Set(parseVerticalKeys());
    const knownCompatibilityDebt = new Set(["events", "guide", "jobs"]);
    const infrastructure = new Set(["__tests__"]);

    const unexpected = listDirectories("src/core/verticals").filter(
      (directory) =>
        !officialVerticals.has(directory) &&
        !knownCompatibilityDebt.has(directory) &&
        !infrastructure.has(directory),
    );

    expect(unexpected).toEqual([]);
  });

  it("keeps guide compatibility path shim-only", () => {
    expect(listDirectories("src/core/verticals/guide/routes")).toEqual([]);
    expect(listFiles("src/core/verticals/guide/routes")).toEqual([
      "touristPointPublicRoutes.ts",
      "useTouristPointPublicUrls.ts",
    ]);
    expect(
      read("src/core/verticals/guide/routes/touristPointPublicRoutes.ts"),
    ).toContain("@/core/guide/tourist-points/routes");
    expect(
      read("src/core/verticals/guide/routes/useTouristPointPublicUrls.ts"),
    ).toContain("@/core/guide/tourist-points/routes");
    expect(listFiles("src/core/guide/tourist-points/routes")).toContain(
      "touristPointPublicRoutes.ts",
    );
  });

  it("keeps jobs compatibility path shim-only", () => {
    expect(listDirectories("src/core/verticals/jobs/routes")).toEqual([]);
    expect(listFiles("src/core/verticals/jobs/routes")).toEqual([
      "jobPublicRoutes.ts",
    ]);
    expect(listDirectories("src/core/verticals/jobs/services")).toEqual([]);
    expect(listFiles("src/core/verticals/jobs/services")).toEqual([
      "VagaPublicationDistributionService.ts",
    ]);
    expect(read("src/core/verticals/jobs/routes/jobPublicRoutes.ts")).toContain(
      "@/core/work-opportunities/routes",
    );
    expect(
      read(
        "src/core/verticals/jobs/services/VagaPublicationDistributionService.ts",
      ),
    ).toContain("@/core/work-opportunities/services");
    expect(listFiles("src/core/work-opportunities/routes")).toContain(
      "jobPublicRoutes.ts",
    );
    expect(listFiles("src/core/work-opportunities/services")).toContain(
      "VagaPublicationDistributionService.ts",
    );
  });

  it("keeps architecture fixtures out of the product source tree", () => {
    expect(listDirectories("src/__tests__")).toEqual([]);
    expect(listFiles("src/__tests__")).toEqual([]);
    expect(
      listFiles("tests/architecture/fixtures/maps-architecture-validation"),
    ).toEqual([
      "README.md",
      "test-violation-cross-layer.ts",
      "test-violation-direct-provider.ts",
    ]);
  });

  it("freezes the legacy root e2e exception", () => {
    expect(listDirectories("e2e")).toEqual(["helpers"]);
    expect(listFiles("e2e")).toEqual(["network-branches.spec.ts"]);
  });
});
