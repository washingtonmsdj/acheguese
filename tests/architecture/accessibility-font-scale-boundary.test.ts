import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("accessibility presentation boundary", () => {
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

  it("covers territory-vivo semantic tokens in high contrast mode", () => {
    const core = read("src/styles/accessibility-core.css");
    const requiredTokens = [
      "--territory-canvas: 0 0% 100%;",
      "--territory-surface: 0 0% 100%;",
      "--territory-ink: 0 0% 0%;",
      "--territory-muted: 0 0% 20%;",
      "--territory-brand: 0 0% 0%;",
      "--territory-sun: 48 100% 50%;",
      "--territory-border: 0 0% 20%;",
      "--territory-focus: 220 100% 35%;",
      "--territory-on-image: 0 0% 100%;",
    ];

    requiredTokens.forEach((token) => expect(core).toContain(token));
  });
});
