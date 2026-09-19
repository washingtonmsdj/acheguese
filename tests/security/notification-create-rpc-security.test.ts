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
  it("keeps the materializer service-owned and removes the generic browser command", () => {
    const originalHardening = readProjectFile(
      "supabase/migrations/20260707192404_harden_create_notification_security.sql",
    );
    const inboxHardening = readProjectFile(
      "supabase/migrations/20260829185546_harden_notification_inbox_write_authority.sql",
    );
    const retirement = readProjectFile(
      "supabase/migrations/20260918115346_retire_browser_notification_creation_cp001.sql",
    );
    const service = readProjectFile("src/core/notifications/services/NotificationService.ts");
    const broker = readProjectFile(
      "supabase/functions/professional-notifications-rpc/index.ts",
    );

    expect(originalHardening).toContain("p_user_id IS DISTINCT FROM v_actor_user_id");
    expect(inboxHardening).toContain("SECURITY DEFINER");
    expect(inboxHardening).toContain(
      "REVOKE INSERT ON public.notifications FROM authenticated, anon",
    );

    expect(retirement).toContain(
      "REVOKE ALL ON FUNCTION public.create_notification(",
    );
    expect(retirement).toContain("FROM PUBLIC, anon, authenticated");
    expect(retirement).toContain("TO service_role");
    expect(retirement).not.toContain("TO authenticated, service_role");

    expect(service).not.toContain('supabase.rpc("create_notification"');
    expect(service).not.toContain("CreateNotificationInput");
    expect(broker).toContain('supabaseAdmin.rpc("create_notification"');
    expect(broker).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');

    expect(service).toMatch(
      /\.update\(\{ deleted_at:[\s\S]*\.eq\("id", notificationId\)[\s\S]*\.eq\("user_id", user\.id\)/,
    );
  });
});
