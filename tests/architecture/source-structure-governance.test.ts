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

function parseVerticalKeys(): string[] {
  const config = read("src/core/verticals/config.ts");
  const match = config.match(/VERTICAL_KEYS[^=]*=\s*\[([^\]]*)\]/m);
  if (!match) return [];

  return Array.from(match[1].matchAll(/["']([^"']+)["']/g)).map(
    (entry) => entry[1],
  );
}

describe("source structure governance", () => {
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

  it("freezes the top-level src/__tests__ exception", () => {
    expect(listDirectories("src/__tests__")).toEqual([
      "maps-architecture-validation",
    ]);
    expect(listFiles("src/__tests__")).toEqual([]);
  });

  it("freezes the legacy root e2e exception", () => {
    expect(listDirectories("e2e")).toEqual(["helpers"]);
    expect(listFiles("e2e")).toEqual(["network-branches.spec.ts"]);
  });
});
