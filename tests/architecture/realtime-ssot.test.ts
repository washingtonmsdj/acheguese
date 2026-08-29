import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const srcRoot = join(root, "src");
const realtimeServicePath = join(
  srcRoot,
  "core/realtime/services/RealtimeService.ts",
);
const publicationMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260829185634_align_messaging_notification_realtime_publication.sql",
  ),
  "utf8",
);

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return listSourceFiles(path);
    return /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}

describe("Realtime SSOT", () => {
  it("opens Supabase channels only inside the canonical service", () => {
    const violations = listSourceFiles(srcRoot)
      .filter((path) => path !== realtimeServicePath)
      .filter((path) => readFileSync(path, "utf8").includes(".channel("))
      .map((path) => relative(root, path));

    expect(violations).toEqual([]);
  });

  it("keeps sensitive subscriptions scoped by registry-owned filters", () => {
    const registry = readFileSync(
      join(srcRoot, "core/realtime/config/realtimeRegistry.ts"),
      "utf8",
    );

    expect(registry).toContain('"notifications.user"');
    expect(registry).toContain('column: "user_id"');
    expect(registry).toContain('"messaging.classified-conversation-messages"');
    expect(registry).toContain('"messaging.community-thread-messages"');
    expect(registry).toContain('column: "conversation_id"');
    expect(registry).toContain('"community.group-messages"');
    expect(registry).toContain('column: "group_id"');
  });

  it("publishes every Postgres Changes stream required by messaging and notifications", () => {
    expect(publicationMigration).toContain("ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications");
    expect(publicationMigration).toContain("ALTER PUBLICATION supabase_realtime ADD TABLE public.messages");
    expect(publicationMigration).toContain("pg_publication_tables");
  });
});
