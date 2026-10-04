import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const cssPath = "src/core/nearby/pages/NearbyPage.css";
const miniMapPath = "src/core/nearby/components/NearbyMiniMap.tsx";
const css = readFileSync(resolve(root, cssPath), "utf8");
const miniMap = readFileSync(resolve(root, miniMapPath), "utf8");

const rawRuntimeColor = /(?:#[0-9a-fA-F]{3,8}\b|\brgba?\s*\()/;
const cssFontWeight = /font-weight\s*:\s*(\d{3})\b/g;
const approvedFontWeights = new Set(["400", "500", "600", "700", "800"]);

describe("Nearby visual SSOT", () => {
  it("keeps the active Nearby surface on canonical territory tokens", () => {
    expect(css).toContain("font-family:var(--font-sans)");
    expect(css).toContain("hsl(var(--territory-surface))");
    expect(css).toContain("hsl(var(--territory-ink))");
    expect(css).toContain("hsl(var(--territory-muted))");
    expect(css).toContain("hsl(var(--territory-brand))");
    expect(css).toContain("hsl(var(--territory-border))");
    expect(css).toContain("hsl(var(--territory-sun))");
  });

  it("does not recreate a local Nearby palette or raw runtime colors", () => {
    expect(css).not.toMatch(/--nb-[a-z0-9-]+\s*:/i);
    expect(css).not.toMatch(rawRuntimeColor);
    expect(css).not.toContain("font-family:Inter");
  });

  it("uses only font weights loaded by the canonical font owner", () => {
    const weights = Array.from(css.matchAll(cssFontWeight), (match) => match[1]);
    expect(weights.length).toBeGreaterThan(0);
    for (const weight of weights) {
      expect(approvedFontWeights.has(weight)).toBe(true);
    }
  });

  it("keeps the mini map layout explicit and free of generic visual primitives", () => {
    expect(miniMap).toContain("h-[13.75rem]");
    expect(miniMap).toContain("min-[521px]:h-[300px]");
    expect(miniMap).toContain("min-[1181px]:h-[310px]");
    expect(miniMap).toContain("border-territory-border/50");
    expect(miniMap).toContain("bg-territory-raised/30");
    expect(miniMap).toContain("text-territory-muted");
    expect(miniMap).not.toContain('style={{ height: "400px" }}');
    expect(miniMap).not.toContain("border-border/50");
    expect(miniMap).not.toContain("bg-muted/30");
    expect(miniMap).not.toContain("text-muted-foreground");
  });
});
