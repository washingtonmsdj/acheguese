import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

const migration = readProjectFile(
  "supabase/migrations/20260714116000_normalize_safety_notification_producers.sql",
);
const contactEmailMigration = readProjectFile(
  "supabase/migrations/20260714117000_normalize_emergency_contact_email.sql",
);
const contactPrivacyMigration = readProjectFile(
  "supabase/migrations/20260826003840_restrict_emergency_contacts_to_direct_owner.sql",
);
const durableOutboxMigration = readProjectFile(
  "supabase/migrations/20260911141000_durable_emergency_delivery_outbox_g72.sql",
);
const terminalRaceMigration = readProjectFile(
  "supabase/migrations/20260911170000_cancel_terminal_emergency_delivery_race_g75.sql",
);
const providerEventMigration = readProjectFile(
  "supabase/migrations/20260911190000_provider_confirmed_emergency_delivery_g77.sql",
);
const immutablePayloadMigration = readProjectFile(
  "supabase/migrations/20260911193000_immutable_emergency_provider_payload_g78.sql",
);
const singleAuthorityMigration = readProjectFile(
  "supabase/migrations/20260911200000_single_emergency_delivery_failure_authority_g79.sql",
);
const autonomousDeliveryMigration = readProjectFile(
  "supabase/migrations/20260911210000_autonomous_emergency_delivery_dispatcher_g80.sql",
);
const safetyService = readProjectFile(
  "src/core/safety/services/SafetyService.ts",
);
const rideShareService = readProjectFile(
  "src/core/safety/services/SafetyRideShareService.ts",
);
const emailProvider = readProjectFile(
  "src/core/safety/providers/EmailNotificationProvider.ts",
);
const emergencyEmailFunction = readProjectFile(
  "supabase/functions/send-emergency-email/index.ts",
);
const emergencyWebhook = readProjectFile(
  "supabase/functions/resend-emergency-webhook/index.ts",
);
const supabaseConfig = readProjectFile("supabase/config.toml");
const edgeAuthPolicy = JSON.parse(
  readProjectFile(
    "docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json",
  ),
) as {
  noJwtAllowlist: Record<
    string,
    { kind: string; requiredPatterns: string[] }
  >;
  serviceRoleAllowlist: Record<
    string,
    { kind: string; risk: string; requiredPatterns: string[] }
  >;
};

