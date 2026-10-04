import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appLayout = readFileSync(
  "src/app/components/AppLayoutSidebar.tsx",
  "utf8",
);
const bottomNav = readFileSync(
  "src/core/navigation/BottomNav.tsx",
  "utf8",
);
const citySelector = readFileSync(
  "src/app/components/navigation/PublicCitySelector.tsx",
  "utf8",
);

describe("global shell visual SSOT", () => {
  it("keeps the global app shell on territorial canvas tokens", () => {
    expect(appLayout).toContain("bg-territory-canvas");
    expect(appLayout).not.toContain("bg-background");
    expect(appLayout).not.toContain("@/app/config/lifecycleRegistry");
  });

  it("keeps the MVP mobile navigation on territorial visual tokens", () => {
    expect(bottomNav).toContain("border-territory-border");
    expect(bottomNav).toContain("bg-territory-surface");
    expect(bottomNav).toContain("text-territory-brand");
    expect(bottomNav).toContain("text-territory-muted");
    expect(bottomNav).not.toContain("border-border");
    expect(bottomNav).not.toContain("bg-card");
    expect(bottomNav).not.toContain("text-primary");
    expect(bottomNav).not.toContain("text-muted-foreground");
    expect(bottomNav).not.toContain("rgba(");
    expect(bottomNav).toContain('aria-label="Navegação principal mobile"');
  });

  it("keeps the public city selector on territorial semantic status tokens", () => {
    expect(citySelector).toContain("text-territory-brand");
    expect(citySelector).toContain("border-territory-border");
    expect(citySelector).toContain("bg-territory-surface");
    expect(citySelector).toContain("bg-territory-success/12");
    expect(citySelector).toContain("bg-territory-warning/12");
    expect(citySelector).not.toContain("text-primary");
    expect(citySelector).not.toContain("text-muted-foreground");
    expect(citySelector).not.toContain("border-border");
    expect(citySelector).not.toContain("bg-accent");
    expect(citySelector).not.toContain("emerald-");
    expect(citySelector).not.toContain("amber-");
  });
});
