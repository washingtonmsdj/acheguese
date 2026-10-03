import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SHELL_PATH = "src/app/components/public/PublicInfoPageShell.tsx";
const ABOUT_PATH = "src/app/pages/AboutPage.tsx";
const CONTACT_PATH = "src/app/pages/ContactPage.tsx";
const TERMS_PATH = "src/app/pages/TermosPage.tsx";
const PRIVACY_PATH = "src/app/pages/PrivacidadePage.tsx";
const DPO_PATH = "src/app/pages/DPOContactPage.tsx";

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
    expect(shell).toContain('type PublicInfoPageShellWidth = "standard" | "wide";');
    expect(shell).toContain('width = "standard"');
    expect(shell).toContain('width === "wide" ? "max-w-6xl" : "max-w-5xl"');
    expect(shell).not.toContain("react-router-dom");
  });

  it("keeps public information consumers projected through the shared shell", () => {
    for (const pagePath of [ABOUT_PATH, CONTACT_PATH, TERMS_PATH, PRIVACY_PATH, DPO_PATH]) {
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

  it("preserves Privacy LGPD content and legal navigation contracts", () => {
    const page = read(PRIVACY_PATH);

    expect(page).toContain("POLICY_SECTIONS");
    expect(page).toContain("COMMUNITY_GUIDELINES_PATH");
    expect(page).toContain("Lei Geral de Proteção de Dados Pessoais");
    expect(page).toContain("Marco Civil da Internet");
    expect(page).toContain('to="/termos"');
    expect(page).toContain('to="/dpo"');
    expect(page).toContain("onBack={() => navigate(-1)}");
  });

  it("preserves DPO request, anti-abuse and fail-closed contracts", () => {
    const page = read(DPO_PATH);

    for (const contract of [
      "PrivacyService.createDPORequest",
      "DPOContactSchema",
      "DPO_REQUEST_ANTI_ABUSE_CONFIG",
      "TURNSTILE_SITE_KEY",
      "TURNSTILE_REQUIRED",
      "TurnstileWidget",
      "REQUEST_TYPE_OPTIONS",
      "RIGHTS",
      "getDpoEmail()",
      "getDpoName()",
      "buildMailtoUrl(dpoEmail)",
      'value: "portability"',
      'value: "deletion"',
      "Canal temporariamente indisponível: proteção anti-spam não configurada.",
      "Ela será analisada conforme o direito exercido e os prazos aplicáveis da LGPD.",
      "onBack={() => navigate(-1)}",
      'width="wide"',
    ]) {
      expect(page).toContain(contract);
    }

    expect(page).toContain("contactMutation.isPending || !turnstileSatisfied");
    expect(page).toContain('variant: "destructive"');
  });
});
