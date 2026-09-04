import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const retired = [
  "src/modules/business/components/BusinessAbout.tsx",
  "src/modules/business/components/BusinessContactSidebar.tsx",
  "src/modules/business/components/BusinessGallery.tsx",
  "src/modules/business/components/BusinessHours.tsx",
  "src/modules/business/components/BusinessProducts.tsx",
  "src/modules/business/components/BusinessReviews.tsx",
  "src/modules/business/components/BusinessServices.tsx",
  "src/modules/business/components/BusinessSidebar.tsx",
  "src/modules/business/components/SecoesAtivasManager.tsx",
  "src/modules/business/components/ShareBusinessDialog.tsx",
  "src/modules/business/hooks/useBusinessSidebar.ts",
];

const retiredSymbols = [
  "BusinessAbout",
  "BusinessGallery",
  "BusinessHours",
  "BusinessProducts",
  "BusinessReviews",
  "BusinessServices",
  "SecoesAtivasManager",
  "ShareBusinessDialog",
];

describe("G6 Business base orphan cleanup", () => {
  it("keeps callerless legacy components retired", () => {
    for (const relativePath of retired) {
      expect(existsSync(join(ROOT, relativePath))).toBe(false);
    }
  });

  it("does not republish retired components from Business barrels", () => {
    const componentBarrel = readFileSync(
      join(ROOT, "src/modules/business/components/index.ts"),
      "utf8",
    );
    const moduleBarrel = readFileSync(
      join(ROOT, "src/modules/business/index.ts"),
      "utf8",
    );

    for (const symbol of retiredSymbols) {
      expect(componentBarrel).not.toContain(symbol);
      if (symbol !== "SecoesAtivasManager" && symbol !== "ShareBusinessDialog") {
        expect(moduleBarrel).not.toMatch(
          new RegExp(`export\\s+\\{[^}]*\\b${symbol}\\b[^}]*\\}\\s+from\\s+["']\\./components/`),
        );
      }
    }
  });
});
