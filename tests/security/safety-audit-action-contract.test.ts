import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const contractMigration = readFileSync(
  join(
    root,
    'supabase/migrations/20260917032803_fix_safety_audit_action_contract.sql',
  ),
  'utf8',
);
const stateMachineMigration = readFileSync(
  join(
    root,
    'supabase/migrations/20260916095115_reconcile_g71_safety_status_state_machine.sql',
  ),
  'utf8',
);
const safetyTypes = readFileSync(
  join(root, 'src/core/safety/types/index.ts'),
  'utf8',
);

describe('Safety audit action contract', () => {
  it('keeps the strict audit allowlist aligned with status transitions', () => {
    expect(contractMigration).toContain(
      'DROP CONSTRAINT IF EXISTS safety_audit_log_action_check',
    );
    for (const action of [
      'alert_created',
      'alert_acknowledged',
      'alert_resolved',
      'alert_false_alarm',
      'incident_reported',
      'incident_status_updated',
      'evidence_uploaded',
      'share_created',
      'share_revoked',
    ]) {
      expect(contractMigration).toContain(`'${action}'`);
    }
    expect(contractMigration).toContain(
      'VALIDATE CONSTRAINT safety_audit_log_action_check',
    );
  });

  it('keeps producers and TypeScript audit actions in the same contract', () => {
    expect(stateMachineMigration).toContain("'alert_false_alarm'");
    expect(stateMachineMigration).toContain("'incident_status_updated'");
    expect(safetyTypes).toContain("| 'alert_false_alarm'");
    expect(safetyTypes).toContain("| 'incident_status_updated'");
  });
});
