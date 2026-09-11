import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

const migration = readProjectFile(
  "supabase/migrations/20260911200000_single_emergency_delivery_failure_authority_g79.sql",
);
const worker = readProjectFile(
  "supabase/functions/send-emergency-email/index.ts",
);
const ownership = JSON.parse(
  readProjectFile("docs/architecture/core-platform-ownership.json"),
) as {
  controlledTables: Array<{
    name: string;
    currentOwner: string;
    allowedReaders: Array<{ path: string; maxCalls: number }>;
    allowedWriters: Array<{ path: string; maxCalls: number }>;
  }>;
  controlledRpcs: Array<{
    name: string;
    allowedCallers: Array<{ path: string; maxCalls: number }>;
  }>;
};

describe("G79 single emergency-delivery failure authority", () => {
  it("owns failure mutation in one service-role-only RPC", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.fail_emergency_delivery_attempt",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.fail_emergency_delivery_attempt",
    );
    expect(migration).toContain("TO service_role;");
  });

  it("locks the delivery before deciding whether failure is still valid", () => {
    expect(migration).toContain("FOR UPDATE;");
    expect(migration).toContain(
      "IF v_delivery.status <> p_expected_status THEN",
    );
    expect(migration).toContain("RETURN v_delivery;");
  });

  it("allows failure only from reversible worker-owned states", () => {
    expect(migration).toContain(
      "p_expected_status NOT IN ('processing', 'dispatching')",
    );
    expect(migration).toContain("SET status = 'failed'");
  });

  it("removes direct worker writes to emergency delivery lifecycle", () => {
    expect(worker).toContain("fail_emergency_delivery_attempt");
    expect(worker).not.toContain(
      ".from('emergency_delivery_log')\n    .update(",
    );
  });

  it("preserves a concurrent canonical outcome instead of overwriting it", () => {
    expect(migration).toContain(
      "Another canonical actor may have won while the provider request or claim",
    );
    expect(worker).toContain("deliveryStatus: failedOrCurrent?.status ?? 'missing'");
  });

  it("removes the obsolete direct-writer architecture allowance", () => {
    const delivery = ownership.controlledTables.find(
      (entry) => entry.name === "emergency_delivery_log",
    );

    expect(delivery?.currentOwner).toBe("server-owned-emergency-delivery-rpcs");
    expect(delivery?.allowedWriters).toEqual([]);
    expect(delivery?.allowedReaders).toEqual([
      {
        path: "supabase/functions/send-emergency-email/index.ts",
        maxCalls: 2,
        role: "trusted-delivery-read-model",
      },
    ]);
  });

  it("declares every external-delivery RPC caller explicitly", () => {
    const expected = new Map([
      ["claim_emergency_delivery_attempt", "supabase/functions/send-emergency-email/index.ts"],
      ["authorize_emergency_email_dispatch", "supabase/functions/send-emergency-email/index.ts"],
      ["get_emergency_email_provider_payload", "supabase/functions/send-emergency-email/index.ts"],
      ["begin_emergency_provider_attempt", "supabase/functions/send-emergency-email/index.ts"],
      ["require_emergency_delivery_reconciliation", "supabase/functions/send-emergency-email/index.ts"],
      ["fail_emergency_delivery_attempt", "supabase/functions/send-emergency-email/index.ts"],
      ["confirm_emergency_delivery_provider_acceptance", "supabase/functions/send-emergency-email/index.ts"],
      ["apply_emergency_delivery_provider_event", "supabase/functions/resend-emergency-webhook/index.ts"],
    ]);

    for (const [name, caller] of expected) {
      const rpc = ownership.controlledRpcs.find((entry) => entry.name === name);
      expect(rpc?.allowedCallers).toEqual([
        expect.objectContaining({ path: caller, maxCalls: 1 }),
      ]);
    }
  });
});
