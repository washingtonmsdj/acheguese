import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const authService = read("src/core/auth/services/AuthService.ts");
const recoveryPage = read("src/app/pages/ResetPasswordPage.tsx");

describe("password recovery session disposal", () => {
  it("captures verified recovery authority before mutating the password", () => {
    const handler = authService.indexOf(
      "static async updatePassword(newPassword: string, nonce?: string): Promise<void>",
    );
    const authority = authService.indexOf(
      "await AuthRecoveryAuthority.isCurrentSessionRecovery();",
      handler,
    );
    const update = authService.indexOf("await supabase.auth.updateUser({", authority);

    expect(handler).toBeGreaterThanOrEqual(0);
    expect(authority).toBeGreaterThan(handler);
    expect(update).toBeGreaterThan(authority);
  });

  it("signs out only after a successful password mutation from a recovery session", () => {
    const handler = authService.indexOf(
      "static async updatePassword(newPassword: string, nonce?: string): Promise<void>",
    );
    const update = authService.indexOf("await supabase.auth.updateUser({", handler);
    const errorGuard = authService.indexOf("if (error) throw error;", update);
    const recoveryGuard = authService.indexOf(
      "if (isRecoverySession) {",
      errorGuard,
    );
    const signOut = authService.indexOf("await AuthService.signOut();", recoveryGuard);

    expect(update).toBeGreaterThan(handler);
    expect(errorGuard).toBeGreaterThan(update);
    expect(recoveryGuard).toBeGreaterThan(errorGuard);
    expect(signOut).toBeGreaterThan(recoveryGuard);
  });

  it("keeps the recovery success surface explicitly returning to login", () => {
    expect(recoveryPage).toContain("Senha atualizada.");
    expect(recoveryPage).toContain("Entre com a nova senha.");
    expect(recoveryPage).toContain("buildPasswordResetSuccessLoginPath()");
    expect(recoveryPage).toContain('replace: true');
  });
});
