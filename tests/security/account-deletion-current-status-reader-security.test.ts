import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const currentReaderMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20261006050045_add_current_account_deletion_status_reader.sql",
  ),
  "utf8",
);
const privilegedAuthorityMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260826015916_reconcile_account_deletion_authority_live_drift.sql",
  ),
  "utf8",
);

describe("current-user account deletion status authority", () => {
  it("derives browser identity only from auth.uid without an identity parameter", () => {
    expect(currentReaderMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.get_current_account_deletion_status()",
    );
    expect(currentReaderMigration).toContain("v_user_id UUID := auth.uid();");
    expect(currentReaderMigration).toContain("IF v_user_id IS NULL THEN");
    expect(currentReaderMigration).toContain(
      "WHERE request.user_id = v_user_id;",
    );
    expect(currentReaderMigration).not.toContain("p_user_id");
  });

  it("keeps the read bounded and exposes only the fields required by the client gate", () => {
    expect(currentReaderMigration).toContain("SET statement_timeout = '2s'");
    expect(currentReaderMigration).toContain("'status', v_request.status");
    expect(currentReaderMigration).toContain(
      "'scheduledPurgeAt', v_request.scheduled_purge_at",
    );
    expect(currentReaderMigration).toContain("'daysRemaining', v_days");
    expect(currentReaderMigration).not.toContain("'requestId'");
    expect(currentReaderMigration).not.toContain("'exportRequested'");
  });

  it("revokes anonymous execution and grants the self-only reader explicitly to authenticated", () => {
    expect(currentReaderMigration).toContain(
      "REVOKE ALL ON FUNCTION public.get_current_account_deletion_status()\n  FROM PUBLIC, anon, authenticated;",
    );
    expect(currentReaderMigration).toContain(
      "GRANT EXECUTE ON FUNCTION public.get_current_account_deletion_status()\n  TO authenticated;",
    );
  });

  it("preserves arbitrary-user deletion status authority as service-role-only", () => {
    expect(privilegedAuthorityMigration).toContain(
      "REVOKE ALL ON FUNCTION public.get_account_deletion_status_for_user(UUID) FROM PUBLIC;",
    );
    expect(privilegedAuthorityMigration).toContain(
      "REVOKE ALL ON FUNCTION public.get_account_deletion_status_for_user(UUID) FROM anon;",
    );
    expect(privilegedAuthorityMigration).toContain(
      "REVOKE ALL ON FUNCTION public.get_account_deletion_status_for_user(UUID) FROM authenticated;",
    );
    expect(privilegedAuthorityMigration).toContain(
      "GRANT EXECUTE ON FUNCTION public.get_account_deletion_status_for_user(UUID) TO service_role;",
    );
  });
});
