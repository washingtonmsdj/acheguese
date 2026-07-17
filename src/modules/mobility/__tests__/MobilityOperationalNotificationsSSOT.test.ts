import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("mobility operational notifications ssot", () => {
  it("keeps ride transition notifications server-owned and audience-aware", () => {
    const source = readProjectFile(
      "supabase/migrations/20260714115000_migrate_mobility_admin_notifications.sql",
    );
    const postTransitionSource = readProjectFile(
      "src/core/mobility/core/RideOperationalPostTransition.ts",
    );

    expect(source).toContain("private.enqueue_ride_transition_notifications");
    expect(source).toContain("'transactional'");
    expect(source).toContain("'audience', 'passenger'");
    expect(source).toContain("'audience', 'driver'");
    expect(source).toContain("'ride_mode'");
    expect(source).toContain("ride_canceled_by_driver");
    expect(source).toContain("ride_canceled_by_passenger");
    expect(source).toContain("'/mobilidade/buscando/' || NEW.id::TEXT");
    expect(postTransitionSource).not.toContain(
      "NotificationService.createNotification",
    );
  });
});
