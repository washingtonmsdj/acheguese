import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

const migration = read(
  "supabase/migrations/20260714119000_harden_trust_messaging_incident_commands.sql",
);
const messagingService = read(
  "src/core/messaging/services/ClassifiedMessagingService.ts",
);
const incidentService = read("src/core/trust/services/TrustIncidentService.ts");
const classifiedCommentService = read(
  "src/core/classifieds/services/ClassifiedCommentService.ts",
);
const directMessagesHook = read(
  "src/core/community/hooks/useDirectMessages.ts",
);

function publicFunctionParameters(name: string): string {
  const match = migration.match(
    new RegExp(
      `CREATE OR REPLACE FUNCTION public\\.${name}\\s*\\(([\\s\\S]*?)\\)\\s*RETURNS`,
    ),
  );
  expect(match, `${name} signature`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("Trust and Classified Messaging server-owned commands", () => {
  it("reproduces the missing messaging schema around canonical profile identity", () => {
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS public.conversations",
    );
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.messages");
    for (const constraint of [
      "conversations_buyer_id_fkey",
      "conversations_seller_id_fkey",
      "conversations_blocked_by_fkey",
      "messages_sender_profile_id_fkey",
    ]) {
      expect(migration).toContain(constraint);
    }
    expect(
      migration.match(/REFERENCES public\.profiles\(id\)/g)?.length,
    ).toBeGreaterThan(6);
    expect(migration).toContain("unresolved_legacy_conversation_identity");
    expect(migration).toContain("unresolved_legacy_message_identity");
  });

  it("keeps actor, target, role and sender out of every public command", () => {
    for (const command of [
      "create_classified_conversation",
      "send_classified_message",
      "mark_classified_messages_read",
      "block_classified_conversation",
      "moderate_classified_conversation",
      "report_classified_comment",
      "report_classified_conversation",
      "report_classified_message",
    ]) {
      expect(publicFunctionParameters(command)).not.toMatch(
        /p_(?:actor|subject|sender|buyer|seller|reporter|blocked_by|profile|user)_?id/i,
      );
    }
  });

  it("revokes direct messaging writes and enforces immutable identities", () => {
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON public.conversations FROM authenticated",
    );
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON public.messages FROM authenticated",
    );
    expect(migration).toContain("conversation_identity_is_immutable");
    expect(migration).toContain("message_content_is_immutable");
    expect(migration).toContain("messaging_command_required");
  });

  it("allows incidents only through dedicated commands with rate and dedup controls", () => {
    expect(migration).toContain("trust_incident_command_required");
    expect(migration).toContain("trust_incident_rate_limit_exceeded");
    expect(
      migration.match(/self_report_not_allowed/g)?.length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      migration.match(/event\.status IN \('active', 'under_review'\)/g)?.length,
    ).toBe(3);
    expect(migration).toContain("conversation_status', 'blocked'");
  });

  it("does not duplicate message or comment text into incident evidence or audit", () => {
    expect(migration).toContain("private.messaging_trust_audit_log");
    expect(migration).toContain(
      "REVOKE ALL ON TABLE private.messaging_trust_audit_log",
    );
    const incidentFunction = migration.match(
      /CREATE OR REPLACE FUNCTION private\.insert_trust_incident[\s\S]*?REVOKE ALL ON FUNCTION private\.insert_trust_incident/,
    )?.[0];
    expect(incidentFunction).toBeDefined();
    expect(incidentFunction).not.toMatch(/message\.text|comment\.content/);
    expect(migration).not.toContain("comment_content");
  });

  it("routes runtime mutations through typed RPC adapters", () => {
    for (const command of [
      "create_classified_conversation",
      "send_classified_message",
      "mark_classified_messages_read",
      "block_classified_conversation",
      "moderate_classified_conversation",
    ]) {
      expect(messagingService).toMatch(new RegExp(`rpc\\(\\s*"${command}"`));
    }
    for (const command of [
      "report_classified_comment",
      "report_classified_conversation",
      "report_classified_message",
    ]) {
      expect(incidentService).toContain(`rpc("${command}"`);
    }
    expect(messagingService).not.toMatch(
      /\.from\("(?:conversations|messages)"\)[\s\S]{0,250}\.(?:insert|update|delete)\(/,
    );
    expect(messagingService).not.toContain("message_reports");
  });

  it("removes browser-supplied incident identities and evidence payloads", () => {
    expect(classifiedCommentService).not.toMatch(
      /commentAuthorProfileId|reporterProfileId|commentAuthorRole|reporterRole|evidence/,
    );
    expect(classifiedCommentService).not.toContain('.from("trust_events")');
    expect(directMessagesHook).not.toContain("TrustEventService.createEvent");
    expect(directMessagesHook).not.toMatch(
      /blocked_by|subject_profile_id|actor_profile_id/,
    );
    expect(read("src/core/messaging/pages/ChatPage.tsx")).not.toContain(
      "sender_profile_id: user.id",
    );
  });

  it("keeps remote catalog and transactional behavior proofs in the repository", () => {
    expect(
      read("tests/security/trust-messaging-commands-remote-audit.sql"),
    ).toContain("audit_authenticated_select");
    const probe = read(
      "tests/security/trust-messaging-commands-remote-probe.sql",
    );
    expect(probe).toContain("direct_trust_incident_was_not_blocked");
    expect(probe).toContain("conversation_report_was_not_atomic");
    expect(probe).toContain("ROLLBACK;");
  });
});
