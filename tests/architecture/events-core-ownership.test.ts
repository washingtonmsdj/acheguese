import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function listSourceFiles(relativePath: string): string[] {
  const absolute = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolute)) return [];

  const results: string[] = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      results.push(...listSourceFiles(child));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(child);
    }
  }
  return results.sort();
}

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("events core ownership", () => {
  it("keeps canonical Events core independent from vertical compatibility paths", () => {
    const canonicalFiles = listSourceFiles("src/core/events");
    expect(canonicalFiles.length).toBeGreaterThan(0);

    const offenders = canonicalFiles.filter((file) =>
      read(file).includes("@/core/verticals/events"),
    );

    expect(offenders).toEqual([]);
  });

  it("keeps the legacy vertical Events namespace shim-only", () => {
    const legacyFiles = listSourceFiles("src/core/verticals/events");
    const expected = [
      "src/core/verticals/events/config/eventReadConfig.ts",
      "src/core/verticals/events/index.ts",
      "src/core/verticals/events/mappers.ts",
      "src/core/verticals/events/routes/eventPublicRoutes.ts",
      "src/core/verticals/events/services/EventLinkEligibilityService.ts",
      "src/core/verticals/events/services/EventMutationService.ts",
      "src/core/verticals/events/services/EventReadService.ts",
      "src/core/verticals/events/services/EventRuntimeService.ts",
      "src/core/verticals/events/types.ts",
    ];

    expect(legacyFiles).toEqual(expected);
    for (const file of legacyFiles) {
      expect(read(file)).toContain("@/core/events");
      expect(read(file)).toContain("Compatibility shim");
    }
  });

  it("points the community compatibility bridge at canonical Events core", () => {
    const bridge = read("src/core/community/services/CommunityEventsRuntimeService.ts");
    expect(bridge).toContain("@/core/events/services/EventRuntimeService");
    expect(bridge).not.toContain("@/core/verticals/events");
  });
});
