import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const source = readFileSync(
  join(ROOT, "supabase/functions/user-export-data/index.ts"),
  "utf8",
);
const matrix = JSON.parse(
  readFileSync(
    join(
      ROOT,
      "docs/09-reference/governance/privacy/LGPD_EXPORT_MATRIX.json",
    ),
    "utf8",
  ),
) as {
  schemaVersion: string;
  sections: Array<{
    section: string;
    sources: string[];
    scope: string;
  }>;
};

describe("user-export-data v2", () => {
  it("remains explicitly uncertified for production rollout", () => {
    expect(source).toContain(
      "const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = false;",
    );
    expect(source).not.toContain(
      "const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = true;",
    );
    expect(source).toContain('const MATRIX_VERSION = "lgpd-export-matrix/v1";');
    expect(source).toContain('const FORMAT_VERSION = "2.0-draft";');
  });

  it("uses authenticated subject identity and required env configuration", () => {
    expect(source).toContain("extractBearerToken(req)");
    expect(source).toContain('getRequiredEnv("SUPABASE_URL")');
    expect(source).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(source).toContain("supabaseAdmin.auth.getUser(token)");
    expect(source).toContain("supabaseAdmin.auth.admin.getUserById(userId)");
  });

  it("paginates required sections and fails closed instead of truncating", () => {
    expect(source).toContain("async function requireAllRows(");
    expect(source).toContain("const PAGE_SIZE = 500;");
    expect(source).toContain("const MAX_ROWS_PER_SECTION = 50_000;");
    expect(source).toContain("query.range(from, to)");
    expect(source).toContain("EXPORT_SECTION_FAILED:${section}");
    expect(source).toContain("EXPORT_SECTION_TOO_LARGE:${section}");
    expect(source).toContain('overflow_behavior: "fail-closed"');
    expect(source).toContain("EXPORT_AUTH_USER_UNAVAILABLE");
    expect(source).toContain("EXPORT_AUDIT_FAILED");
  });

  it("covers every non-excluded canonical matrix section and source", () => {
    expect(matrix.schemaVersion).toBe("lgpd-export-matrix/v1");

    for (const section of matrix.sections.filter((entry) => entry.scope !== "excluded")) {
      expect(source, `missing output section ${section.section}`).toContain(
        `${section.section}:`,
      );

      for (const sourceName of section.sources) {
        if (sourceName.startsWith("public.")) {
          const table = sourceName.slice("public.".length);
          expect(source, `missing source table ${sourceName}`).toContain(`"${table}"`);
        }
      }
    }

    expect(source).toContain("authData.user");
    expect(source).toContain("identities: authIdentities");
    expect(source).toContain("factors: authFactors");
  });

  it("keeps excluded operational sources out of the export", () => {
    for (const marker of [
      '"application_logs"',
      '"function_audit"',
      '"billing_audit_log"',
      '"user_sessions"',
    ]) {
      expect(source).not.toContain(marker);
    }
  });

  it("contains no broad select-star or stale ownership/session contracts", () => {
    for (const marker of [
      ".select('*')",
      ".select('*,",
      '.select("*")',
      '.select("*,',
      ".eq('owner_id', userId)",
      ".eq('passenger_id', userId)",
      ".eq('organizer_id', userId)",
      ".from('user_sessions')",
      ".from('application_logs')",
      "app_metadata:",
      "identity_data:",
    ]) {
      expect(source).not.toContain(marker);
    }
  });

  it("redacts shared ride/order counterpart identifiers before serialization", () => {
    expect(source).toContain("function sanitizeRides(");
    expect(source).toContain("function sanitizeOrders(");
    expect(source).toContain("subject_roles: subjectRoles");
    expect(source).not.toMatch(/return\s*\{[^}]*passenger_profile_id/s);
    expect(source).not.toMatch(/return\s*\{[^}]*driver_profile_id/s);
    expect(source).not.toMatch(/return\s*\{[^}]*customer_profile_id/s);
    expect(source).not.toMatch(/return\s*\{[^}]*merchant_profile_id/s);
    expect(source).not.toMatch(/return\s*\{[^}]*courier_profile_id/s);
    expect(source).not.toContain("source_reference: row.source_reference");
    expect(source).not.toContain("source_id: row.source_id");
  });

  it("exports only messages authored by subject-owned profiles", () => {
    expect(source).toContain('"messages_sent"');
    expect(source).toContain('"direct_messages_sent"');
    expect(source).toContain('"group_messages_sent"');
    expect(source).toContain('"sender_profile_id"');
    expect(source).not.toContain("conversation_participants");
  });

  it("covers community actions, saved items and authored work/communication", () => {
    for (const table of [
      "community_memberships",
      "group_members_new",
      "community_poll_votes",
      "community_issue_supports",
      "profile_favorites",
      "classified_favorites",
      "professional_favorites",
      "event_favorites",
      "tourist_point_saved_items",
      "vaga_saved_items",
      "user_favorite_businesses",
      "work_opportunities",
      "communication_publications",
    ]) {
      expect(source).toContain(`"${table}"`);
    }
  });

  it("exports subject report submissions without moderation internals", () => {
    expect(source).toContain("function sanitizeReports(");
    expect(source).toContain("reports_submitted: sanitizeReports(reportSections.flat())");
    expect(source).toContain('"group_message_reports"');
    for (const marker of [
      "admin_notes: row.admin_notes",
      "moderator_notes: row.moderator_notes",
      "resolution_notes: row.resolution_notes",
      "reviewed_by: row.reviewed_by",
      "reported_profile_id: row.reported_profile_id",
    ]) {
      expect(source).not.toContain(marker);
    }
  });

  it("exports only approved security-state summaries", () => {
    expect(source).toContain("security_state_summary:");
    expect(source).toContain(
      '"id,reason,banned_at,expires_at,is_active"',
    );
    expect(source).toContain(
      '"id,anomaly_type,severity,action_taken,auto_resolved,resolved_at,detected_at,created_at"',
    );
    expect(source).toContain(
      '"id,profile_id,action,reason,performed_at"',
    );
    expect(source).not.toContain("performed_by: row.performed_by");
    expect(source).not.toContain("resolved_by: row.resolved_by");
  });

  it("never serializes storage/push/session secrets", () => {
    expect(source).not.toContain('"storage_reference"');
    expect(source).not.toContain('"object_path"');
    expect(source).not.toContain('"sha256"');
    expect(source).not.toContain('"p256dh"');
    expect(source).not.toContain('"endpoint"');
    expect(source).not.toContain('"refresh_token_hash"');
    expect(source).not.toContain('"session_token"');
  });

  it("aligns output keys with the canonical matrix section names", () => {
    for (const section of [
      "account",
      "auth_identities",
      "auth_factors",
      "profiles",
      "profile_memberships",
      "community_membership_and_actions",
      "favorites_and_saved_items",
      "security_state_summary",
      "push_credentials",
    ]) {
      expect(source).toContain(`${section}:`);
    }
  });

  it("returns no-store JSON and writes a compliance audit before success", () => {
    expect(source).toContain('"Cache-Control": "no-store"');
    expect(source).toContain('"Content-Type": "application/json; charset=utf-8"');
    expect(source).toContain('p_source: "edge:user-export-data:v2"');
    expect(source).toContain('action: "DATA_EXPORT_COMPLETED"');
  });
});
