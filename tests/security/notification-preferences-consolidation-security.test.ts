import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

const migration = read(
  "supabase/migrations/20260714121000_consolidate_notification_preferences_owner.sql",
);
const service = read(
  "src/core/notifications/services/NotificationPreferencesService.ts",
);
const page = read("src/app/pages/NotificationPreferencesPage.tsx");

describe("notification preference owner consolidation", () => {
  it("derives the canonical row and RPC arguments from generated schema", () => {
    expect(service).toContain(
      'Database["public"]["Tables"]["notification_preferences"]["Row"]',
    );
    expect(service).toContain(
      'Database["public"]["Functions"]["patch_current_notification_preferences"]["Args"]',
    );
    expect(service).not.toMatch(/notify_pet_perdido|radius_meters/);
  });

  it("exposes focused patch methods through one atomic command", () => {
    for (const method of [
      "patchChannels",
      "patchTopics",
      "patchFrequency",
      "patchQuietHours",
      "patchAll",
    ]) {
      expect(service).toContain(`async ${method}`);
    }
    expect(service.match(/rpc\(\s*"patch_current_notification_preferences"/g)?.length).toBe(1);
    expect(service).not.toContain('.from("notification_preferences")');
  });

  it("preserves omitted fields and serializes each patch under a row lock", () => {
    expect(migration).toContain("FOR UPDATE");
    for (const field of [
      "email_enabled",
      "push_enabled",
      "inapp_enabled",
      "social_enabled",
      "system_enabled",
      "marketing_enabled",
      "frequency",
    ]) {
      expect(migration).toContain(
        `${field} = COALESCE(p_${field}, preference.${field})`,
      );
    }
    expect(migration).toContain("ON CONFLICT (user_id) DO NOTHING");
  });

  it("enforces mandatory transactional delivery and valid quiet hours", () => {
    expect(migration).toContain("transactional_enabled IS TRUE");
    expect(migration).toContain("notification_preferences_quiet_hours_pair_check");
    expect(migration).toContain("quiet_hours_pair_required");
    expect(migration).toContain("invalid_quiet_hours_days");
    expect(service).toContain("transactional_enabled: true");
  });

  it("revokes browser writes and records a value-free changed-field mask", () => {
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON public.notification_preferences",
    );
    expect(migration).toContain("private.notification_preferences_audit_log");
    expect(migration).toContain(
      "REVOKE ALL ON TABLE private.notification_preferences_audit_log",
    );
    expect(migration).toContain("v_changed_fields := jsonb_strip_nulls");
    expect(migration).not.toContain("old_preferences JSONB");
  });

  it("removes both legacy writers and migrates the page to the canonical owner", () => {
    expect(
      existsSync(
        resolve(
          root,
          "src/core/notifications/services/UserNotificationPreferencesService.ts",
        ),
      ),
    ).toBe(false);
    expect(
      existsSync(
        resolve(
          root,
          "src/core/notifications/services/PushNotificationPreferencesService.ts",
        ),
      ),
    ).toBe(false);
    expect(page).toContain("NotificationPreferencesService.get()");
    expect(page).toContain("NotificationPreferencesService.patchAll(prefs)");
    expect(page).not.toContain("updateByUserId");
  });

  it("keeps a remote rollback proof for non-clobbering partial patches", () => {
    const probe = read("tests/security/notification-preferences-remote-probe.sql");
    expect(probe).toContain("channel_patch_clobbered_unrelated_fields");
    expect(probe).toContain("topic_patch_clobbered_channels");
    expect(probe).toContain("direct_notification_preference_write_was_not_blocked");
    expect(probe).toContain("ROLLBACK;");
  });
});
