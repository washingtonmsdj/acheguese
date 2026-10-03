import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Business detail layout visual SSOT", () => {
  it("keeps actions over the dark public Business shell on the canonical on-image token", () => {
    const source = read(
      "src/modules/business/company/pages/EmpresaDetailLayout.tsx",
    );

    for (const legacyUtility of [
      "bg-primary",
      "text-primary",
      "hover:text-primary",
    ]) {
      expect(source, legacyUtility).not.toContain(legacyUtility);
    }

    expect(source).toContain("bg-territory-image-overlay");
    expect(source).toContain("text-territory-on-image");
    expect(source).toContain("bg-territory-action-on-image/14");
    expect(source).toContain("text-territory-action-on-image");
    expect(source).toContain("hover:text-territory-action-on-image");
  });
});
