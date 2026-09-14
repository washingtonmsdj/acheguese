import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("Achegue-se typography SSOT", () => {
  it("keeps one approved Plus Jakarta Sans owner for Tailwind and CSS tokens", () => {
    const tailwind = read("tailwind.config.ts");
    const globalCss = read("src/index.css");

    expect(tailwind).toContain(
      'const ACHEGUE_SE_FONT_FAMILY = "Plus Jakarta Sans";',
    );
    expect(tailwind).toContain(
      'const ACHEGUE_SE_FONT_STACK = [ACHEGUE_SE_FONT_FAMILY, "sans-serif"]',
    );
    expect(tailwind).toContain("sans: ACHEGUE_SE_FONT_STACK");
    expect(tailwind).toContain("display: ACHEGUE_SE_FONT_STACK");
    expect(tailwind).toContain("heading: ACHEGUE_SE_FONT_STACK");
    expect(tailwind).toContain('"--font-heading": `"${ACHEGUE_SE_FONT_FAMILY}"`');
    expect(tailwind).toContain('"--font-sans": `"${ACHEGUE_SE_FONT_FAMILY}"`');
    expect(tailwind).toContain("achegueSeTypographyTokens");

    expect(globalCss).toContain("var(--font-heading, ui-sans-serif)");
  });

  it("keeps living design documentation aligned with the approved concept font", () => {
    const tokens = read("docs/04-design/DESIGN-TOKENS.md");
    const identity = read("docs/04-design/ACHEGUE-SE-VISUAL-IDENTITY.md");

    expect(tokens).toContain("Plus Jakarta Sans");
    expect(tokens).not.toContain("`DM Sans`");
    expect(tokens).not.toContain("`Space Grotesk`");
    expect(identity).toContain("Fonte migrada para Plus Jakarta Sans");
  });
});
