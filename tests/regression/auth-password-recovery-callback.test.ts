import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("password recovery callback settlement", () => {
  it("does not treat an existing session as proof while a PKCE code is still pending", () => {
    const recovery = read("src/app/pages/ResetPasswordPage.tsx");

    expect(recovery).toContain("const liveSearch = window.location.search;");
    expect(recovery).toContain("const liveHash = window.location.hash;");
    expect(recovery).toContain("new URLSearchParams(liveSearch).has(");
    expect(recovery).toContain("AUTH_QUERY_KEYS.code");
    expect(recovery).toContain(
      "if (user && hasRecoveryMarker && !hasPendingPkceCode)",
    );
    expect(recovery).not.toContain("if (user && hasRecoveryMarker) {");
  });

  it("keeps failed callbacks visible until the recovery page can reject them", () => {
    const client = read("src/integrations/supabase/supabase.ts");
    const recovery = read("src/app/pages/ResetPasswordPage.tsx");

    expect(client).toContain("detectSessionInUrl: true");
    expect(client).toContain('flowType: "pkce"');
    expect(client).not.toContain("cleanAuthReturnUrl");
    expect(client).not.toContain("hasAuthReturnParams");
    expect(recovery).toContain("AUTH_BROWSER_STORAGE_CONFIG.recoveryEventTimeoutMs");
    expect(recovery).toContain('setView((current) => (current === "checking" ? "invalid" : current))');
  });
});
