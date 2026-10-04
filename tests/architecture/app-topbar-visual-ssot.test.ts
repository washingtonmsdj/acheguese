import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "src/app/components/navigation/AppTopbar.tsx",
  "utf8",
);

const LEGACY_VISUAL_TOKENS = [
  "bg-card",
  "border-border",
  "text-foreground",
  "text-muted-foreground",
  "border-primary",
] as const;

describe("AppTopbar visual SSOT", () => {
  it("uses territorial tokens for the authenticated global shell", () => {
    expect(source).toContain("bg-territory-surface");
    expect(source).toContain("border-territory-border");
    expect(source).toContain("text-territory-ink");
    expect(source).toContain("text-territory-muted");

    for (const token of LEGACY_VISUAL_TOKENS) {
      expect(source, `legacy AppTopbar visual token returned: ${token}`).not.toContain(token);
    }
  });

  it("keeps paused horizontal actions lifecycle-owned", () => {
    expect(source).toContain(
      'const showNotifications = isPlatformCapabilityEnabled("notifications")',
    );
    expect(source).toContain(
      'const showMessages = isPlatformCapabilityEnabled("messaging")',
    );
    expect(source).toContain("to={appUrls.notifications}");
    expect(source).toContain("to={appUrls.messages}");
  });
});
