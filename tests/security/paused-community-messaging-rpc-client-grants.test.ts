import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { PRODUCT_MODULE_REGISTRY } from "../../src/app/config/productModuleRegistry";

const PAUSE_MIGRATION =
  "20261006054500_pause_community_direct_messaging_rpc_client_grants.sql";

const CLIENT_RPC_SIGNATURES = [
  "public.create_community_direct_thread(uuid, uuid, uuid, uuid)",
  "public.list_community_direct_messages(uuid, uuid, integer, timestamp with time zone, uuid)",
  "public.list_community_direct_thread_previews(uuid, integer, timestamp with time zone, uuid, text)",
  "public.mark_community_direct_thread_read(uuid, uuid)",
  "public.moderate_community_direct_report(uuid, text, text)",
  "public.report_community_direct_thread(uuid, uuid, uuid, text, text)",
  "public.send_community_direct_message(uuid, uuid, text)",
  "public.set_community_direct_thread_blocked(uuid, uuid, boolean, text)",
] as const;

const CLIENT_RPC_NAMES = CLIENT_RPC_SIGNATURES.map((signature) =>
  signature.slice("public.".length, signature.indexOf("(")),
);

function readMigration(fileName: string): string {
  return fs.readFileSync(
    path.resolve(process.cwd(), "supabase", "migrations", fileName),
    "utf8",
  );
}

function migrationsFromPauseBoundary(): string {
  const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();
  const boundaryIndex = files.indexOf(PAUSE_MIGRATION);

  expect(boundaryIndex).toBeGreaterThanOrEqual(0);

  return files
    .slice(boundaryIndex)
    .map((fileName) => readMigration(fileName))
    .join("\n");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("paused Community Direct Messaging RPC exposure", () => {
  it("keeps Community paused while its browser RPC grants are closed", () => {
    expect(PRODUCT_MODULE_REGISTRY.community.status).toBe("paused");
  });

  it("revokes browser-role execution and preserves service-role execution only for Community RPCs", () => {
    const migration = readMigration(PAUSE_MIGRATION);

    expect(migration).not.toMatch(/business_direct/i);

    for (const signature of CLIENT_RPC_SIGNATURES) {
      expect(migration).toContain(
        `REVOKE ALL ON FUNCTION ${signature}\n  FROM PUBLIC, anon, authenticated;`,
      );
      expect(migration).toContain(
        `GRANT EXECUTE ON FUNCTION ${signature}\n  TO service_role;`,
      );
    }
  });

  it("requires an explicit ratchet update before a later migration can reopen Community browser access", () => {
    const migrationTail = migrationsFromPauseBoundary();

    for (const functionName of CLIENT_RPC_NAMES) {
      const regrantToClient = new RegExp(
        `GRANT\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+public\\.${escapeRegExp(functionName)}\\s*\\([^;]*?\\)\\s+TO\\s+(?:PUBLIC|anon|authenticated)\\b`,
        "i",
      );
      expect(migrationTail).not.toMatch(regrantToClient);
    }
  });
});
