import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const federationMigration = read(
  "supabase/migrations/20260715101000_create_federated_moderation_queue.sql",
);
const billingMigration = read(
  "supabase/migrations/20260715102000_fix_user_deletion_billing_audit.sql",
);
const auditReaderMigration = read(
  "supabase/migrations/20260715103000_create_community_social_audit_reader.sql",
);
const auditHardeningMigration = read(
  "supabase/migrations/20260715104000_harden_community_audit_and_report_contracts.sql",
);
const reportTargetsMigration = read(
  "supabase/migrations/20260715105000_extend_community_report_targets.sql",
);
const reportGuardMigration = read(
  "supabase/migrations/20260715106000_fix_community_report_guard_privilege_chain.sql",
);
const activeBanMigration = read(
  "supabase/migrations/20260715107000_create_current_active_ban_reader.sql",
);
const auditContracts = read("src/core/audit/contracts.ts");
const activeBanReader = read("src/core/trust/services/ActiveBanReader.ts");
const ssotLintRule = read("eslint-rules/plugins/eslint-plugin-ssot.cjs");
const ownershipManifest = JSON.parse(
  read("docs/architecture/core-platform-ownership.json"),
) as {
  controlledTables: Array<{
    name: string;
    currentOwner: string;
    targetOwner: string;
  }>;
  controlledRpcs: Array<{
    name: string;
    currentOwner: string;
    targetOwner: string;
  }>;
};

describe("Audit and Moderation SSOT", () => {
  it("keeps federation admin-only, bounded and free of sensitive text", () => {
    expect(federationMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.list_federated_moderation_queue",
    );
    expect(federationMigration).toContain("private.is_admin_user(auth.uid())");
    expect(federationMigration).toContain("SET statement_timeout = '3s'");
    expect(federationMigration).toContain(
      "LEAST(GREATEST(COALESCE(p_limit, 30), 1), 51)",
    );

    for (const domain of [
      "community_content",
      "classified",
      "vaga",
      "review",
      "ride",
      "group_message",
      "community_direct",
      "community_alert",
      "community_issue",
    ]) {
      expect(federationMigration).toContain(`'${domain}'`);
    }

    const returnContract = federationMigration.match(
      /RETURNS TABLE \(([\s\S]*?)\)\s*LANGUAGE/,
    )?.[1];
    expect(returnContract).toBeDefined();
    expect(returnContract).not.toMatch(
      /reporter|description|admin_notes|message_body|content|media/i,
    );
  });

  it("exposes Community audit only through the bounded admin reader", () => {
    expect(auditReaderMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.list_community_social_audit_events",
    );
    expect(auditReaderMigration).toContain("private.is_admin_user(auth.uid())");
    expect(auditReaderMigration).toContain(
      "(audit.created_at, audit.id) < (p_before_created_at, p_before_id)",
    );
    expect(auditReaderMigration).toContain("SET statement_timeout = '3s'");
    expect(auditHardeningMigration).toContain(
      "REVOKE SELECT ON TABLE public.community_social_audit_log FROM authenticated",
    );
    expect(auditContracts).toContain("export interface AuditEventSink");
    expect(auditContracts).toContain("append(event: AuditEventDraft)");
    expect(auditContracts).not.toMatch(/\b(update|delete)\s*\(/);
  });

  it("derives reporter and target author for every Community report target", () => {
    for (const targetType of [
      "post",
      "comment",
      "profile",
      "lost_found_post",
      "lost_found_comment",
      "question",
      "answer",
    ]) {
      expect(reportTargetsMigration).toContain(`'${targetType}'`);
    }

    expect(reportTargetsMigration).toContain(
      "private.resolve_community_report_target_author",
    );
    expect(reportTargetsMigration).toContain(
      "NEW.reporter_profile_id := v_actor_profile_id",
    );
    expect(reportTargetsMigration).toContain(
      "NEW.target_author_profile_id := v_target_author_profile_id",
    );
    expect(reportGuardMigration).toContain(
      "ALTER FUNCTION private.guard_community_report_review() SECURITY DEFINER",
    );
    expect(reportGuardMigration).toContain(
      "SET search_path TO public, private, pg_temp",
    );
    expect(reportGuardMigration).toContain(
      "FROM PUBLIC, anon, authenticated, service_role",
    );
  });

  it("does not retain duplicated User identity in billing snapshots", () => {
    expect(billingMigration).toContain("old_data - 'user_id'");
    expect(billingMigration).toContain("new_data - 'user_id'");
    expect(billingMigration).toMatch(
      /TG_OP = 'DELETE'[\s\S]*?public\.log_billing_action\(\s*NULL,/,
    );
    expect(billingMigration).toContain("FROM PUBLIC, anon, authenticated");
    expect(billingMigration).toContain("TO service_role");
  });

  it("exposes only the current User active-ban boolean through a server reader", () => {
    expect(activeBanMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.has_current_active_ban()",
    );
    expect(activeBanMigration).toContain("v_user_id UUID := auth.uid()");
    expect(activeBanMigration).toContain("RETURN EXISTS");
    expect(activeBanMigration).toContain(
      "REVOKE ALL ON TABLE public.banned_users FROM PUBLIC, anon, authenticated",
    );
    expect(activeBanMigration).toContain(
      "REVOKE ALL ON FUNCTION public.has_current_active_ban()",
    );
    expect(activeBanMigration).not.toContain("p_user_id");
    expect(activeBanReader).toContain('rpc("has_current_active_ban")');
    expect(activeBanReader).not.toContain('.from("banned_users")');
  });

  it("prevents the removed generic owners from returning", () => {
    for (const removedPath of [
      "src/core/moderation/services/ModerationService.ts",
      "src/core/moderation/services/AdminAuditService.ts",
      "src/core/moderation/services/ModerationQueueService.ts",
      "src/core/moderation/services/UserWarningsService.ts",
    ]) {
      expect(existsSync(resolve(root, removedPath))).toBe(false);
    }

    expect(ssotLintRule).toContain("banned_users: []");
    expect(ssotLintRule).toContain("community_social_audit_log: []");
    expect(ssotLintRule).not.toMatch(/service:\s*["']ModerationService["']/);

    expect(
      ownershipManifest.controlledTables.find(
        ({ name }) => name === "community_reports",
      ),
    ).toMatchObject({
      currentOwner: "src/core/community/moderation/CommunityReportService.ts",
      targetOwner: "src/core/community/moderation/CommunityReportService.ts",
    });
    expect(
      ownershipManifest.controlledTables.find(
        ({ name }) => name === "banned_users",
      ),
    ).toMatchObject({
      currentOwner: "server-owned-trust-ban-contract",
      targetOwner: "server-owned-trust-ban-contract",
    });
    expect(
      ownershipManifest.controlledRpcs.find(
        ({ name }) => name === "has_current_active_ban",
      ),
    ).toMatchObject({
      currentOwner: "src/core/trust/services/ActiveBanReader.ts",
      targetOwner: "server-owned-current-user-ban-read-model",
    });
  });
});
