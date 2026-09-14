import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("accessibility font scale boundary", () => {
  it("applies persisted accessibility classes on the document root", () => {
    const leanRuntime = read("src/app/components/AppRuntime.tsx");
    const provider = read(
      "src/shared/components/accessibility/AccessibilityProvider.tsx",
    );

    expect(leanRuntime).toContain("document.documentElement");
    expect(provider).toContain(
      "applyAccessibilityPreferences(document.documentElement",
    );
    expect(leanRuntime).not.toContain("document.body,\n      readAccessibilityPreferences()");
    expect(provider).not.toContain(
      "applyAccessibilityPreferences(document.body",
    );
  });

  it("scales rem-based hierarchy without flattening descendant font sizes", () => {
    const core = read("src/styles/accessibility-core.css");

    expect(core).toContain(".accessibility-font-large {");
    expect(core).toContain("font-size: 118% !important;");
    expect(core).toContain(".accessibility-font-extra-large {");
    expect(core).toContain("font-size: 136% !important;");
    expect(core).not.toContain(".accessibility-font-large *");
    expect(core).not.toContain(".accessibility-font-extra-large *");
    expect(core).not.toContain("font-size: inherit !important");
  });
});
