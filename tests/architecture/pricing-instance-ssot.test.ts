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

  it("keeps the raw pricing implementation out of public barrels", () => {
    const servicesBarrel = read("src/core/pricing/services/index.ts");
    const pricingBarrel = read("src/core/pricing/index.ts");
    const instance = read("src/core/pricing/instance.ts");

    expect(servicesBarrel).not.toContain("PricingService");
    expect(servicesBarrel).not.toContain("pricingService");
    expect(pricingBarrel).not.toContain("export * from './services'");
    expect(pricingBarrel).not.toContain("export * from './hooks'");
    expect(pricingBarrel).toContain("export { pricingService } from './instance';");
    expect(instance).toContain("export const pricingService = new Proxy");
  });

  it("keeps the retired client-side mobility fare hook namespace absent", () => {
    expect(
      fs.existsSync(path.resolve(PROJECT_ROOT, "src/core/pricing/hooks")),
    ).toBe(false);
  });

  it("physically removes the historical local fare engine", () => {
    const pricing = read("src/core/pricing/services/PricingService.ts");

    expect(pricing).not.toContain("calculateEstimate(");
    expect(pricing).not.toContain("calculateQuickEstimate(");
    expect(pricing).not.toContain("getFallbackRule");
    expect(pricing).not.toContain("AVERAGE_SPEED_KMH");
    expect(pricing).not.toMatch(/fallback-(?:ride|delivery|mototaxi|motoboy|custom)/);
    expect(pricing).not.toMatch(/hour\s*>=\s*(?:7|17|22)/);
  });

  it("keeps application runtime free of local fare calculation calls", () => {
    const violations = collectRuntimeFiles(SRC_ROOT)
      .filter((file) => {
        const source = fs.readFileSync(file, "utf8");
        return /\.calculate(?:Quick)?Estimate\s*\(/.test(source);
      })
      .map((file) => path.relative(PROJECT_ROOT, file));

    expect(violations).toEqual([]);
  });
});
