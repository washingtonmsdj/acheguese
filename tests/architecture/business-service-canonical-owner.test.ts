import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("Business and gastronomy canonical ownership", () => {
  it("keeps duplicate module compatibility bridges retired", () => {
    for (const relativePath of [
      "src/modules/business/services/BusinessService.ts",
      "src/modules/business/gastronomy/services/GastronomyUrlService.ts",
    ]) {
      expect(fs.existsSync(path.join(ROOT, relativePath))).toBe(false);
    }
  });

  it("does not re-export BusinessService from module barrels", () => {
    const moduleBarrel = read("src/modules/business/index.ts");
    const serviceBarrel = read("src/modules/business/services/index.ts");

    expect(moduleBarrel).not.toContain("BusinessService");
    expect(serviceBarrel).not.toContain("BusinessService");
  });

  it("points the gastronomy service barrel directly at its canonical URL owner", () => {
    const gastronomyBarrel = read(
      "src/modules/business/gastronomy/services/index.ts",
    );

    expect(gastronomyBarrel).toContain(
      "@/core/verticals/gastronomy/services/GastronomyUrlService",
    );
    expect(gastronomyBarrel).not.toContain("./GastronomyUrlService");
  });

  it("keeps canonical owners in core", () => {
    for (const relativePath of [
      "src/core/business/services/BusinessService.ts",
      "src/core/verticals/gastronomy/services/GastronomyUrlService.ts",
    ]) {
      expect(fs.existsSync(path.join(ROOT, relativePath))).toBe(true);
    }
  });
});
