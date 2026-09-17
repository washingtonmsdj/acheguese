-- Reconcile the strict Safety audit-action allowlist with the status-state
-- machine introduced later. The legacy CHECK predated false-alarm and incident
-- status transitions, so those otherwise-authorized RPCs aborted while writing
-- their mandatory audit event.

ALTER TABLE public.safety_audit_log
  DROP CONSTRAINT IF EXISTS safety_audit_log_action_check;

ALTER TABLE public.safety_audit_log
  ADD CONSTRAINT safety_audit_log_action_check CHECK (
    action = ANY (ARRAY[
      'alert_created',
      'alert_acknowledged',
      'alert_resolved',
      'alert_false_alarm',
      'incident_reported',
      'incident_status_updated',
      'evidence_uploaded',
      'share_created',
      'share_revoked'
    ]::text[])
  ) NOT VALID;

ALTER TABLE public.safety_audit_log
  VALIDATE CONSTRAINT safety_audit_log_action_check;
