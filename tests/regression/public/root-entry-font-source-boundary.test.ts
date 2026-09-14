import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("public root font source boundary", () => {
  it("keeps Google Fonts out of source CSS and PostCSS cleanup", () => {
    const globalCss = read("src/index.css");
    const postcss = read("postcss.config.cjs");

    expect(globalCss).not.toContain("fonts.googleapis.com");
    expect(globalCss).not.toMatch(/@import\s+(?:url\()?['\"]?https?:\/\//i);
    expect(postcss).not.toContain("stripDuplicateGoogleFontImport");
    expect(postcss).not.toContain("strip-duplicate-google-font-import");
    expect(postcss).not.toContain("fonts.googleapis.com");
  });

  it("keeps the optional font owned by the deferred public bootstrap", () => {
    const html = read("index.html");
    const main = read("src/main.tsx");

    expect(html).toContain("data-public-font-stylesheet");
    expect(html).toContain(
      "Plus+Jakarta+Sans:wght@400;500;600;700;800&display=optional",
    );
    expect(html.match(/wght@400;500;600;700;800&display=optional/g)).toHaveLength(2);
    expect(main).toContain('meta[data-public-font-stylesheet]');
    expect(main).toContain('stylesheet.rel = "stylesheet"');
    expect(main).toContain(
      "scheduleAfterPublicRootMap(loadOptionalFontStylesheet",
    );
    expect(main).toContain("maxWaitMs: 2400");
  });
});
