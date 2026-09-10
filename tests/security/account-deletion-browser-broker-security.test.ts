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

describe("account deletion browser broker boundary", () => {
  it("keeps deletion status and request actions on the authenticated privacy broker", () => {
    expect(privacyRpcService).toContain('"getDeletionStatus"');
    expect(privacyRpcService).toContain('"requestAccountDeletion"');
    expect(privacyRpcService).toContain(
      'this.invoke<unknown>("getDeletionStatus")',
    );
    expect(privacyRpcService).toContain(
      'this.invoke<unknown>("requestAccountDeletion"',
    );
  });

  it("does not convert deletion-status transport failures into a valid null status", () => {
    expect(privacyRpcService).toContain(
      'import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker"',
    );
    expect(privacyRpcService).not.toContain("invokeNullableSupabaseBroker");
    expect(broker).toContain("export async function invokeNullableSupabaseBroker");
    expect(broker).toContain("catch {");
    expect(broker).toContain("return null;");
  });

  it("allows only an explicit broker data null to represent no deletion request", () => {
    expect(broker).toContain(
      'Object.prototype.hasOwnProperty.call(response, "data")',
    );
    expect(privacyRpcService).toContain("if (result === null) return null;");
    expect(privacyRpcService).toContain("return parseDeletionStatus(result);");
  });

  it("validates the deletion status identity, enum, dates and counters at runtime", () => {
    expect(privacyRpcService).toContain("UUID_PATTERN.test(value.requestId)");
    expect(privacyRpcService).toContain("DELETION_STATUSES.has(");
    expect(privacyRpcService).toContain("isIsoTimestamp(value.requestedAt)");
    expect(privacyRpcService).toContain("isIsoTimestamp(value.scheduledPurgeAt)");
    expect(privacyRpcService).toContain("isNonNegativeInteger(value.daysRemaining)");
    expect(privacyRpcService).toContain('typeof value.exportRequested !== "boolean"');
  });

  it("requires the request receipt to be internally coherent", () => {
    expect(privacyRpcService).toContain(
      "value.daysUntilPurge !== base.daysRemaining",
    );
    expect(privacyRpcService).toContain(
      "value.recoveryPossibleUntil !== base.scheduledPurgeAt",
    );
    expect(privacyRpcService).toContain(
      "Privacy broker returned invalid deletion request",
    );
  });

  it("requires explicit receipts for consent and cancellation", () => {
    expect(privacyRpcService).toContain("UUID_PATTERN.test(result.consentId)");
    expect(privacyRpcService).toContain('typeof result.cancelled !== "boolean"');
  });
});
