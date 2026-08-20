import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const migration = read(
  "supabase/migrations/20260820023000_restrict_private_classified_command_grants.sql",
);
const publicWrappers = read(
  "supabase/migrations/20260714120000_add_explicit_auth_guards_to_trust_messaging_rpcs.sql",
);
const messagingService = read(
  "src/core/messaging/services/ClassifiedMessagingService.ts",
);
const incidentService = read("src/core/trust/services/TrustIncidentService.ts");

const commands = [
  ["create_classified_conversation", "UUID"],
  ["send_classified_message", "UUID, TEXT"],
  ["mark_classified_messages_read", "UUID"],
  ["block_classified_conversation", "UUID, TEXT"],
  ["moderate_classified_conversation", "UUID, TEXT, TEXT"],
  ["report_classified_comment", "UUID, UUID, TEXT, TEXT"],
  ["report_classified_conversation", "UUID, TEXT, TEXT"],
  ["report_classified_message", "UUID, TEXT, TEXT"],
] as const;

describe("private Classified Messaging command grants", () => {
  it("removes browser execution from every private implementation command", () => {
    for (const [name, signature] of commands) {
      expect(migration).toContain(
        `REVOKE ALL ON FUNCTION private.${name}(${signature})`,
      );
    }
    expect(
      migration.match(/FROM PUBLIC, anon, authenticated;/g)?.length,
    ).toBe(commands.length);
  });

  it("preserves only the trusted service_role direct execution contract", () => {
    for (const [name, signature] of commands) {
      expect(migration).toContain(
        `GRANT EXECUTE ON FUNCTION private.${name}(${signature})`,
      );
    }
    expect(migration.match(/TO service_role;/g)?.length).toBe(commands.length);
    expect(migration).not.toMatch(/TO\s+(?:anon|authenticated)\s*;/);
  });

  it("does not mutate data, wrappers, or the private schema USAGE contract", () => {
    expect(migration).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|TRUNCATE)\b/i);
    expect(migration).not.toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION/i);
    expect(migration).not.toMatch(/REVOKE\s+.*ON\s+SCHEMA\s+private/i);
  });

  it("keeps authenticated browser authority on the public guarded wrappers", () => {
    for (const [name] of commands) {
      expect(publicWrappers).toContain(`public.${name}`);
      expect(publicWrappers).toContain(`private.${name}`);
    }
    expect(
      publicWrappers.match(/authentication_required/g)?.length,
    ).toBeGreaterThanOrEqual(commands.length);
    expect(
      publicWrappers.match(/FROM PUBLIC, anon;/g)?.length,
    ).toBeGreaterThanOrEqual(commands.length);
  });

  it("keeps runtime callers on public RPC names rather than private schema calls", () => {
    for (const name of [
      "create_classified_conversation",
      "send_classified_message",
      "mark_classified_messages_read",
      "block_classified_conversation",
      "moderate_classified_conversation",
    ]) {
      expect(messagingService).toMatch(new RegExp(`rpc\\(\\s*\"${name}\"`));
    }
    for (const name of [
      "report_classified_comment",
      "report_classified_conversation",
      "report_classified_message",
    ]) {
      expect(incidentService).toContain(`rpc(\"${name}\"`);
    }
    expect(messagingService).not.toContain('schema("private")');
    expect(incidentService).not.toContain('schema("private")');
  });
});
