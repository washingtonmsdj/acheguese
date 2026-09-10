import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const service = read("src/core/notifications/services/EmailService.ts");
const hook = read("src/core/notifications/hooks/useEmail.ts");
const edge = read("supabase/functions/send-email/index.ts");
const auth = read("src/core/auth/services/AuthService.ts");
const config = read("supabase/config.toml");

describe("G42 email self-service authority", () => {
  it("keeps send-email bound to the authenticated account and recipient", () => {
    expect(edge).toContain("if (userId !== user.id)");
    expect(edge).toContain("Email recipient must match authenticated user");
    expect(config).toMatch(/\[functions\.send-email\]\s*verify_jwt = true/);
  });

  it("requires user identity and an authoritative provider receipt", () => {
    expect(service).toContain("userId: string;");
    expect(service).toContain("resolveSupabaseFunctionErrorMessage");
    expect(service).toContain("data.success !== true");
    expect(service).toContain("typeof data.emailId !== 'string'");
    expect(service).toContain("Resposta invalida do servico de email");
  });

  it("does not hide email log read failures as an empty successful list", () => {
    const start = service.indexOf("static async getEmailLogs(");
    const end = service.indexOf("private static getWelcomeEmailTemplate");
    const block = service.slice(start, end);

    expect(block).toContain("throw error;");
    expect(block).not.toContain("return [];");
  });

  it("keeps password recovery in Auth instead of the self-email broker", () => {
    expect(auth).toContain("resetPasswordForEmail");
    expect(service).not.toContain("sendPasswordResetEmail");
    expect(service).not.toContain("getPasswordResetTemplate");
    expect(hook).not.toContain("sendPasswordResetEmail");
  });

  it("never sends MFA recovery codes through the notification email channel", () => {
    expect(service).toContain("sendMFASetupConfirmationEmail");
    expect(service).not.toContain("backupCodes");
    expect(service).not.toContain("sendMFASetupEmail");
    expect(hook).toContain("sendMFASetupConfirmationEmail");
    expect(hook).not.toContain("sendMFASetupEmail");
  });

  it("escapes dynamic HTML and rejects non-HTTPS external invoice links", () => {
    expect(service).toContain("function escapeHtml(");
    expect(service).toContain("function requireHttpsUrl(");
    expect(service).toContain("url.protocol !== 'https:'");
    expect(service).toContain("escapeHtml(device.name)");
    expect(service).toContain("escapeHtml(alert.description)");
  });
});
