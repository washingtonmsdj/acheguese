import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

const migration = readProjectFile(
  "supabase/migrations/20260911193000_immutable_emergency_provider_payload_g78.sql",
);
const worker = readProjectFile(
  "supabase/functions/send-emergency-email/index.ts",
);
const payloadBuilder = readProjectFile(
  "supabase/functions/send-emergency-email/providerPayload.ts",
);

describe("G78 immutable emergency provider payload", () => {
  it("stores the exact provider payload only in private storage", () => {
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS private.emergency_delivery_provider_payloads",
    );
    expect(migration).toContain("payload jsonb NOT NULL");
    expect(migration).toContain(
      "REVOKE ALL ON TABLE private.emergency_delivery_provider_payloads",
    );
    expect(migration).not.toContain(
      "ALTER TABLE public.emergency_delivery_log\n  ADD COLUMN IF NOT EXISTS provider_payload",
    );
  });

  it("freezes payload in the same transaction that authorizes dispatch", () => {
    const authorize = migration.indexOf(
      "CREATE OR REPLACE FUNCTION public.authorize_emergency_email_dispatch",
    );
    const lockAlert = migration.indexOf(
      "FROM public.emergency_alerts alert",
      authorize,
    );
    const insertSnapshot = migration.indexOf(
      "INSERT INTO private.emergency_delivery_provider_payloads",
      authorize,
    );
    const dispatchTransition = migration.indexOf(
      "SET status = 'dispatching'",
      authorize,
    );

    expect(authorize).toBeGreaterThan(-1);
    expect(lockAlert).toBeGreaterThan(authorize);
    expect(insertSnapshot).toBeGreaterThan(lockAlert);
    expect(dispatchTransition).toBeGreaterThan(insertSnapshot);
    expect(migration).toContain("FOR UPDATE;");
  });

  it("validates durable target and signed delivery tag before snapshotting", () => {
    expect(migration).toContain(
      "<> pg_catalog.lower(v_target)",
    );
    expect(migration).toContain("'name', 'acheguese_delivery_id'");
    expect(migration).toContain("'value', p_delivery_id::text");
    expect(migration).toContain("pg_catalog.pg_column_size(p_payload) > 131072");
  });

  it("removes the old dispatch authorization bypass", () => {
    expect(migration).toContain(
      "DROP FUNCTION public.authorize_emergency_delivery_dispatch(uuid)",
    );
    expect(worker).not.toContain("authorize_emergency_delivery_dispatch");
    expect(worker).toContain("authorize_emergency_email_dispatch");
  });

  it("retries from the immutable snapshot instead of rebuilding mutable data", () => {
    const snapshotLookup = worker.indexOf("getProviderPayload(dispatching.id)");
    const providerFetch = worker.indexOf("fetch('https://api.resend.com/emails'");

    expect(snapshotLookup).toBeGreaterThan(-1);
    expect(providerFetch).toBeGreaterThan(snapshotLookup);
    expect(worker).toContain("body: JSON.stringify(providerPayload)");
    expect(worker).toContain("get_emergency_email_provider_payload");
  });

  it("uses the durable queued recipient instead of re-reading mutable contact PII", () => {
    expect(worker).not.toContain("loadActiveOwnedContact(");
    expect(worker).not.toContain(".from('emergency_contacts')");
    expect(worker).toContain("extractEmail(claimed.target || '')");
    expect(worker).toContain("readQueuedContactName(claimed.metadata)");
  });

  it("allows already-authorized recovery without mutable contact state", () => {
    const recoveryDetection = worker.indexOf(
      "latestBeforeClaim?.status === 'dispatching'",
    );
    const snapshotLookup = worker.indexOf("getProviderPayload(dispatching.id)");

    expect(recoveryDetection).toBeGreaterThan(-1);
    expect(snapshotLookup).toBeGreaterThan(recoveryDetection);
  });

  it("builds provider tags from the canonical durable delivery id", () => {
    expect(payloadBuilder).toContain("acheguese_delivery_id");
    expect(payloadBuilder).toContain("value: input.deliveryId");
    expect(payloadBuilder).toContain("acheguese_channel");
  });
});
