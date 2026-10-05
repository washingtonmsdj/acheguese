import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { PRODUCT_MODULE_REGISTRY } from "../../src/app/config/productModuleRegistry";

const PAUSE_MIGRATION = "20261005225000_pause_safety_rpc_client_grants.sql";

const CLIENT_RPC_SIGNATURES = [
  "public.create_emergency_contact(uuid, text, text, text, text, boolean)",
  "public.create_safety_emergency_alert(uuid, uuid, text, text, double precision, double precision, double precision, jsonb)",
  "public.create_safety_incident(uuid, uuid, text, text, text, double precision, double precision)",
  "public.create_safety_ride_share(uuid, uuid, integer)",
  "public.get_shared_ride_safety_data(text)",
  "public.patch_emergency_contact(uuid, jsonb)",
  "public.register_safety_evidence(uuid, text, text, text, jsonb)",
  "public.revoke_safety_ride_share(uuid)",
  "public.update_safety_emergency_alert_status(uuid, text, uuid)",
  "public.update_safety_incident_status(uuid, text, uuid)",
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

describe("paused Safety/Mobility RPC exposure", () => {
  it("keeps the product lifecycle paused while client RPC grants are closed", () => {
    expect(PRODUCT_MODULE_REGISTRY.mobility.status).toBe("paused");
    expect(PRODUCT_MODULE_REGISTRY.familySafety.status).toBe("paused");
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
