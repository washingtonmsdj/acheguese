import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
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
});
