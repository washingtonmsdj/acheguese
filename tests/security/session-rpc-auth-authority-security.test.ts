import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const edge = readFileSync(resolve(root, "supabase/functions/session-rpc/index.ts"), "utf8");
const broker = readFileSync(
  resolve(root, "src/core/session/services/SessionRpcService.ts"),
  "utf8",
);
const service = readFileSync(
  resolve(root, "src/core/auth/services/SessionService.ts"),
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

  it("keeps individual legacy mutations fail-closed on the client", () => {
    expect(service).toContain("SessionService.revokeSession.unsupported");
    expect(service).toContain("SessionService.updateActivity.skipped");
    expect(service).not.toContain("SessionRpcService.revokeSession");
    expect(service).not.toContain("SessionRpcService.updateSessionActivity");
  });

  it("clears the current local session when the authoritative revoke is global", () => {
    expect(service).toContain("if (result.requiresLocalSignOut)");
    expect(service).toContain("supabase.auth.signOut({ scope: 'local' })");
  });

  it("keeps JWT verification enabled for session-rpc", () => {
    expect(config).toMatch(
      /\[functions\.session-rpc\][\s\S]*?verify_jwt\s*=\s*true/,
    );
  });
});
