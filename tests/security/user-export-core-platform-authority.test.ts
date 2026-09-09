import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SOURCE_PATH = join(
  ROOT,
  "supabase/functions/user-export-data/index.ts",
);
const AUTHORITY_PATH = join(
  ROOT,
  "docs/architecture/core-platform-account-export-authority.json",
);

const source = readFileSync(SOURCE_PATH, "utf8");
const authority = JSON.parse(readFileSync(AUTHORITY_PATH, "utf8")) as {
  schemaVersion: number;
  caller: string;
  role: string;
  controlledTableReaders: string[];
};

const EXPECTED_CONTROLLED_READERS = [
  "banned_users",
  "comments",
  "community_direct_message_reports",
  "community_direct_messages",
  "community_reports",
  "emergency_contacts",
  "media_assets",
  "messages",
  "notification_preferences",
  "review_reports",
  "ride_reports",
  "service_areas",
  "user_favorite_businesses",
  "vaga_reports",
];

describe("LGPD user export Core Platform authority", () => {
  it("keeps the cross-domain reader authority explicit and read-only scoped", () => {
    expect(authority).toMatchObject({
      schemaVersion: 1,
      caller: "supabase/functions/user-export-data/index.ts",
      role: "account-export",
    });
    expect(authority.controlledTableReaders).toEqual(EXPECTED_CONTROLLED_READERS);
    expect(new Set(authority.controlledTableReaders).size).toBe(
      authority.controlledTableReaders.length,
    );
  });

  it("forbids arbitrary dynamic table selection in the export broker", () => {
    expect(source).not.toContain(".from(table)");
    expect(source).toContain("type ExportTable =");
    expect(source).toContain("function selectExportTable(");

    for (const table of authority.controlledTableReaders) {
      expect(source).toContain(`case \"${table}\":`);
      expect(source).toContain(`.from(\"${table}\")`);
    }
  });
});
