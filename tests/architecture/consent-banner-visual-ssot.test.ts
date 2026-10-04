import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("consent banner visual SSOT", () => {
  const banner = read("src/app/components/privacy/ConsentBannerContent.tsx");

  it("keeps the global privacy surface on territorial semantic tokens", () => {
    for (const token of [
      "border-territory-border",
      "bg-territory-surface",
      "bg-territory-brand",
      "text-territory-brand",
      "text-territory-ink",
      "text-territory-muted",
      "text-territory-on-image",
      "hover:bg-territory-raised",
    ]) {
      expect(banner).toContain(token);
    }

    for (const legacy of [
      "border-border",
      "bg-background",
      "bg-primary",
      "text-primary",
      "text-foreground",
      "text-muted-foreground",
      "border-slate-",
      "bg-slate-",
      "text-slate-",
      "bg-teal-",
      "text-white",
      "bg-white",
      "rgba(",
    ]) {
      expect(banner).not.toContain(legacy);
    }
  });

  it("keeps consent behavior and lazy personalization intact", () => {
    expect(banner).toContain("ConsentService.getExistingConsents");
    expect(banner).toContain("ConsentService.saveConsentPreferences");
    expect(banner).toContain("loadConsentPreferencesDialog");
    expect(banner).toContain("PRELAUNCH_LOCKDOWN_ENABLED");
    expect(banner).toContain("AUTH_PATHS.login");
    expect(banner).toContain("rejectOptionalConsents");
    expect(banner).toContain("acceptAllConsents");
  });
});
