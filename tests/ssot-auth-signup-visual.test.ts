import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SIGNUP_PATH = "src/app/features/onboarding/pages/CadastroPage.tsx";
const PASSWORD_PATH = "src/app/components/auth/PasswordInput.tsx";
const TURNSTILE_PATH = "src/app/components/auth/AuthTurnstileGate.tsx";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

const legacyVisualTokens = [
  "bg-card",
  "bg-muted",
  "bg-primary",
  "bg-secondary",
  "text-primary",
  "text-primary-foreground",
  "text-foreground",
  "text-muted-foreground",
  "border-border",
  "border-input",
  "border-primary",
  "bg-border",
];

describe("auth signup territory visual SSOT", () => {
  it("projects signup through territory tokens without changing registration authority", () => {
    const signup = read(SIGNUP_PATH);

    for (const token of [
      "bg-territory-surface",
      "bg-territory-raised",
      "bg-territory-sun",
      "text-territory-brand",
      "text-territory-ink",
      "text-territory-muted",
      "border-territory-border",
      "border-territory-brand",
    ]) {
      expect(signup).toContain(token);
    }

    for (const legacyToken of legacyVisualTokens) {
      expect(signup).not.toContain(legacyToken);
    }

    expect(signup).toContain("useCadastroForm");
    expect(signup).toContain("usernameAvailability.checkDebounced");
    expect(signup).toContain("termsAccepted");
    expect(signup).toContain("turnstile.isReady");
    expect(signup).toContain("await submit(turnstile.token");
    expect(signup).toContain("signInWithGoogle");
  });

  it("keeps password and Turnstile controls on semantic territory tokens", () => {
    const password = read(PASSWORD_PATH);
    const turnstile = read(TURNSTILE_PATH);

    for (const token of [
      "bg-territory-error",
      "bg-territory-warning",
      "bg-territory-success",
      "bg-territory-brand",
      "text-territory-muted",
      "text-territory-warning",
      "text-territory-success",
      "border-territory-border",
      "bg-territory-raised/35",
    ]) {
      expect(password).toContain(token);
    }

    expect(turnstile).toContain("border-territory-border/60");
    expect(turnstile).toContain("bg-territory-surface/60");
    expect(turnstile).toContain("text-territory-muted");

    for (const legacyToken of legacyVisualTokens) {
      expect(password).not.toContain(legacyToken);
      expect(turnstile).not.toContain(legacyToken);
    }

    expect(password).toContain("getAuthPasswordRequirementStatus");
    expect(password).toContain("getAuthPasswordStrength");
    expect(password).toContain("getModifierState(\"CapsLock\")");
    expect(turnstile).toContain("VITE_TURNSTILE_SITE_KEY");
    expect(turnstile).toContain("TurnstileWidget");
  });
});
