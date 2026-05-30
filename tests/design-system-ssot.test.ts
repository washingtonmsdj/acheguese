import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const RAW_COLOR_RE = /#[0-9a-fA-F]{3,8}|\brgba?\(/;
const ARBITRARY_COLOR_CLASS_RE =
  /\b(?:bg|text|border|from|via|to|ring|shadow)-\[#/;

describe("design system SSOT", () => {
  it("keeps the theme facade on semantic tokens", () => {
    const source = readFileSync("src/styles/theme.ts", "utf8");

    expect(source).not.toMatch(RAW_COLOR_RE);
    expect(source).not.toMatch(ARBITRARY_COLOR_CLASS_RE);
  });

  it("keeps MapLibre popup styling tokenized globally", () => {
    const source = readFileSync("src/index.css", "utf8");
    const popupStyles = source.slice(
      source.indexOf(".maplibregl-popup-content"),
    );

    expect(popupStyles).toContain("var(--map-popup-background)");
    expect(popupStyles).toContain("var(--map-popup-shadow)");
    expect(popupStyles).not.toMatch(RAW_COLOR_RE);
  });
});
