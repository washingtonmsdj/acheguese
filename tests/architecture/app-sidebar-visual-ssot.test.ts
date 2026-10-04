import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "src/app/components/navigation/AppSidebar.tsx",
  "utf8",
);

const LEGACY_VISUAL_TOKENS = [
  "border-sidebar-border",
  "bg-sidebar-accent",
  "text-sidebar-foreground",
  "text-foreground",
  "text-primary",
  "text-muted-foreground",
  "border-primary",
] as const;

describe("AppSidebar visual SSOT", () => {
  it("keeps the authenticated sidebar on territorial presentation tokens", () => {
    expect(source).toContain("border-territory-border");
    expect(source).toContain("bg-territory-surface");
    expect(source).toContain("text-territory-ink");
    expect(source).toContain("text-territory-muted");
    expect(source).toContain("text-territory-brand");

    for (const token of LEGACY_VISUAL_TOKENS) {
      expect(source, `legacy AppSidebar visual token returned: ${token}`).not.toContain(token);
    }
  });

  it("preserves canonical navigation and prefetch owners", () => {
    expect(source).toContain("NAV_SECTIONS");
    expect(source).toContain("prefetchRouteByHref");
    expect(source).toContain("buildModuleTerritoryUrl");
    expect(source).toContain("PublicCitySelector");
  });
});