describe("Safety Core Platform security", () => {
  it("normalizes the legacy emergency-alert contract without parallel columns", () => {
    expect(migration).toContain("RENAME COLUMN type TO alert_type");
    expect(migration).toContain("RENAME COLUMN message TO description");
    expect(migration).not.toMatch(/ADD COLUMN IF NOT EXISTS (?:type|message)\b/);
    expect(migration).toContain("emergency_alerts_profile_required");
    expect(migration).toContain("emergency_alerts_location_check");
  });

  it("reproduces the complete Safety persistence boundary", () => {
    for (const table of [
      "safety_incidents",
      "safety_evidence",
      "ride_shares",
      "safety_audit_log",
      "emergency_contacts",
      "emergency_delivery_log",
    ]) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
    }
  });

  it("binds browser writes to owned profiles and canonical rides", () => {
    expect(migration).toContain("profile.id = emergency_alerts.profile_id");
    expect(migration).toContain("ride.id = emergency_alerts.ride_id");
    expect(migration).toContain("profile.id = safety_incidents.reported_by");
    expect(migration).toContain("ride.id = safety_incidents.ride_id");
    expect(migration).toContain("profile.id = ride_shares.created_by");
    expect(migration).toContain("ride.id = ride_shares.ride_id");
    expect(migration).toContain(
      "incident.reported_by = safety_evidence.uploaded_by",
    );
  });

  it("keeps emergency-contact PII visible only to the direct profile owner", () => {
    expect(contactPrivacyMigration).toContain(
      "CREATE POLICY emergency_contacts_select_own",
    );
    expect(contactPrivacyMigration).toContain(
      "profile.id = emergency_contacts.profile_id",
    );
    expect(contactPrivacyMigration).toContain(
      "profile.user_id = (SELECT auth.uid())",
    );
    const contactPolicy = contactPrivacyMigration.slice(
      contactPrivacyMigration.indexOf(
        "CREATE POLICY emergency_contacts_select_own",
      ),
      contactPrivacyMigration.indexOf("DO $verify$"),
    );
    expect(contactPolicy).not.toContain(
      "private.auth_can_access_profile(profile_id)",
    );
    expect(contactPolicy).not.toContain("profile_members");
    expect(contactPrivacyMigration).toContain(
      "has_table_privilege('anon', 'public.emergency_contacts', 'SELECT')",
    );
  });

  it("keeps delivery logs and safety audit writes server-owned", () => {
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.emergency_delivery_log FROM anon, authenticated",
    );
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.safety_audit_log FROM anon, authenticated",
    );
    expect(migration).toContain("trg_audit_safety_evidence_insert");
    expect(safetyService).not.toContain("from('safety_audit_log')");
    expect(safetyService).not.toContain("createAuditEntry");
    expect(singleAuthorityMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.fail_emergency_delivery_attempt",
    );
    expect(emergencyEmailFunction).not.toContain(
      ".from('emergency_delivery_log')\n    .update(",
    );
  });

  it("creates external SOS delivery obligations durably with the alert", () => {
    expect(durableOutboxMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.enqueue_emergency_delivery_outbox",
    );
    expect(durableOutboxMigration).toContain(
      "AFTER INSERT ON public.emergency_alerts",
    );
    expect(durableOutboxMigration).toContain("'pending'");
    expect(durableOutboxMigration).toContain(
      "idx_emergency_delivery_one_open_attempt",
    );
    expect(autonomousDeliveryMigration).toContain("'contact_name', contact.name");
  });

  it("serializes claim, terminal cancellation and provider dispatch on canonical state", () => {
    expect(terminalRaceMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.claim_emergency_delivery_attempt",
    );
    expect(terminalRaceMigration).toContain("FOR UPDATE SKIP LOCKED");
    expect(terminalRaceMigration).toContain("status = 'processing'");
    expect(terminalRaceMigration).toContain("status = 'cancelled'");
    expect(terminalRaceMigration).toContain("status = 'dispatching'");
    expect(emergencyEmailFunction).toContain(
      "'claim_emergency_delivery_attempt'",
    );
    expect(emergencyEmailFunction).toContain("p_alert_id: alertId");
    expect(emergencyEmailFunction).toContain("p_contact_id: contactId");
  });

  it("uses fail-closed user-or-cron authority before emergency delivery", () => {
    expect(emergencyEmailFunction).toContain(
      "const cronRequested = req.headers.has('x-cron-secret')",
    );
    expect(emergencyEmailFunction).toContain("requireCronSecret(req, ALLOWED_METHODS)");
    expect(emergencyEmailFunction).toContain(
      "requireAuthenticatedUser(req, supabase)",
    );
    expect(emergencyEmailFunction).not.toContain("extractBearerToken(req)");
    expect(emergencyEmailFunction).not.toContain(
      "requireOperationalAccount(\n      supabase",
    );

    const noJwtPolicy = edgeAuthPolicy.noJwtAllowlist["send-emergency-email"];
    expect(noJwtPolicy?.kind).toBe("cron-secret");
    expect(noJwtPolicy?.requiredPatterns).toContain("requireCronSecret\\s*\\(");
    expect(noJwtPolicy?.requiredPatterns).toContain(
      "requireAuthenticatedUser\\s*\\(",
    );

    const serviceRolePolicy =
      edgeAuthPolicy.serviceRoleAllowlist["send-emergency-email"];
    expect(serviceRolePolicy?.kind).toBe("notification-broker");
    expect(serviceRolePolicy?.risk).toBe("Critical");
    expect(serviceRolePolicy?.requiredPatterns).toContain(
      "requireAuthenticatedUser\\s*\\(",
    );
    expect(serviceRolePolicy?.requiredPatterns).toContain("requireCronSecret\\s*\\(");

    const configBlock = supabaseConfig.slice(
      supabaseConfig.indexOf("[functions.send-emergency-email]"),
      supabaseConfig.indexOf("[functions.resend-emergency-webhook]"),
    );
    expect(configBlock).toContain("verify_jwt = false");
  });

  it("never equates provider acceptance with confirmed delivery", () => {
    expect(durableOutboxMigration).toContain(
      "emergency_delivery_delivered_at_contract",
    );
    expect(durableOutboxMigration).toContain(
      "status = 'delivered' AND delivered_at IS NOT NULL",
    );
    expect(providerEventMigration).toContain(
      "WHEN 'email.delivered' THEN 'delivered'",
    );
    expect(providerEventMigration).toContain(
      "confirm_emergency_delivery_provider_acceptance",
    );
    expect(emergencyEmailFunction).toContain(
      "confirm_emergency_delivery_provider_acceptance",
    );
    expect(emergencyEmailFunction).not.toContain(
      "delivered_at: new Date().toISOString()",
    );
  });

  it("freezes provider payload before dispatch and reuses it for retries", () => {
    expect(immutablePayloadMigration).toContain(
      "private.emergency_delivery_provider_payloads",
    );
    expect(immutablePayloadMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.authorize_emergency_email_dispatch",
    );
    expect(immutablePayloadMigration).toContain(
      "DROP FUNCTION public.authorize_emergency_delivery_dispatch(uuid)",
    );
    expect(emergencyEmailFunction).toContain(
      "'authorize_emergency_email_dispatch'",
    );
    expect(emergencyEmailFunction).toContain(
      "'get_emergency_email_provider_payload'",
    );
    expect(emergencyEmailFunction).toContain(
      "'Idempotency-Key': idempotencyKey",
    );
  });

  it("accepts provider events only through signed webhook ingestion", () => {
    expect(providerEventMigration).toContain(
      "private.emergency_delivery_provider_events",
    );
    expect(providerEventMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.apply_emergency_delivery_provider_event",
    );
    expect(emergencyWebhook).toContain("svix-id");
    expect(emergencyWebhook).toContain("svix-timestamp");
    expect(emergencyWebhook).toContain("svix-signature");
    expect(emergencyWebhook).toContain(
      "webhookVerifier.verify(rawBody.data",
    );
    expect(emergencyWebhook).toContain(
      "apply_emergency_delivery_provider_event",
    );

    const noJwtPolicy = edgeAuthPolicy.noJwtAllowlist[
      "resend-emergency-webhook"
    ];
    expect(noJwtPolicy?.kind).toBe("signed-webhook");
    expect(noJwtPolicy?.requiredPatterns).toContain(
      "webhookVerifier\\.verify\\s*\\(",
    );
    expect(noJwtPolicy?.requiredPatterns).toContain("RESEND_WEBHOOK_SECRET");

    const serviceRolePolicy = edgeAuthPolicy.serviceRoleAllowlist[
      "resend-emergency-webhook"
    ];
    expect(serviceRolePolicy?.kind).toBe("signed-webhook");
    expect(serviceRolePolicy?.risk).toBe("Critical");
    expect(serviceRolePolicy?.requiredPatterns).toContain(
      "apply_emergency_delivery_provider_event",
    );
  });

  it("derives Safety notification recipients in the database", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.enqueue_safety_notification",
    );
    expect(migration).toContain("WHERE profile.id = v_profile_id");
    expect(migration).toContain("private.enqueue_notification(");
    expect(safetyService).not.toContain("NotificationService.createNotification");
    expect(rideShareService).not.toContain("NotificationService.createNotification");
  });

  it("exposes shared rides through a bounded bearer-token RPC only", () => {
    expect(migration).toContain(
      "-- security-authority: public-rpc public.get_shared_ride_safety_data",
    );
    expect(migration).toContain("p_share_token ~ '^[A-Za-z0-9]{32}$'");
    expect(migration).toContain("share.expires_at > now()");
    expect(migration).toContain("REVOKE ALL ON TABLE public.ride_shares FROM anon");
    expect(rideShareService).toContain("get_shared_ride_safety_data");
    expect(rideShareService).toContain("const data = rows?.[0]");
  });

  it("accepts only IDs from clients and dispatches the durable queued recipient", () => {
    expect(emailProvider).toContain("contactId: contact.id");
    expect(emailProvider).toContain("alertId: alert.id");
    expect(emailProvider).not.toContain("alertDescription");
    expect(emailProvider).not.toContain("alertLocation");
    expect(emergencyEmailFunction).toMatch(
      /interface EmailRequest\s*{\s*contactId: string;\s*alertId: string;\s*}/,
    );
    expect(emergencyEmailFunction).toContain(
      "'id, profile_id, alert_type, status, description, latitude, longitude, created_at'",
    );
    expect(emergencyEmailFunction).toContain(
      "!['active', 'acknowledged'].includes(alert.status)",
    );
    expect(emergencyEmailFunction).not.toContain(".from('emergency_contacts')");
    expect(emergencyEmailFunction).toContain("extractEmail(claimed.target || '')");
    expect(emergencyEmailFunction).toContain("readQueuedContactName(claimed.metadata)");
    expect(emergencyEmailFunction).toContain(
      "action: 'emergency_email_provider_failed'",
    );
    expect(emergencyEmailFunction).not.toContain("body: resendRaw");
    expect(contactEmailMigration).toContain("ADD COLUMN IF NOT EXISTS email TEXT");
    expect(contactEmailMigration).toContain("emergency_contacts_email_required");
    expect(contactEmailMigration).toContain("ALTER COLUMN phone DROP NOT NULL");
  });

  it("guarantees autonomous delivery through the same canonical broker", () => {
    expect(autonomousDeliveryMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.prepare_emergency_delivery_work",
    );
    expect(autonomousDeliveryMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.invoke_emergency_delivery_worker",
    );
    expect(autonomousDeliveryMigration).toContain(
      "'/functions/v1/send-emergency-email'",
    );
    expect(autonomousDeliveryMigration).toContain("'x-cron-secret', v_cron_secret");
    expect(autonomousDeliveryMigration).toContain(
      "'emergency-delivery-outbox-every-minute'",
    );
    expect(autonomousDeliveryMigration).not.toContain(
      "'/functions/v1/process-emergency-delivery-outbox'",
    );
  });

  it("uses the canonical emergency-contact owner instead of a missing aggregate Edge Function", () => {
    expect(safetyService).toContain(
      "SafetyEmergencyContactsService.notifyEmergencyContacts",
    );
    expect(safetyService).not.toContain("notify-emergency-contacts");
    expect(safetyService).toContain(
      "SafetyEmergencyContactsService.createEmergencyContact",
    );
    expect(safetyService).toContain(
      "SafetyEmergencyContactsService.updateEmergencyContact",
    );
  });

  it("removes obsolete Mobility emergency-alert producers", () => {
    for (const path of [
      "src/core/mobility/services/mobility.mutations.ts",
      "src/core/mobility/services/MobilityService.ts",
      "src/core/mobility/services/MobilityService.impl.ts",
      "src/core/mobility/services/RideService.impl.ts",
    ]) {
      expect(readProjectFile(path)).not.toContain("from('emergency_alerts')");
      expect(readProjectFile(path)).not.toContain('from("emergency_alerts")');
    }
  });
});
