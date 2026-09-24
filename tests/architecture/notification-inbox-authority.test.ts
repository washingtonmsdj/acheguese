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
const notificationItem = read(
  "src/app/components/notifications/NotificationItem.tsx",
);
const notificationActionScope = read(
  "src/app/config/notificationActionScope.ts",
);
const authorityMigration = read(
  "supabase/migrations/20260829185546_harden_notification_inbox_write_authority.sql",
);
const browserCreateRetirement = read(
  "supabase/migrations/20260918115346_retire_browser_notification_creation_cp001.sql",
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

  it("keeps generic notification creation out of browser runtime", () => {
    expect(notificationService).not.toContain('supabase.rpc("create_notification"');
    expect(notificationService).not.toContain("CreateNotificationInput");
    expect(notificationService).not.toMatch(
      /\.from(?:<[^;]{0,500}>)?\(\s*["']notifications["']\s*\)\s*\.insert\s*\(/m,
    );
  });

  it("keeps inbox actions lifecycle-scoped at the app boundary", () => {
    expect(notificationItem).toContain("resolveNotificationActionTarget");
    expect(notificationItem).toContain("actionTarget.href");
    expect(notificationItem).not.toContain(
      "href={notification.action_url}",
    );
    expect(notificationActionScope).toContain("isProductModuleEnabled");
    expect(notificationActionScope).toContain("isPlatformCapabilityEnabled");
    expect(notificationActionScope).toContain("isNotificationActionSurfaceEnabled");
    expect(notificationActionScope).not.toContain("launchScope");
    expect(notificationActionScope).not.toContain("isLaunchSurfaceEnabled");
    expect(notificationActionScope).toContain('surface: "gastronomy"');
    expect(notificationActionScope).toContain('surface: "mobility"');
    expect(notificationActionScope).toContain(
      'NOTIFICATION_INBOX_PATH = "/notificacoes"',
    );
    expect(notificationActionScope).toContain(
      "RETIRED_NOTIFICATION_ROUTE_PATTERNS",
    );
  });

  it("keeps notification preferences behind their canonical RPC owner", () => {
    expect(preferenceService).toMatch(
      /supabase\.rpc\(\s*["']get_current_notification_preferences["']/,
    );
    expect(preferenceService).toMatch(
      /supabase\.rpc\(\s*["']patch_current_notification_preferences["']/,
    );
    expect(preferenceService).not.toContain('.from("notification_preferences")');
    expect(preferenceService).not.toContain(".from('notification_preferences')");
  });

  it("revokes direct inbox creation and hard delete while keeping materialization server-owned", () => {
    expect(authorityMigration).toContain("SECURITY DEFINER");
    expect(authorityMigration).toContain("FROM PUBLIC, anon");
    expect(browserCreateRetirement).toContain("FROM PUBLIC, anon, authenticated");
    expect(browserCreateRetirement).toContain("TO service_role");
    expect(browserCreateRetirement).not.toContain("TO authenticated, service_role");
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
