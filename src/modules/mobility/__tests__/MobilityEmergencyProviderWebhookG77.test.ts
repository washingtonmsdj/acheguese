import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

const migration = readProjectFile(
  "supabase/migrations/20260911190000_provider_confirmed_emergency_delivery_g77.sql",
);
const worker = readProjectFile(
  "supabase/functions/send-emergency-email/index.ts",
);
const payloadBuilder = readProjectFile(
  "supabase/functions/send-emergency-email/providerPayload.ts",
);
const webhook = readProjectFile(
  "supabase/functions/resend-emergency-webhook/index.ts",
);
const config = readProjectFile("supabase/config.toml");
const workerDeno = readProjectFile(
  "supabase/functions/send-emergency-email/deno.json",
);
const webhookDeno = readProjectFile(
  "supabase/functions/resend-emergency-webhook/deno.json",
);

describe("G77 provider-confirmed emergency delivery", () => {
  it("keeps provider event receipts private and deduplicated by event id", () => {
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS private.emergency_delivery_provider_events",
    );
    expect(migration).toContain("provider_event_id text PRIMARY KEY");
    expect(migration).toContain("ON CONFLICT (provider_event_id) DO NOTHING");
    expect(migration).toContain(
      "REVOKE ALL ON TABLE private.emergency_delivery_provider_events",
    );
  });

  it("makes webhook mutations service-role-only", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.apply_emergency_delivery_provider_event",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.apply_emergency_delivery_provider_event",
    );
    expect(migration).toContain("TO service_role;");
    expect(webhook).toContain("apply_emergency_delivery_provider_event");
    expect(webhook).not.toContain(".from('emergency_delivery_log').update");
  });

  it("verifies the raw webhook body before applying a provider event", () => {
    const readBody = webhook.indexOf("readTextBody(req");
    const verify = webhook.indexOf("webhookVerifier.verify(rawBody.data");
    const apply = webhook.indexOf("apply_emergency_delivery_provider_event");

    expect(readBody).toBeGreaterThan(-1);
    expect(verify).toBeGreaterThan(readBody);
    expect(apply).toBeGreaterThan(verify);
    expect(webhook).toContain("svix-id");
    expect(webhook).toContain("svix-timestamp");
    expect(webhook).toContain("svix-signature");
    expect(webhook).toContain("RESEND_WEBHOOK_SECRET");
  });

  it("exposes the webhook without Supabase JWT but not without provider signature", () => {
    expect(config).toContain("[functions.resend-emergency-webhook]");
    expect(config).toContain("verify_jwt = false");
    expect(webhook).toContain("Missing webhook signature headers");
    expect(webhook).toContain("Invalid webhook signature");
  });

  it("correlates events through the signed durable delivery tag", () => {
    expect(worker).toContain("buildEmergencyProviderPayload");
    expect(payloadBuilder).toContain("acheguese_delivery_id");
    expect(webhook).toContain("tags?.acheguese_delivery_id");
    expect(migration).toContain("p_delivery_id uuid");
    expect(migration).toContain("delivery.provider_message_id = v_message_id");
  });

  it("does not let synchronous acceptance regress provider-confirmed terminal outcomes", () => {
    expect(migration).toContain(
      "delivery.status IN ('delivered', 'failed') THEN delivery.status",
    );
    expect(worker).toContain(
      "confirm_emergency_delivery_provider_acceptance",
    );
    expect(worker).not.toContain("status: 'sent',\n        provider_message_id");
  });

  it("handles duplicate and out-of-order provider events without lifecycle regression", () => {
    expect(migration).toContain("v_event_at < v_delivery.provider_event_at");
    expect(migration).toContain("v_event_type <> 'email.delivered'");
    expect(migration).toContain("WHEN 'email.delivered' THEN 'delivered'");
    expect(migration).toContain("WHEN 'email.bounced' THEN CASE");
    expect(migration).toContain("WHEN 'email.suppressed' THEN CASE");
  });

  it("uses function-local pinned modern npm dependencies", () => {
    expect(worker).not.toContain("deno.land/std");
    expect(worker).not.toContain("esm.sh/@supabase/supabase-js");
    expect(webhook).not.toContain("esm.sh/@supabase/supabase-js");
    expect(workerDeno).toContain(
      '"@supabase/supabase-js": "npm:@supabase/supabase-js@2.116.0"',
    );
    expect(webhookDeno).toContain(
      '"@supabase/supabase-js": "npm:@supabase/supabase-js@2.116.0"',
    );
    expect(webhookDeno).toContain('"svix": "npm:svix@2.3.0"');
  });
});
