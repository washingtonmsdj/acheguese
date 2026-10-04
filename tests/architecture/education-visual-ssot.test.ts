import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { PRODUCT_MODULE_REGISTRY } from "../../src/app/config/productModuleRegistry";

const ROOT = process.cwd();
const EDUCATION_VISUAL_OWNERS = [
  "src/modules/business/education/pages/explorerNicheChip.tsx",
  "src/modules/business/education/pages/EducationDetailStateViews.tsx",
] as const;

const LEGACY_VISUAL_TOKENS = [
  "bg-background",
  "bg-card",
  "text-foreground",
  "text-muted-foreground",
  "text-primary",
  "bg-primary",
] as const;

describe("education visual SSOT", () => {
  it("keeps migrated Education UI owners versioned and territorial", () => {
    for (const relativePath of EDUCATION_VISUAL_OWNERS) {
      const absolutePath = path.join(ROOT, relativePath);
      expect(fs.existsSync(absolutePath), relativePath).toBe(true);
      const source = fs.readFileSync(absolutePath, "utf8");

      expect(source, relativePath).toContain("territory-");
      for (const token of LEGACY_VISUAL_TOKENS) {
        expect(source, `${relativePath}: legacy visual token returned: ${token}`).not.toContain(token);
      }
    }
  });

  it("keeps Education paused while its owners are hardened for later activation", () => {
    expect(PRODUCT_MODULE_REGISTRY.education.status).toBe("paused");
  });
});
