import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

const migration = readProjectFile(
  "supabase/migrations/20260911170000_cancel_terminal_emergency_delivery_race_g75.sql",
);
const immutablePayloadMigration = readProjectFile(
  "supabase/migrations/20260911193000_immutable_emergency_provider_payload_g78.sql",
);
const worker = readProjectFile(
  "supabase/functions/send-emergency-email/index.ts",
);
const provider = readProjectFile(
  "src/core/safety/providers/EmailNotificationProvider.ts",
);

describe("G75 terminal emergency delivery race", () => {
  it("cancels only work that has not crossed the provider-dispatch boundary", () => {
    expect(migration).toContain(
      "delivery.status IN ('pending', 'processing')",
    );
    expect(migration).toContain(
      "private.cancel_emergency_delivery_outbox_on_terminal_alert()",
    );
    expect(migration).toContain(
      "NEW.status IN ('resolved', 'false_alarm')",
    );
    expect(migration).toContain("status = 'cancelled'");
    expect(migration).toContain("cancelled_at = v_now");
  });

  it("serializes claim and historical dispatch authorization on the owning alert", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.claim_emergency_delivery_attempt",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.authorize_emergency_delivery_dispatch",
    );
    expect(migration.match(/FROM public\.emergency_alerts alert[\s\S]*?FOR UPDATE;/g)?.length)
      .toBeGreaterThanOrEqual(2);
    expect(migration).toContain(
      "v_alert_status NOT IN ('active', 'acknowledged')",
    );
  });

  it("keeps the final worker behind the canonical dispatch boundary", () => {
    const authorizationIndex = worker.indexOf(
      "authorize_emergency_email_dispatch",
    );
    const providerAttemptIndex = worker.indexOf(
      "begin_emergency_provider_attempt",
    );
    const providerFetchIndex = worker.indexOf(
      "fetch('https://api.resend.com/emails'",
    );

    expect(authorizationIndex).toBeGreaterThan(-1);
    expect(providerAttemptIndex).toBeGreaterThan(authorizationIndex);
    expect(providerFetchIndex).toBeGreaterThan(providerAttemptIndex);
    expect(worker).toContain("getProviderPayload(dispatching.id)");
    expect(worker).not.toContain("authorize_emergency_delivery_dispatch");
    expect(immutablePayloadMigration).toContain(
      "DROP FUNCTION public.authorize_emergency_delivery_dispatch(uuid)",
    );
  });

  it("keeps historical service-only delivery commands inaccessible to browser roles", () => {
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.claim_emergency_delivery_attempt(uuid, uuid, text)",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.authorize_emergency_delivery_dispatch(uuid)",
    );
    expect(migration).toContain("TO service_role;");
    expect(migration).not.toContain("auth.role()");
  });

  it("keeps worker and client delivery status contracts aligned", () => {
    for (const status of ["dispatching", "cancelled"]) {
      expect(worker).toContain(`| '${status}'`);
      expect(provider).toContain(`| '${status}'`);
    }
  });

  it("never calls the provider when dispatch authorization is denied", () => {
    expect(worker).toContain("if (!dispatching)");
    expect(worker).toContain(
      "error: 'Emergency delivery is no longer dispatchable'",
    );
    expect(worker).toContain("status: 'cancelled'");
  });
});
