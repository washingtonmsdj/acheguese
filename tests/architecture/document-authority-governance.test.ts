import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const NON_CANONICAL_PREFIXES = ["plans/", "handoff/", ".kiro/specs/"] as const;

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function walkCode(relativeDir: string): string[] {
  const absolute = path.join(ROOT, relativeDir);
  if (!fs.existsSync(absolute)) return [];

  const files: string[] = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const child = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkCode(child));
      continue;
    }
    if (entry.isFile() && /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
      files.push(child.replaceAll(path.sep, "/"));
    }
  }
  return files.sort();
}

describe("document authority governance", () => {
  it("classifies plans, handoffs and Kiro specs as non-canonical", () => {
    expect(read("plans/README.md")).toContain("NAO CANONICO");
    expect(read("plans/README.md")).toContain("Planos nao sao fonte de verdade");
    expect(read("handoff/README.md")).toContain("NAO CANONICO");
    expect(read("handoff/README.md")).toContain("Handoffs nao sao fonte de verdade");
    expect(read(".kiro/README.md")).toContain("NAO CANONICO");
    expect(read(".kiro/README.md")).toContain("nao sao fonte de verdade");
  });

  it("keeps runtime/product code independent from execution-document paths", () => {
    const productCode = walkCode("src");
    expect(productCode.length).toBeGreaterThan(0);

    for (const file of productCode) {
      const source = read(file);
      for (const prefix of NON_CANONICAL_PREFIXES) {
        expect(source, `${file} must not depend on ${prefix}`).not.toContain(prefix);
      }
    }
  });

  it("keeps package scripts independent from execution-document paths", () => {
    const packageJson = read("package.json");
    for (const prefix of NON_CANONICAL_PREFIXES) {
      expect(packageJson).not.toContain(prefix);
    }
  });
});
