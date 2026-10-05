import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { PRODUCT_MODULE_REGISTRY } from "../../src/app/config/productModuleRegistry";

const PAUSE_MIGRATION =
  "20261005233000_pause_mobility_operational_rpc_client_grants.sql";

const CLIENT_RPC_SIGNATURES = [
  "public.append_driver_moderation_event(uuid, text, text, jsonb)",
  "public.ensure_owned_driver_data(uuid)",
  "public.ensure_ride_chat(uuid)",
  "public.get_operational_verification_status(uuid)",
  "public.mark_ride_chat_messages_read(uuid)",
  "public.refresh_operational_pin_for_requester(uuid)",
  "public.send_ride_chat_message(uuid, text)",
  "public.update_owned_driver_data(uuid, jsonb)",
  "public.verify_operational_pin(uuid, text)",
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

describe("paused Mobility operational RPC exposure", () => {
  it("keeps Mobility paused while operational client RPC grants are closed", () => {
    expect(PRODUCT_MODULE_REGISTRY.mobility.status).toBe("paused");
  });

  it("revokes direct browser-role execution while preserving service-role execution", () => {
    const migration = readMigration(PAUSE_MIGRATION);

    for (const signature of CLIENT_RPC_SIGNATURES) {
      expect(migration).toContain(
        `REVOKE ALL ON FUNCTION ${signature}\n  FROM PUBLIC, anon, authenticated;`,
      );
      expect(migration).toContain(
        `GRANT EXECUTE ON FUNCTION ${signature}\n  TO service_role;`,
      );
    }
  });

  it("requires an explicit ratchet update before a later migration can reopen the client surface", () => {
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
