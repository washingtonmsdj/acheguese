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
});
