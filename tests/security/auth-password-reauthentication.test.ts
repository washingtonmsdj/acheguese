import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const authService = read("src/core/auth/services/AuthService.ts");
const authHook = read("src/core/auth/hooks/useAuth.ts");
const config = read("supabase/config.toml");
const packageLock = read("package-lock.json");

describe("password reauthentication authority", () => {
  it("matches the versioned secure password change policy", () => {
    expect(config).toContain("secure_password_change = true");
    expect(authService).toContain("supabase.auth.reauthenticate()");
    expect(authService).toContain("requestPasswordReauthentication");
    expect(authService).toContain("...(normalizedNonce ? { nonce: normalizedNonce } : {})");
    expect(authHook).toContain("requestPasswordReauthentication");
    expect(authHook).toContain("AuthService.updatePassword(newPassword, nonce)");
  });

  it("does not pretend currentPassword is supported by the locked SDK", () => {
    expect(packageLock).toContain('"node_modules/@supabase/supabase-js"');
    expect(packageLock).toContain('"version": "2.99.3"');
    expect(authService).not.toContain("currentPassword:");
    expect(authService).not.toContain("current_password:");
  });

  it("keeps manual identity linking disabled in the versioned auth policy", () => {
    expect(config).toContain("enable_manual_linking = false");
  });
});
