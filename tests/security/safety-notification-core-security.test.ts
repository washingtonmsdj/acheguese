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
  "supabase/migrations/20260826004000_restrict_emergency_contacts_to_direct_owner.sql",
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
    expect(contactPrivacyMigration).not.toContain(
      "private.auth_can_access_profile(profile_id)",
    );
    expect(contactPrivacyMigration).not.toContain("profile_members");
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

  it("accepts only IDs from the browser before loading canonical email data", () => {
    expect(emailProvider).toContain("contactId: contact.id");
    expect(emailProvider).toContain("alertId: alert.id");
    expect(emailProvider).not.toContain("alertDescription");
    expect(emailProvider).not.toContain("alertLocation");
    expect(emergencyEmailFunction).toMatch(
      /interface EmailRequest\s*{\s*contactId: string;\s*alertId: string;\s*}/,
    );
    expect(emergencyEmailFunction).toContain(
      ".select('id, profile_id, alert_type, description, latitude, longitude, created_at')",
    );
    expect(emergencyEmailFunction).toContain(
      "contact.profile_id !== alert.profile_id",
    );
    expect(emergencyEmailFunction).toContain(
      ".select('id, profile_id, name, email, phone, is_active')",
    );
    expect(emergencyEmailFunction).toContain(
      "extractEmail(contact.email || '')",
    );
    expect(emergencyEmailFunction).toContain(
      "action: 'emergency_email_provider_failed'",
    );
    expect(emergencyEmailFunction).not.toContain("body: resendRaw");
    expect(contactEmailMigration).toContain("ADD COLUMN IF NOT EXISTS email TEXT");
    expect(contactEmailMigration).toContain("emergency_contacts_email_required");
    expect(contactEmailMigration).toContain("ALTER COLUMN phone DROP NOT NULL");
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
