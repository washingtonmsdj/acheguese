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

function expectSectionKey(section: string) {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  expect(source).toMatch(new RegExp(`\\b${escaped}\\s*(?::|,)`));
}

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
    expect(source).toContain("enforceSectionLimit(section, rows)");
    expect(source).toContain("EXPORT_SECTION_FAILED:${section}");
    expect(source).toContain("EXPORT_SECTION_TOO_LARGE:${section}");
    expect(source).toContain('overflow_behavior: "fail-closed"');
    expect(source).toContain("EXPORT_AUTH_USER_UNAVAILABLE");
    expect(source).toContain("EXPORT_AUDIT_FAILED");
  });

  it("covers every non-excluded canonical matrix section and public source", () => {
    expect(matrix.schemaVersion).toBe("lgpd-export-matrix/v1");

    for (const section of matrix.sections.filter((entry) => entry.scope !== "excluded")) {
      expectSectionKey(section.section);

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

  it("redacts ride details by the subject role", () => {
    expect(source).toContain("function sanitizeRides(");
    expect(source).toContain("const isPassenger = Boolean(");
    expect(source).toContain("const isDriver = Boolean(");
    expect(source).toContain("subject_roles: subjectRoles");
    expect(source).toContain(
      "origin: isPassenger ? row.origin : undefined",
    );
    expect(source).toContain(
      "destination: isPassenger ? row.destination : undefined",
    );
    expect(source).not.toContain("observation: row.observation");
    expect(source).not.toMatch(/return\s*\{[^}]*passenger_profile_id/s);
    expect(source).not.toMatch(/return\s*\{[^}]*driver_profile_id/s);
  });

  it("redacts order financial splits by the subject role", () => {
    expect(source).toContain("function sanitizeOrders(");
    expect(source).toContain("const isCustomer = Boolean(");
    expect(source).toContain("const isMerchant = Boolean(");
    expect(source).toContain("const isCourier = Boolean(");
    expect(source).toContain(
      "merchant_net_amount: isMerchant ? row.merchant_net_amount : undefined",
    );
    expect(source).toContain(
      "courier_amount: isCourier ? row.courier_amount : undefined",
    );
    expect(source).toContain(
      "payment_method: isCustomer ? row.payment_method : undefined",
    );
    expect(source).not.toContain("notes: row.notes");
    expect(source).not.toContain("source_reference: row.source_reference");
    expect(source).not.toContain("source_id: row.source_id");
    expect(source).not.toMatch(/return\s*\{[^}]*customer_profile_id/s);
    expect(source).not.toMatch(/return\s*\{[^}]*merchant_profile_id/s);
    expect(source).not.toMatch(/return\s*\{[^}]*courier_profile_id/s);
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
      "classified_favorites",
      "professional_favorites",
      "tourist_point_saved_items",
      "vaga_saved_items",
      "user_favorite_businesses",
      "work_opportunities",
      "communication_publications",
    ]) {
      expect(source).toContain(`"${table}"`);
    }
  });

  it("exports subject report submissions without target or moderation identifiers", () => {
    expect(source).toContain("function sanitizeReports(kind: string");
    for (const kind of [
      "community",
      "direct_message",
      "review",
      "ride",
      "vaga",
      "group_message",
    ]) {
      expect(source).toContain(`sanitizeReports("${kind}"`);
    }
    for (const marker of [
      "target_id: row.target_id",
      "review_id: row.review_id",
      "ride_id: row.ride_id",
      "vaga_id: row.vaga_id",
      "group_id: row.group_id",
      "message_id: row.message_id",
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
    expect(source).toContain('"id,action,reason,performed_at"');
    expect(source).not.toContain("performed_by: row.performed_by");
    expect(source).not.toContain("resolved_by: row.resolved_by");
  });

  it("does not serialize matrix-excluded identifiers from strict sections", () => {
    expect(source).toContain(
      '"table_name,field_name,operation,access_reason,access_reason_category,accessed_at,source,retention_until"',
    );
    expect(source).toContain(
      '"id,preset,mime_type,byte_size,width,height,state,attached_at,deleted_at,created_at,updated_at"',
    );
    expect(source).toContain(
      '"verification_type,submitted_at,reviewed_at,status,review_reason,created_at,updated_at"',
    );
    expect(source).toContain(
      '"relationship,is_primary,is_active,created_at,updated_at"',
    );
    expect(source).not.toContain('"action_url"');
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
    for (const section of matrix.sections.filter((entry) => entry.scope !== "excluded")) {
      expectSectionKey(section.section);
    }
  });

  it("returns no-store JSON and writes a compliance audit before success", () => {
    expect(source).toContain('"Cache-Control": "no-store"');
    expect(source).toContain('"Content-Type": "application/json; charset=utf-8"');
    expect(source).toContain('p_source: "edge:user-export-data:v2"');
    expect(source).toContain('action: "DATA_EXPORT_COMPLETED"');
  });
});
