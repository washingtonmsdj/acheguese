import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = process.cwd();
const SRC_ROOT = path.resolve(PROJECT_ROOT, "src");

function collectRuntimeFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "__mocks__" || entry.name === "fixtures") {
        return [];
      }
      return collectRuntimeFiles(absolute);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [absolute] : [];
  });
}

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(PROJECT_ROOT, relativePath), "utf8");
}

describe("pricing instance SSOT", () => {
  it("keeps direct PricingService construction isolated to the canonical instance", () => {
    const violations = collectRuntimeFiles(SRC_ROOT)
      .filter((file) => path.relative(PROJECT_ROOT, file) !== "src/core/pricing/instance.ts")
      .filter((file) => {
        const source = fs.readFileSync(file, "utf8");
        return /(?:from\s+["'][^"']*pricing\/services\/PricingService["']|from\s+["']\.\/services\/PricingService["'])/.test(source);
      })
      .map((file) => path.relative(PROJECT_ROOT, file));

    expect(violations).toEqual([]);
  });

  it("exports the application singleton only from the canonical instance", () => {
    const servicesBarrel = read("src/core/pricing/services/index.ts");
    const pricingBarrel = read("src/core/pricing/index.ts");
    const instance = read("src/core/pricing/instance.ts");

    expect(servicesBarrel).toBe("export { PricingService } from './PricingService';");
    expect(servicesBarrel).not.toContain("pricingService");
    expect(pricingBarrel).toContain("export { pricingService } from './instance';");
    expect(instance).toContain("export const pricingService = new Proxy");
  });
});
