import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

const migration = readProjectFile(
  "supabase/migrations/20260911180000_idempotent_emergency_dispatch_recovery_g76.sql",
);
const worker = readProjectFile(
  "supabase/functions/send-emergency-email/index.ts",
);
const provider = readProjectFile(
  "src/core/safety/providers/EmailNotificationProvider.ts",
);

describe("G76 idempotent emergency dispatch recovery", () => {
  it("serializes provider attempts and bounds automatic recovery", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.begin_emergency_provider_attempt",
    );
    expect(migration).toContain("INTERVAL '30 seconds'");
    expect(migration).toContain("INTERVAL '23 hours'");
    expect(migration).toContain("provider_attempt_count >= 5");
    expect(migration).toContain("FOR UPDATE;");
  });

  it("fails closed when provider outcome cannot be safely retried", () => {
    expect(migration).toContain("'reconciliation_required'");
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.require_emergency_delivery_reconciliation",
    );
    expect(migration).toContain("provider_idempotency_window_expired");
    expect(provider).toContain("| 'reconciliation_required'");
  });

  it("keeps recovery commands service-role only", () => {
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.begin_emergency_provider_attempt(uuid)",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.require_emergency_delivery_reconciliation(uuid, text)",
    );
    expect(migration.match(/TO service_role;/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("uses one deterministic idempotency key per durable delivery", () => {
    expect(worker).toContain(
      "const idempotencyKey = `emergency-delivery/${providerAttempt.id}`",
    );
    expect(worker).toContain("'Idempotency-Key': idempotencyKey");
    expect(worker).toContain("body: JSON.stringify(providerPayload)");
  });

  it("never blindly retries a concurrent or expired provider attempt", () => {
    expect(worker).toContain("begin_emergency_provider_attempt");
    expect(worker).toContain("providerAttemptSuppressed: true");
    expect(worker).toContain("concurrent_idempotent_requests");
    expect(worker).toContain("requireDeliveryReconciliation(");
  });

  it("keeps retryable provider failures dispatching instead of lying as failed", () => {
    const retryableBranch = worker.indexOf("resendResponse.status === 408");
    const permanentFailure = worker.indexOf("const failedOrCurrent = await markDeliveryFailed(");
    expect(retryableBranch).toBeGreaterThan(-1);
    expect(permanentFailure).toBeGreaterThan(retryableBranch);
    expect(worker).toContain("emergency_email_provider_retryable_failure");
    expect(worker).toContain("retryableProviderFailure: true");
    expect(worker).toContain("buildDeliveryOutcome(contactId, providerAttempt");
    expect(worker).not.toContain(
      "errorResponse('Emergency email provider temporarily unavailable'",
    );
  });

  it("returns durable lifecycle truth when another canonical actor wins a race", () => {
    expect(worker).toContain("const current = await getDeliveryById(dispatching.id)");
    expect(worker).toContain("buildDeliveryOutcome(contactId, current");
    expect(worker).toContain("const response = buildDeliveryOutcome(");
    expect(worker).toContain("SUCCESSFUL_DELIVERY_STATUSES");
    expect(provider).toContain("isConsistentWorkerOutcome");
  });

  it("allows only an already-authorized dispatch to continue after terminalization", () => {
    expect(worker).toContain(
      "latestBeforeClaim?.status === 'dispatching'",
    );
    expect(worker).toContain(
      "!['active', 'acknowledged'].includes(alert.status) && !dispatching",
    );
    expect(worker).toContain("getProviderPayload(dispatching.id)");
    expect(worker).not.toContain("recoveryCandidate = latest");
  });
});
