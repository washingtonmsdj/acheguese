import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("active account settings visual SSOT", () => {
  it("uses the territory foreground paired with territory brand actions", () => {
    const sources = [
      read("src/app/pages/NotificationPreferencesPage.tsx"),
      read("src/app/pages/PrivacySettingsPage.tsx"),
      read("src/modules/profile/pages/ContaPreferenciasPage.tsx"),
    ];

    for (const source of sources) {
      expect(source).toContain("text-territory-on-image");
      expect(source).not.toContain("bg-territory-brand text-primary-foreground");
    }

    expect(sources[2]).toContain("text-territory-on-image/80");
    expect(sources[2]).not.toContain("text-primary-foreground/80");
  });
});
