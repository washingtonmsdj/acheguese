import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const authService = read("src/core/auth/services/AuthService.ts");
const authMessages = read("src/core/auth/utils/authMessages.ts");
const recoveryPage = read("src/app/pages/ResetPasswordPage.tsx");

describe("password recovery session disposal", () => {
  it("keeps recovery password mutation separate from ordinary account changes", () => {
    const ordinary = authService.indexOf(
      "static async updatePassword(newPassword: string, nonce?: string): Promise<void>",
    );
    const recovery = authService.indexOf(
      "static async updateRecoveredPassword(newPassword: string): Promise<void>",
    );

    expect(ordinary).toBeGreaterThanOrEqual(0);
    expect(recovery).toBeGreaterThan(ordinary);
    expect(
      authService.slice(ordinary, recovery),
    ).not.toContain("AuthRecoveryAuthority.isCurrentSessionRecovery()");
  });

  it("requires verified recovery authority before mutating the password", () => {
    const handler = authService.indexOf(
      "static async updateRecoveredPassword(newPassword: string): Promise<void>",
    );
    const authority = authService.indexOf(
      "await AuthRecoveryAuthority.isCurrentSessionRecovery();",
      handler,
    );
    const failClosed = authService.indexOf(
      '"RECOVERY_SESSION_REQUIRED"',
      authority,
    );
    const update = authService.indexOf("await supabase.auth.updateUser({", failClosed);

    expect(handler).toBeGreaterThanOrEqual(0);
    expect(authority).toBeGreaterThan(handler);
    expect(failClosed).toBeGreaterThan(authority);
    expect(update).toBeGreaterThan(failClosed);
  });

  it("signs out only after a successful verified recovery mutation", () => {
    const handler = authService.indexOf(
      "static async updateRecoveredPassword(newPassword: string): Promise<void>",
    );
    const update = authService.indexOf("await supabase.auth.updateUser({", handler);
    const errorGuard = authService.indexOf("if (error) throw error;", update);
    const signOut = authService.indexOf("await AuthService.signOut();", errorGuard);

    expect(update).toBeGreaterThan(handler);
    expect(errorGuard).toBeGreaterThan(update);
    expect(signOut).toBeGreaterThan(errorGuard);
  });

  it("distinguishes a changed password from a failed temporary-session disposal", () => {
    const handler = authService.indexOf(
      "static async updateRecoveredPassword(newPassword: string): Promise<void>",
    );
    const update = authService.indexOf("await supabase.auth.updateUser({", handler);
    const disposalError = authService.indexOf(
      '"RECOVERY_SESSION_DISPOSAL_FAILED"',
      update,
    );

    expect(disposalError).toBeGreaterThan(update);
    expect(authMessages).toContain(
      'code === "RECOVERY_SESSION_DISPOSAL_FAILED"',
    );
    expect(recoveryPage).toContain("isRecoverySessionDisposalError(error)");
    expect(recoveryPage).toContain('setView("dispose-error")');
    expect(recoveryPage).toContain('view === "dispose-error"');
    expect(recoveryPage).toContain("Sua nova senha já foi salva.");
  });

  it("retries only temporary-session disposal and never repeats the password mutation", () => {
    const retryHandler = recoveryPage.indexOf(
      "const retryRecoverySessionDisposal = async () => {",
    );
    const retryEnd = recoveryPage.indexOf("const title =", retryHandler);
    const retryFlow = recoveryPage.slice(retryHandler, retryEnd);

    expect(retryHandler).toBeGreaterThanOrEqual(0);
    expect(retryEnd).toBeGreaterThan(retryHandler);
    expect(retryFlow).toContain("await AuthService.signOut();");
    expect(retryFlow).toContain('setView("success")');
    expect(retryFlow).not.toContain("updateRecoveredPassword");
    expect(retryFlow).not.toContain("updateUser");
    expect(retryFlow).toContain("recoverySessionDisposalInFlight.current");
    expect(recoveryPage).toContain("Tentar encerrar sessão");
  });

  it("never promotes the recovery page from URL tokens or a preexisting user", () => {
    expect(recoveryPage).toContain(
      'AuthService.onPasswordRecovery(() => setView("reset"))',
    );
    expect(recoveryPage).toContain("AuthService.updateRecoveredPassword");
    expect(recoveryPage).not.toContain("hasPasswordRecoverySessionMarker");
    expect(recoveryPage).not.toContain("hasPendingPkceCode");
    expect(recoveryPage).not.toContain("if (user && hasRecoveryMarker");
  });

  it("keeps the recovery success surface explicitly returning to login", () => {
    expect(recoveryPage).toContain("Senha atualizada.");
    expect(recoveryPage).toContain("Entre com a nova senha.");
    expect(recoveryPage).toContain("buildPasswordResetSuccessLoginPath()");
    expect(recoveryPage).toContain('replace: true');
  });
});
