import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const edge = readFileSync(resolve(root, "supabase/functions/session-rpc/index.ts"), "utf8");
const broker = readFileSync(
  resolve(root, "src/core/session/services/SessionRpcService.ts"),
  "utf8",
);
const config = readFileSync(resolve(root, "supabase/config.toml"), "utf8");

describe("session-rpc Supabase Auth authority", () => {
  it("keeps the deployed broker action surface explicit and minimal", () => {
    for (const action of [
      "getActiveProfile",
      "switchActiveProfile",
      "checkMfaRequired",
      "revokeAllSessions",
    ]) {
      expect(edge).toContain(`${action}: true`);
      expect(broker).toContain(`| \"${action}\"`);
    }

    expect(edge).not.toContain("revokeSession: true");
    expect(edge).not.toContain("updateSessionActivity: true");
    expect(broker).not.toContain('| "revokeSession"');
    expect(broker).not.toContain('| "updateSessionActivity"');
  });

  it("uses Supabase Auth instead of the empty legacy user_sessions tracker for revocation", () => {
    expect(edge).toContain("supabaseAdmin.auth.admin.signOut(token, scope)");
    expect(edge).toContain('const scope = exceptCurrent ? "others" : "global"');
    expect(edge).toContain("requiresLocalSignOut: scope === \"global\"");
    expect(edge).not.toMatch(/\.from\(["']user_sessions["']\)/);
  });

  it("does not restore individual legacy session mutations on the client broker", () => {
    expect(broker).not.toContain('| "revokeSession"');
    expect(broker).not.toContain('| "updateSessionActivity"');
    expect(broker).not.toContain("revoke_user_session");
    expect(broker).not.toContain("update_session_activity");
  });

  it("returns explicit local-sign-out intent for a global authoritative revoke", () => {
    expect(edge).toContain('requiresLocalSignOut: scope === "global"');
    expect(broker).toContain("requiresLocalSignOut: boolean");
  });

  it("keeps JWT verification enabled for session-rpc", () => {
    expect(config).toMatch(
      /\[functions\.session-rpc\][\s\S]*?verify_jwt\s*=\s*true/,
    );
  });
});
