import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const srcRoot = resolve(root, "src");
const historicalOwnerRoot = "src/core/verticals/jobs";
const historicalImport = "@/core/verticals/jobs";

function collectSourceFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(absolutePath));
      continue;
    }
    if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files;
}

function isRuntimeSource(path: string): boolean {
  return !path.includes("/__tests__/") && !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path);
}

describe("Jobs canonical ownership", () => {
  it("keeps Jobs out of the business vertical namespace", () => {
    expect(existsSync(resolve(root, historicalOwnerRoot))).toBe(false);
    expect(
      existsSync(resolve(root, "src/core/work-opportunities/routes/jobPublicRoutes.ts")),
    ).toBe(true);
    expect(
      existsSync(
        resolve(root, "src/core/work-opportunities/services/VagaPublicationDistributionService.ts"),
      ),
    ).toBe(true);
  });

  it("forbids runtime imports from the retired Jobs namespace", () => {
    const callers = collectSourceFiles(srcRoot)
      .map((absolutePath) => relative(root, absolutePath).replaceAll("\\", "/"))
      .filter(isRuntimeSource)
      .filter((path) => readFileSync(resolve(root, path), "utf8").includes(historicalImport))
      .sort();

    expect(callers).toEqual([]);
  });
});
