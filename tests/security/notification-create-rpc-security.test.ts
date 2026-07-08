import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("notification create RPC security", () => {
  it("keeps notification creation invoker-scoped and blocks cross-user browser calls", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707192404_harden_create_notification_security.sql",
    );
    const service = readProjectFile("src/core/notifications/services/NotificationService.ts");

    expect(migration).toContain("SECURITY INVOKER");
    expect(migration).toContain("p_user_id IS DISTINCT FROM v_actor_user_id");
    expect(migration).toContain("Cannot create a notification for another user");
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text, text, text, jsonb)",
    );
    expect(migration).toContain("TO authenticated, service_role");
    expect(migration).toContain("REVOKE ALL ON TABLE public.notifications FROM anon");
    expect(migration).toContain("REVOKE ALL ON TABLE public.notification_preferences FROM anon");
    expect(migration).not.toContain("GRANT TRUNCATE ON TABLE public.notifications");
    expect(migration).not.toContain("GRANT TRIGGER ON TABLE public.notifications");
    expect(migration).not.toContain("GRANT REFERENCES ON TABLE public.notifications");

    expect(service).toContain("SessionService.getCurrentUser()");
    expect(service).toContain("input.user_id !== user.id");
    expect(service).toContain("blocked untrusted cross-user notification creation");
    expect(service).toMatch(/\.delete\(\)[\s\S]*\.eq\("id", notificationId\)[\s\S]*\.eq\("user_id", user\.id\)/);
  });
});
