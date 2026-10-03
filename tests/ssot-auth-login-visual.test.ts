import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const LOGIN_PATH = "src/app/pages/LoginPage.tsx";
const HEADER_PATH = "src/app/components/auth/AuthBrandHeader.tsx";
const FOOTER_PATH = "src/app/components/auth/AuthFooter.tsx";
const LAYOUT_PATH = "src/app/components/auth/auth-concept-layout.css";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

const legacyVisualTokens = [
  "bg-background",
  "bg-card",
  "bg-muted",
  "bg-primary",
  "text-primary",
  "text-primary-foreground",
  "text-foreground",
  "text-muted-foreground",
  "border-border",
  "border-input",
  "bg-border",
];

describe("auth login territory visual SSOT", () => {
  it("projects the login boundary through canonical territory tokens", () => {
    const login = read(LOGIN_PATH);

    for (const token of [
      "bg-territory-surface",
      "bg-territory-raised",
      "bg-territory-sun",
      "text-territory-brand",
      "text-territory-ink",
      "text-territory-muted",
      "border-territory-border",
    ]) {
      expect(login).toContain(token);
    }

    for (const legacyToken of legacyVisualTokens) {
      expect(login).not.toContain(legacyToken);
    }

    expect(login).toContain("signInWithUsername");
    expect(login).toContain("signInWithGoogle");
    expect(login).toContain("turnstile.isReady");
    expect(login).toContain("completeStandardLoginJourney");
    expect(login).toContain("buildPasswordResetRequestPath");
  });

  it("keeps the shared auth chrome on the same territory authority", () => {
    const header = read(HEADER_PATH);
    const footer = read(FOOTER_PATH);
    const layout = read(LAYOUT_PATH);

    for (const token of [
      "bg-territory-canvas",
      "text-territory-brand",
      "bg-territory-sun",
      "border-territory-border",
      "bg-territory-surface",
    ]) {
      expect(header).toContain(token);
    }
    expect(footer).toContain("bg-territory-canvas");
    expect(footer).toContain("text-territory-muted");

    expect(layout).toContain("--territory-canvas");
    expect(layout).toContain("--territory-ink");
    expect(layout).toContain("--territory-brand");
    expect(layout).toContain("--territory-surface");
    expect(layout).toContain("input:-webkit-autofill");

    for (const legacyToken of legacyVisualTokens) {
      expect(header).not.toContain(legacyToken);
      expect(footer).not.toContain(legacyToken);
    }

    expect(header).toContain("navigate(-1)");
    expect(header).toContain("SUPPORT_PATH");
    expect(footer).toContain("TERMS_OF_SERVICE_PATH");
    expect(footer).toContain("PRIVACY_POLICY_PATH");
  });
});
