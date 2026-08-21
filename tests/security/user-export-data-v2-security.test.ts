import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(
    process.cwd(),
    "supabase/functions/user-export-data/index.ts",
  ),
  "utf8",
);

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

  it("fails closed when any required query fails", () => {
    expect(source).toContain("async function requireRows(");
    expect(source).toContain("EXPORT_SECTION_FAILED:${section}");
    expect(source).toContain("EXPORT_AUTH_USER_UNAVAILABLE");
    expect(source).toContain("EXPORT_AUDIT_FAILED");
    expect(source).not.toContain("Não falhar se logging falhar");
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
  });

  it("exports only messages authored by subject-owned profiles", () => {
    expect(source).toContain('"messages_sent"');
    expect(source).toContain('"direct_messages_sent"');
    expect(source).toContain('"group_messages_sent"');
    expect(source).toContain('"sender_profile_id"');
    expect(source).not.toContain("conversation_participants");
  });

  it("exports subject report submissions without moderation internals", () => {
    expect(source).toContain("function sanitizeReports(");
    expect(source).toContain("reports_submitted: sanitizeReports(reportSections.flat())");
    for (const marker of [
      "admin_notes: row.admin_notes",
      "moderator_notes: row.moderator_notes",
      "resolution_notes: row.resolution_notes",
      "reviewed_by: row.reviewed_by",
    ]) {
      expect(source).not.toContain(marker);
    }
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

  it("returns no-store JSON and writes a compliance audit before success", () => {
    expect(source).toContain('"Cache-Control": "no-store"');
    expect(source).toContain('"Content-Type": "application/json; charset=utf-8"');
    expect(source).toContain('p_source: "edge:user-export-data:v2"');
    expect(source).toContain('action: "DATA_EXPORT_COMPLETED"');
  });
});
