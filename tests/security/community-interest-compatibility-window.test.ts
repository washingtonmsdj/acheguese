import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const additive = read(
  "supabase/migrations/20260809184409_create_authoritative_community_interest_registration.sql",
);
const cutoverPath =
  "docs/09-reference/migrations-pending/20260810152014_finalize_community_interest_cutover.sql";
const cutover = read(cutoverPath);
const frontendService = read(
  "src/core/routing/services/CommunityInterestRegistrationService.ts",
);
const edgeFunction = read(
  "supabase/functions/register-community-interest/index.ts",
);

const LEGACY_INSERT_COLUMNS = [
  "community_id",
  "community_slug",
  "territory_path",
  "full_name",
  "email",
  "phone",
  "role",
  "message",
  "wants_updates",
  "source",
  "user_agent",
  "turnstile_verified",
];

function grantedLegacyColumns(sql: string): string[] {
  const match = sql.match(
    /GRANT INSERT \(([\s\S]*?)\) ON public\.community_interest_registrations TO anon, authenticated;/,
  );
  if (!match?.[1]) return [];
  return match[1]
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
}

describe("Community Interest ADDITIVE compatibility contract", () => {
  it("creates the new enum, table, constraints, indexes, trigger and RLS contract", () => {
    expect(additive).toContain(
      "CREATE TYPE public.community_interest_role AS ENUM",
    );
    expect(additive).toContain(
      "CREATE TABLE IF NOT EXISTS public.community_interest_registrations",
    );
    expect(additive).toContain("community_interest_unique_email_per_community");
    expect(additive).toContain("tg_community_interest_touch_updated_at");
    expect(additive).toContain(
      "ALTER TABLE public.community_interest_registrations ENABLE ROW LEVEL SECURITY;",
    );
    expect(additive).toContain("community_interest_admin_select");
    expect(additive).toContain("community_interest_admin_update");
    expect(additive).toContain("community_interest_admin_delete");
  });

  it("preserves exactly the deployed legacy insert columns", () => {
    expect(grantedLegacyColumns(additive)).toEqual(LEGACY_INSERT_COLUMNS);
    expect(additive).toContain(
      "CREATE POLICY community_interest_legacy_insert",
    );
    expect(additive).toContain("TEMPORARY LEGACY COMPATIBILITY");
  });

  it("keeps server-owned and administrative fields outside the legacy grant", () => {
    const granted = grantedLegacyColumns(additive);
    expect(granted).not.toContain("id");
    expect(granted).not.toContain("user_id");
    expect(granted).not.toContain("admin_status");
    expect(granted).not.toContain("admin_notes");
    expect(granted).not.toContain("reviewed_at");
    expect(granted).not.toContain("reviewed_by");
    expect(granted).not.toContain("created_at");
    expect(granted).not.toContain("updated_at");
    expect(additive).toMatch(/user_id IS NULL[\s\S]*admin_status = 'new'/);
  });

  it("does not expose anonymous SELECT, UPDATE or DELETE", () => {
    expect(additive).not.toMatch(
      /GRANT\s+SELECT[^;]*\sTO\s+(?:PUBLIC|anon)\b/i,
    );
    expect(additive).not.toMatch(
      /GRANT\s+UPDATE[^;]*\sTO\s+(?:PUBLIC|anon)\b/i,
    );
    expect(additive).not.toMatch(
      /GRANT\s+DELETE[^;]*\sTO\s+(?:PUBLIC|anon)\b/i,
    );
    expect(additive).not.toMatch(/FOR (?:SELECT|UPDATE|DELETE)\s+TO anon/i);
  });

  it("does not perform the final legacy writer revocation prematurely", () => {
    expect(additive).not.toMatch(
      /REVOKE INSERT ON TABLE public\.community_interest_registrations\s+FROM anon, authenticated;/,
    );
    expect(additive).toContain("community_interest_legacy_insert");
    expect(additive).toContain("TO anon, authenticated");
  });
});

describe("Community Interest target broker", () => {
  it("keeps the new frontend Edge-only with no silent direct-insert fallback", () => {
    expect(frontendService).toContain(
      'supabase.functions.invoke("register-community-interest"',
    );
    expect(frontendService).not.toContain(
      '.from("community_interest_registrations")',
    );
    expect(frontendService).not.toContain("legacy");
    expect(frontendService).not.toContain("fallback");
  });

  it("keeps service_role exclusively in the server-side broker", () => {
    expect(edgeFunction).toContain("getSupabaseAdminClient");
    expect(edgeFunction).toContain('.from("community_interest_registrations")');
    expect(frontendService).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(frontendService).not.toContain("getSupabaseAdminClient");
  });
});

describe("Community Interest staged CUTOVER", () => {
  it("removes the legacy policy and both column/table INSERT grants", () => {
    expect(cutover).toContain(
      "DROP POLICY IF EXISTS community_interest_legacy_insert",
    );
    expect(cutover).toMatch(
      /REVOKE INSERT \([\s\S]*?\) ON public\.community_interest_registrations FROM anon, authenticated;/,
    );
    expect(cutover).toMatch(
      /REVOKE INSERT ON TABLE public\.community_interest_registrations\s+FROM anon, authenticated;/,
    );
  });

  it("preserves the broker and fails closed without operational evidence", () => {
    expect(cutover).toContain(
      "GRANT INSERT ON TABLE public.community_interest_registrations TO service_role;",
    );
    for (const evidence of [
      "EDGE_FUNCTION_DEPLOYED",
      "TURNSTILE_SECRET_CONFIGURED",
      "ALLOWED_ORIGINS_CONFIGURED",
      "BROKER_FRONTEND_DEPLOYED",
    ]) {
      expect(cutover).toContain(
        `MANUAL_OPERATIONAL_EVIDENCE ${evidence} missing`,
      );
    }
  });

  it("remains outside the active migration queue", () => {
    const activeNames = readdirSync(join(root, "supabase/migrations"));
    expect(activeNames).not.toContain(
      "20260810152014_finalize_community_interest_cutover.sql",
    );
    expect(cutoverPath).toMatch(/^docs\/09-reference\/migrations-pending\//);
  });
});
