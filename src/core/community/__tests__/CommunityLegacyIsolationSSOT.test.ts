import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function filesUnder(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      if (entry === "__tests__") continue;
      files.push(...filesUnder(path));
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry)) {
      files.push(path);
    }
  }

  return files;
}

describe("community legacy isolation", () => {
  it("does not import module implementation internals from core community", () => {
    const offenders = filesUnder("src/core/community").filter((file) =>
      /@\/modules\/community(?!-)/.test(readFileSync(file, "utf8")),
    );

    expect(offenders).toEqual([]);
  });
  it("does not recreate callerless generic Community residues", () => {
    expect(existsSync("src/core/community/types.ts")).toBe(false);
    expect(
      existsSync("src/core/community/components/styles/accessibilityAAA.ts"),
    ).toBe(false);
    const publicApi = readFileSync("src/core/community/index.ts", "utf8");
    expect(publicApi).not.toContain('export * from "./components"');
  });
});
