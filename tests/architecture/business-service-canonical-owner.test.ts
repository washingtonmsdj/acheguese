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
      "src/modules/business/gastronomy/services/OrderTrustService.ts",
    ]) {
      expect(fs.existsSync(path.join(ROOT, relativePath))).toBe(false);
    }
  });

  it("does not re-export BusinessService from module barrels", () => {
    const moduleBarrel = read("src/modules/business/index.ts");
    const serviceBarrel = read("src/modules/business/services/index.ts");

    const exportedLines = [...moduleBarrel.split("\n"), ...serviceBarrel.split("\n")]
      .filter((line) => line.trimStart().startsWith("export "));
    expect(exportedLines.some((line) => line.includes("BusinessService"))).toBe(false);
  });

  it("points the gastronomy service barrel directly at its canonical URL owner", () => {
    const gastronomyBarrel = read(
      "src/modules/business/gastronomy/services/index.ts",
    );

    expect(gastronomyBarrel).toContain(
      "@/core/verticals/gastronomy/services/GastronomyUrlService",
    );
    expect(gastronomyBarrel).not.toContain("./GastronomyUrlService");
    expect(gastronomyBarrel).not.toContain("OrderTrustService");
  });

  it("routes order feedback directly through the canonical trust owner", () => {
    const feedbackPanel = read(
      "src/modules/business/gastronomy/components/orders/OrderTrustFeedbackPanel.tsx",
    );

    expect(feedbackPanel).toContain("OperationalTrustCommandService");
    expect(feedbackPanel).toContain("submitOrderFeedback(order.id, input)");
    expect(feedbackPanel).not.toContain("OrderTrustService");
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
