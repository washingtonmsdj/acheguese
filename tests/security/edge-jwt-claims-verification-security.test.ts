import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function source(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

const helper = source("supabase/functions/_shared/verifiedJwt.ts");
const config = source("supabase/config.toml");
const brokerPaths = [
  "supabase/functions/session-rpc/index.ts",
  "supabase/functions/profile-rpc/index.ts",
  "supabase/functions/privacy-rpc/index.ts",
  "supabase/functions/role-rpc/index.ts",
];

describe("Edge broker JWT verification authority", () => {
  it("verifies authenticated identity through signed claims instead of /user", () => {
    expect(helper).toContain("supabase.auth.getClaims(token)");
    expect(helper).toContain('data.claims.role !== "authenticated"');
    expect(helper).toContain('audience === "authenticated"');
    expect(helper).toContain("UUID_PATTERN.test(subject)");

    for (const path of brokerPaths) {
      const edge = source(path);
      expect(edge, path).toContain(
        "verifyAuthenticatedSubject(supabaseAdmin, token)",
      );
      expect(edge, path).not.toContain("supabaseAdmin.auth.getUser(token)");
    }
  });

  it("keeps platform JWT verification enabled on every migrated broker", () => {
    for (const functionName of [
      "session-rpc",
      "profile-rpc",
      "privacy-rpc",
      "role-rpc",
    ]) {
      expect(config).toMatch(
        new RegExp(
          `\\[functions\\.${functionName}\\][\\s\\S]*?verify_jwt\\s*=\\s*true`,
        ),
      );
    }
  });

  it("does not replace identity verification with session-local trust", () => {
    expect(helper).not.toContain("getSession(");
    for (const path of brokerPaths) {
      expect(source(path), path).not.toContain(".auth.getSession(");
    }
  });
});
