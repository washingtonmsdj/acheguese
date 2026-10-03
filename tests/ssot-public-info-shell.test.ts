import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SHELL_PATH = "src/app/components/public/PublicInfoPageShell.tsx";
const ABOUT_PATH = "src/app/pages/AboutPage.tsx";
const CONTACT_PATH = "src/app/pages/ContactPage.tsx";
const TERMS_PATH = "src/app/pages/TermosPage.tsx";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("public information shell territory visual SSOT", () => {
  it("owns the shared public information shell with canonical territory tokens", () => {
    const shell = read(SHELL_PATH);

    for (const token of [
      "--territory-brand",
      "--territory-canvas",
      "--territory-surface-raised",
      "border-territory-border",
      "bg-territory-canvas",
      "bg-territory-surface",
      "text-territory-ink",
      "text-territory-muted",
    ]) {
      expect(shell).toContain(token);
    }

    expect(shell).toContain("readonly onBack: () => void");
    expect(shell).not.toContain("react-router-dom");
  });

  it("keeps public information consumers projected through the shared shell", () => {
    for (const pagePath of [ABOUT_PATH, CONTACT_PATH, TERMS_PATH]) {
      const page = read(pagePath);

      expect(page).toContain('import { PublicInfoPageShell } from "@/app/components/public/PublicInfoPageShell";');
      expect(page).toContain("<PublicInfoPageShell");
      expect(page).not.toContain("radial-gradient(circle_at_top_left,hsl(var(--primary)");

      for (const legacyPrimitive of [
        "bg-background",
        "bg-card",
        "bg-muted",
        "border-border",
        "text-foreground",
        "text-muted-foreground",
        "text-primary",
        "bg-primary",
        "border-primary",
        "var(--background)",
        "var(--muted)",
        "var(--primary)",
      ]) {
        expect(page).not.toContain(legacyPrimitive);
      }
    }
  });

  it("preserves About product and territory contracts", () => {
    const page = read(ABOUT_PATH);

    expect(page).toContain("TERRITORY_CONFIG.launch");
    expect(page).toContain("PLATFORM_PILLARS");
    expect(page).toContain('to="/contato"');
    expect(page).toContain('to="/termos"');
    expect(page).toContain('to="/privacidade"');
    expect(page).toContain("onBack={() => navigate(-1)}");
  });

  it("preserves Contact environment, territory and mail contracts", () => {
    const page = read(CONTACT_PATH);

    expect(page).toContain("VITE_CONTACT_EMAIL");
    expect(page).toContain("useSearchParams()");
    expect(page).toContain("TERRITORY_CONFIG.launch");
    expect(page).toContain("buildMailtoUrl(contactEmail)");
    expect(page).toContain('to="/dpo"');
    expect(page).toContain('to="/sobre"');
    expect(page).toContain('to="/privacidade"');
    expect(page).toContain("onBack={() => navigate(-1)}");
  });

  it("preserves Terms legal authority and community contracts", () => {
    const page = read(TERMS_PATH);

    expect(page).toContain("VITE_LEGAL_FORUM");
    expect(page).toContain("TERMS_OF_SERVICE_UPDATED_LABEL");
    expect(page).toContain("TERMS_OF_SERVICE_VERSION");
    expect(page).toContain("COMMUNITY_GUIDELINES_ANCHOR");
    expect(page).toContain("COMMUNITY_GUIDELINES_PATH");
    expect(page).toContain("COMMUNITY_GUIDELINE_ENFORCEMENT_STEPS");
    expect(page).toContain("TERMS_SECTIONS");
    expect(page).toContain('to="/privacidade"');
    expect(page).toContain('to="/dpo"');
    expect(page).toContain("onBack={() => navigate(-1)}");
  });
});
