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
  it("keeps community implementation on one canonical code path", () => {
    expect(existsSync("src/core/community-feed")).toBe(false);
  });

  it("does not import module implementation internals from core community", () => {
    const offenders = filesUnder("src/core/community").filter((file) =>
      /@\/modules\/community(?!-)/.test(readFileSync(file, "utf8")),
    );

    expect(offenders).toEqual([]);
  });
});
