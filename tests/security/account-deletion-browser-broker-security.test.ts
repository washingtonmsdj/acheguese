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
      "this.invoke<AccountDeletionStatusBrokerData | null>(\"getDeletionStatus\")",
    );
    expect(privacyRpcService).toContain(
      "this.invoke<RequestAccountDeletionBrokerData>",
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

  it("allows only a broker data payload to represent a genuine no-request state", () => {
    expect(broker).toContain(
      'Object.prototype.hasOwnProperty.call(response, "data")',
    );
    expect(privacyRpcService).toContain(
      "The broker returns `{ data: null }` when there is no deletion request.",
    );
    expect(privacyRpcService).toContain(
      "Transport/broker failures must remain failures so route guards can fail closed.",
    );
  });
});
