import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

function collectRuntimeSources(directory: string): string[] {
  const absolute = resolve(root, directory);
  if (!existsSync(absolute)) return [];

  return readdirSync(absolute).flatMap((entry) => {
    const path = resolve(absolute, entry);
    if (statSync(path).isDirectory()) {
      return collectRuntimeSources(path.slice(root.length + 1));
    }
    return path.endsWith(".ts") || path.endsWith(".tsx") ? [path] : [];
  });
}

const runtimeSources = collectRuntimeSources("src");
const notificationService = read(
  "src/core/notifications/services/NotificationService.ts",
);
const preferenceService = read(
  "src/core/notifications/services/NotificationPreferencesService.ts",
);
const authorityMigration = read(
  "supabase/migrations/20260829185546_harden_notification_inbox_write_authority.sql",
);

const directNotificationCreateOrHardDelete =
  /\.from(?:<[^;]{0,500}>)?\(\s*["']notifications["']\s*\)\s*\.(?:insert|delete)\s*\(/m;

describe("Notification inbox authority", () => {
  it("keeps browser runtime free of direct inbox creation and hard delete", () => {
    const offenders = runtimeSources
      .filter((path) =>
        directNotificationCreateOrHardDelete.test(readFileSync(path, "utf8")),
      )
      .map((path) => path.slice(root.length + 1));

    expect(offenders).toEqual([]);
  });

  it("routes self notification creation through the canonical RPC", () => {
    expect(notificationService).toContain('supabase.rpc("create_notification"');
    expect(notificationService).not.toMatch(
      /\.from(?:<[^;]{0,500}>)?\(\s*["']notifications["']\s*\)\s*\.insert\s*\(/m,
    );
  });

  it("keeps notification preferences behind their canonical RPC owner", () => {
    expect(preferenceService).toContain(
      'supabase.rpc("get_current_notification_preferences")',
    );
    expect(preferenceService).toContain(
      'supabase.rpc("patch_current_notification_preferences"',
    );
    expect(preferenceService).not.toContain('.from("notification_preferences")');
    expect(preferenceService).not.toContain(".from('notification_preferences')");
  });

  it("revokes direct inbox creation and hard delete while preserving RPC authority", () => {
    expect(authorityMigration).toContain("SECURITY DEFINER");
    expect(authorityMigration).toContain("FROM PUBLIC, anon");
    expect(authorityMigration).toContain("TO authenticated, service_role");
    expect(authorityMigration).toContain(
      "DROP POLICY IF EXISTS notifications_insert_own",
    );
    expect(authorityMigration).toContain(
      "DROP POLICY IF EXISTS notifications_delete_own",
    );
    expect(authorityMigration).toContain(
      "REVOKE INSERT (user_id, type, category, title, message, action_url, action_label, metadata)",
    );
    expect(authorityMigration).toContain(
      "REVOKE DELETE ON public.notifications FROM authenticated, anon",
    );
  });
});
