import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

const migration = readProjectFile(
  "supabase/migrations/20260911132000_harden_safety_status_state_machine_g71.sql",
);

describe("G71 safety lifecycle forensic authority", () => {
  it("derives the actor from the authenticated active profile", () => {
    expect(migration).toContain(
      "v_actor_profile_id uuid := private.current_active_profile_id()",
    );
    expect(migration).toContain(
      "p_actor_profile_id IS DISTINCT FROM v_actor_profile_id",
    );
    expect(migration).toContain("active_profile_required");
  });

  it("locks alerts and incidents before lifecycle decisions", () => {
    expect(migration.match(/FOR UPDATE;/g)?.length).toBe(2);
  });

  it("keeps emergency terminal states immutable", () => {
    expect(migration).toContain("v_alert.status IN ('resolved', 'false_alarm')");
    expect(migration).toContain("terminal_safety_alert_cannot_reopen");
    expect(migration).toContain(
      "v_alert.status = 'active' AND p_status IN ('acknowledged', 'resolved', 'false_alarm')",
    );
    expect(migration).toContain(
      "v_alert.status = 'acknowledged' AND p_status IN ('resolved', 'false_alarm')",
    );
  });

  it("keeps incident terminal states immutable", () => {
    expect(migration).toContain("v_incident.status IN ('resolved', 'dismissed')");
    expect(migration).toContain("terminal_safety_incident_cannot_reopen");
    expect(migration).toContain(
      "v_incident.status = 'reported' AND p_status IN ('investigating', 'resolved', 'dismissed')",
    );
    expect(migration).toContain(
      "v_incident.status = 'investigating' AND p_status IN ('resolved', 'dismissed')",
    );
  });

  it("does not let non-admin users acknowledge or resolve emergency alerts", () => {
    expect(migration).toContain(
      "IF NOT v_is_admin AND p_status <> 'false_alarm' THEN",
    );
    expect(migration).toContain("forbidden_safety_alert_transition");
  });

  it("keeps incident status changes admin-only", () => {
    expect(migration).toContain(
      "private.is_admin_from_roles(v_actor_user_id)",
    );
    expect(migration).toContain("forbidden_safety_incident_transition");
  });

  it("uses server timestamps and active-profile forensic attribution", () => {
    expect(migration).toContain("pg_catalog.clock_timestamp()");
    expect(migration).toContain("performed_by,\n    metadata");
    expect(migration).toContain("v_actor_profile_id,");
    expect(migration).toContain("'alert_false_alarm'");
  });
});
