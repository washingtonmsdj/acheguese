import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Safety lifecycle authority", () => {
  it("keeps alert and incident creation server-owned", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909195501_server_own_safety_creation_lifecycle_g23.sql",
    );
    const service = readProjectFile(
      "src/core/safety/services/SafetyService.ts",
    );

    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.create_safety_emergency_alert",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.create_safety_incident",
    );
    expect(migration).toContain(
      "v_actor_profile_id uuid := private.current_active_profile_id()",
    );
    expect(migration).toContain("p_profile_id IS DISTINCT FROM v_actor_profile_id");
    expect(migration).toContain("p_reported_by IS DISTINCT FROM v_actor_profile_id");
    expect(migration).toContain("'active'");
    expect(migration).toContain("'reported'");
    expect(migration).toContain("resolved_at");
    expect(migration).toContain(
      "REVOKE INSERT ON TABLE public.emergency_alerts FROM authenticated",
    );
    expect(migration).toContain(
      "REVOKE INSERT ON TABLE public.safety_incidents FROM authenticated",
    );
    expect(migration).toContain(
      "DROP POLICY IF EXISTS emergency_alerts_insert_own",
    );
    expect(migration).toContain(
      "DROP POLICY IF EXISTS safety_incidents_insert_own",
    );

    expect(service).toContain("'create_safety_emergency_alert'");
    expect(service).toContain("'create_safety_incident'");
    expect(service).not.toContain(".insert(");
  });

  it("keeps status transitions actor-bound and privileged", () => {
    const authority = readProjectFile(
      "supabase/migrations/20260714116000_normalize_safety_notification_producers.sql",
    );

    expect(authority).toContain(
      "CREATE OR REPLACE FUNCTION public.update_safety_emergency_alert_status",
    );
    expect(authority).toContain(
      "CREATE OR REPLACE FUNCTION public.update_safety_incident_status",
    );
    expect(authority).toContain("actor.user_id = auth.uid()");
    expect(authority).toContain("v_is_admin := COALESCE(private.is_admin_from_roles(auth.uid()), false)");
    expect(authority).toContain("v_is_owner AND p_status = 'false_alarm'");
    expect(authority).toContain(
      "IF NOT COALESCE(private.is_admin_from_roles(auth.uid()), false)",
    );
  });

  it("preserves database-owned audit and notification producers", () => {
    const authority = readProjectFile(
      "supabase/migrations/20260714116000_normalize_safety_notification_producers.sql",
    );

    expect(authority).toContain("trg_audit_emergency_alert_insert");
    expect(authority).toContain("trg_audit_safety_incident_insert");
    expect(authority).toContain("trg_enqueue_emergency_alert_notification");
    expect(authority).toContain("trg_enqueue_safety_incident_notification");
  });
});
