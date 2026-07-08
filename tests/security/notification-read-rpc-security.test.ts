import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("notification read RPC security", () => {
  it("routes notification read-state operations through table RLS instead of privileged RPCs", () => {
    const service = readProjectFile("src/core/notifications/services/NotificationService.ts");
    const migration = readProjectFile("supabase/migrations/20260707152429_harden_notification_read_rpcs.sql");

    expect(service).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']mark_notification_as_read/);
    expect(service).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']mark_all_notifications_as_read/);
    expect(service).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']get_unread_notifications_count/);
    expect(service).toContain('.from("notifications")');
    expect(service).toContain('.eq("user_id", user.id)');
    expect(service).toContain('throw new Error("User not authenticated")');
    expect(service).toContain('select("id", { count: "exact", head: true })');

    expect(migration).toContain("REVOKE ALL ON FUNCTION public.mark_notification_as_read(uuid)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.mark_all_notifications_as_read(uuid)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.get_unread_notifications_count(uuid)");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });
});
