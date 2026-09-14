import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("BusinessService canonical ownership", () => {
  it("keeps the duplicate module compatibility bridge retired", () => {
    expect(
      fs.existsSync(
        path.join(ROOT, "src/modules/business/services/BusinessService.ts"),
      ),
    ).toBe(false);
  });

  it("does not re-export BusinessService from module barrels", () => {
    const moduleBarrel = read("src/modules/business/index.ts");
    const serviceBarrel = read("src/modules/business/services/index.ts");

    expect(moduleBarrel).not.toContain("BusinessService");
    expect(serviceBarrel).not.toContain("BusinessService");
  });

  it("keeps the canonical owner in core/business", () => {
    expect(
      fs.existsSync(
        path.join(ROOT, "src/core/business/services/BusinessService.ts"),
      ),
    ).toBe(true);
  });
});
