import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const BASELINE = "20260830054715_correct_community_issue_rpc_provenance.sql";

describe("G5 community issue RPC provenance", () => {
  it("documents the authenticated invoker wrapper instead of the obsolete Edge-only route", () => {
    const correction = readFileSync(join(MIGRATIONS, BASELINE), "utf8");
    const authority = readFileSync(
      join(MIGRATIONS, "20260713133000_harden_community_issue_runtime.sql"),
      "utf8",
    );

    expect(authority).toContain(
      "-- security-authority: public-rpc public.create_community_issue",
    );
    expect(authority).toMatch(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.create_community_issue\(payload\s+JSONB\)[\s\S]*?SECURITY\s+INVOKER/i,
    );
    expect(authority).toContain("SELECT private.create_community_issue(payload)");
    expect(authority).toMatch(
      /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.create_community_issue\(JSONB\)\s+TO\s+authenticated/i,
    );

    expect(correction).toContain("v_security_definer IS DISTINCT FROM FALSE");
    expect(correction).toContain("v_auth_exec IS DISTINCT FROM TRUE");
    expect(correction).toContain("v_service_exec IS DISTINCT FROM FALSE");
    expect(correction).toContain(
      "Authenticated SECURITY INVOKER wrapper over private.create_community_issue",
    );
    expect(correction).not.toContain(
      "Browser access is routed through community-rpc with actor user derived from JWT",
    );
  });
});
