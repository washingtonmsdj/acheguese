import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const privacyRpcService = readFileSync(
  join(root, "src/core/privacy/services/PrivacyRpcService.ts"),
  "utf8",
);
const broker = readFileSync(
  join(
    root,
    "src/core/infrastructure/edge-functions/edgeFunctionBroker.ts",
  ),
  "utf8",
);

describe("account deletion browser authority boundary", () => {
  it("uses the self-only PostgREST RPC for status and keeps deletion mutations on the authenticated broker", () => {
    expect(privacyRpcService).toContain(
      '.rpc("get_current_account_deletion_status")',
    );
    expect(privacyRpcService).not.toContain(
      'this.invoke<unknown>("getDeletionStatus"',
    );
    expect(privacyRpcService).toContain(
      'this.invoke<unknown>("requestAccountDeletion"',
    );
    expect(privacyRpcService).toContain(
      'this.invoke<unknown>("cancelAccountDeletion")',
    );
  });

  it("keeps deletion-status transport and database failures distinct from a clean no-request state", () => {
    expect(privacyRpcService).toContain("if (error)");
    expect(privacyRpcService).toContain(
      "Privacy deletion status query failed:",
    );
    expect(privacyRpcService).toContain(
      ".abortSignal(AbortSignal.timeout(TIMEOUTS.PRIVACY_ACCESS_GATE))",
    );
    expect(privacyRpcService).not.toContain("invokeNullableSupabaseBroker");
    expect(broker).toContain("export async function invokeNullableSupabaseBroker");
  });

  it("allows only an explicit RPC data null to represent no deletion request", () => {
    expect(privacyRpcService).toContain("if (data === null) return null;");
    expect(privacyRpcService).toContain("return parseDeletionStatusRead(data);");
  });

  it("validates the self-only deletion status enum, date and counter at runtime", () => {
    expect(privacyRpcService).toContain("DELETION_STATUSES.has(");
    expect(privacyRpcService).toContain(
      "isIsoTimestamp(value.scheduledPurgeAt)",
    );
    expect(privacyRpcService).toContain(
      "isNonNegativeInteger(value.daysRemaining)",
    );
  });

  it("still validates privileged deletion mutation receipts completely", () => {
    expect(privacyRpcService).toContain("UUID_PATTERN.test(value.requestId)");
    expect(privacyRpcService).toContain("isIsoTimestamp(value.requestedAt)");
    expect(privacyRpcService).toContain(
      'typeof value.exportRequested !== "boolean"',
    );
    expect(privacyRpcService).toContain(
      "value.daysUntilPurge !== base.daysRemaining",
    );
    expect(privacyRpcService).toContain(
      "value.recoveryPossibleUntil !== base.scheduledPurgeAt",
    );
  });

  it("requires explicit receipts for consent and cancellation", () => {
    expect(privacyRpcService).toContain("UUID_PATTERN.test(result.consentId)");
    expect(privacyRpcService).toContain('typeof result.cancelled !== "boolean"');
  });
});
