import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

const coreMigration = readProjectFile(
  "supabase/migrations/20260714113000_create_notification_outbox_core.sql",
);
const socialWorkTrustMigration = readProjectFile(
  "supabase/migrations/20260714114000_migrate_social_work_trust_notifications.sql",
);
const mobilityAdminMigration = readProjectFile(
  "supabase/migrations/20260714115000_migrate_mobility_admin_notifications.sql",
);
const remoteProbe = readProjectFile(
  "tests/security/notification-outbox-remote-probe.sql",
);

describe("notification outbox security", () => {
  it("keeps the command store private and idempotent", () => {
    expect(coreMigration).toContain(
      "CREATE TABLE IF NOT EXISTS private.notification_outbox",
    );
    expect(coreMigration).toContain(
      "ALTER TABLE private.notification_outbox ENABLE ROW LEVEL SECURITY",
    );
    expect(coreMigration).toContain(
      "REVOKE ALL ON TABLE private.notification_outbox FROM PUBLIC, anon, authenticated",
    );
    expect(coreMigration).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_outbox_recipient_idempotency",
    );
    expect(coreMigration).not.toMatch(
      /GRANT\s+(?:ALL|INSERT|UPDATE|DELETE|SELECT)[\s\S]{0,100}private\.notification_outbox[\s\S]{0,80}TO\s+(?:anon|authenticated)/i,
    );
  });

  it("uses bounded concurrent delivery, retry and dead-letter states", () => {
    expect(coreMigration).toContain("FOR UPDATE SKIP LOCKED");
    expect(coreMigration).toContain("power(2, least(v_attempt_count - 1, 8))");
    expect(coreMigration).toContain("status = 'dead_letter'");
    expect(coreMigration).toContain("private.requeue_notification_dead_letter");
    expect(coreMigration).toContain("private.notification_outbox_health");
    expect(coreMigration).toContain(
      "acheguese-notification-outbox-dispatch",
    );
    expect(coreMigration).toContain(
      "acheguese-notification-outbox-retention",
    );
  });

  it("accepts only bounded plain-text commands and safe action URLs", () => {
    expect(coreMigration).toContain("title !~ '[<>]'");
    expect(coreMigration).toContain("message !~ '[<>]'");
    expect(coreMigration).toContain("action_label !~ '[<>]'");
    expect(coreMigration).toContain(
      "action_url ~ '^/[^/[:space:][:cntrl:]][^[:space:][:cntrl:]]*$'",
    );
    expect(coreMigration).toContain(
      "action_url ~* '^https://[^[:space:][:cntrl:]]+$'",
    );
  });

  it("does not expose internal materialization or enqueue commands to browser roles", () => {
    for (const signature of [
      "private.materialize_notification",
      "private.enqueue_notification",
      "private.process_notification_outbox",
      "private.notification_outbox_health",
      "private.requeue_notification_dead_letter",
      "private.prune_notification_outbox",
    ]) {
      expect(coreMigration).toContain(signature);
    }

    expect(coreMigration).not.toMatch(
      /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+private\.[\s\S]{0,300}\s+TO\s+(?:anon|authenticated)\s*;/i,
    );
  });

  it("keeps Community atomic while sharing the canonical materializer", () => {
    expect(socialWorkTrustMigration).toContain(
      "RETURN private.materialize_notification(",
    );
    expect(socialWorkTrustMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.create_community_social_notification",
    );
    expect(socialWorkTrustMigration).not.toMatch(
      /create_community_social_notification[\s\S]*?INSERT INTO public\.notifications/i,
    );
  });

  it("derives cross-user recipients from canonical domain rows", () => {
    expect(socialWorkTrustMigration).toContain(
      "FROM public.professional_data professional",
    );
    expect(socialWorkTrustMigration).toContain(
      "WHERE profile.id = NEW.subject_profile_id",
    );
    expect(socialWorkTrustMigration).toContain(
      "WHERE profile.id = NEW.applied_by_profile_id",
    );
    expect(mobilityAdminMigration).toContain(
      "WHERE profile.id = NEW.passenger_profile_id",
    );
    expect(mobilityAdminMigration).toContain(
      "WHERE profile.id = NEW.customer_profile_id",
    );
    expect(mobilityAdminMigration).toContain(
      "AFTER UPDATE OF status ON public.business_claims",
    );
  });

  it("removes migrated cross-user delivery from browser services", () => {
    const workSource = readProjectFile(
      "src/core/work-opportunities/services/WorkOpportunitiesService.ts",
    );
    const trustSource = readProjectFile(
      "src/core/trust/services/OperationalTrustCommandService.ts",
    );
    const rideSource = readProjectFile(
      "src/core/mobility/core/RideOperationalService.ts",
    );
    const orderSource = readProjectFile(
      "src/core/mobility/delivery/services/OrderDeliverySSOTService.ts",
    );
    const adminSource = readProjectFile(
      "src/modules/admin/pages/AdminReivindicacoes.tsx",
    );
    const notificationSource = readProjectFile(
      "src/core/notifications/services/NotificationService.ts",
    );

    for (const source of [workSource, trustSource, rideSource, orderSource, adminSource]) {
      expect(source).not.toContain("NotificationService.createNotification");
    }
    expect(notificationSource).toContain("input.user_id !== user.id");
    expect(notificationSource).toContain(
      "blocked untrusted cross-user notification creation",
    );
  });

  it("keeps the remote behavior probe isolated and reversible", () => {
    expect(remoteProbe.trimStart()).toMatch(/^BEGIN;/);
    expect(remoteProbe.trimEnd()).toMatch(/ROLLBACK;$/);
    expect(remoteProbe).toContain("notification_probe_idempotency_id_mismatch");
    expect(remoteProbe).toContain("notification_probe_suppression_failed");
    expect(remoteProbe).toContain("notification_probe_retry_failed");
    expect(remoteProbe).toContain("notification_probe_dead_letter_failed");
    expect(remoteProbe).toContain("notification_probe_requeue_failed");
    expect(remoteProbe).toContain("notification_probe_health_contract_failed");
  });
});
