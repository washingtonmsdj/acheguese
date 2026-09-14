import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const require = createRequire(import.meta.url);
const postcssConfig = require(path.join(ROOT, "postcss.config.cjs")) as {
  plugins: Array<{ postcssPlugin?: string }>;
};

const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

function plugin(name: string) {
  const found = postcssConfig.plugins.find((candidate) => candidate.postcssPlugin === name);
  if (!found) throw new Error(`PostCSS plugin ${name} not found`);
  return found;
}

describe("public root CSS performance", () => {
  it("removes dead entry selectors without deleting active selectors in mixed rules", async () => {
    const result = await postcss([plugin("strip-dead-entry-legacy-selectors")]).process(
      [
        ".entry-hero, .entry-categories { width: 100%; }",
        ".entry-search-form { display: grid; }",
        ".entry-map, .entry-community-heading { min-width: 0; }",
      ].join("\n"),
      { from: undefined },
    );

    expect(result.css).toContain(".entry-hero");
    expect(result.css).toContain(".entry-map");
    expect(result.css).not.toContain(".entry-categories");
    expect(result.css).not.toContain(".entry-search-form");
    expect(result.css).not.toContain(".entry-community-heading");
  });

  it("keeps the active root page free from the pruned legacy class contract", () => {
    const page = read("src/app/pages/TerritoryEntryPage.tsx");
    const legacyTokens = [
      "entry-search",
      "entry-location-action",
      "entry-suggestions",
      "entry-community-card",
      "entry-community-heading",
      "entry-selection-badge",
      "entry-community-description",
      "entry-highlights",
      "entry-categories",
      "entry-category-",
      "entry-resolved",
      "entry-message",
    ];

    legacyTokens.forEach((token) => expect(page).not.toContain(token));
  });
});
