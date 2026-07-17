BEGIN;

-- Audit identity lives in billing_audit_log.user_id. JSON snapshots must not
-- duplicate that identifier because ON DELETE SET NULL cannot scrub JSON.
UPDATE public.billing_audit_log
SET
  old_data = CASE
    WHEN old_data IS NULL THEN NULL
    ELSE old_data - 'user_id'
  END,
  new_data = CASE
    WHEN new_data IS NULL THEN NULL
    ELSE new_data - 'user_id'
  END
WHERE COALESCE(old_data ? 'user_id', FALSE)
   OR COALESCE(new_data ? 'user_id', FALSE);

CREATE OR REPLACE FUNCTION public.log_billing_action(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.billing_audit_log (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    metadata
  ) VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    CASE WHEN p_old_data IS NULL THEN NULL ELSE p_old_data - 'user_id' END,
    CASE WHEN p_new_data IS NULL THEN NULL ELSE p_new_data - 'user_id' END,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- A hard-deleted subscription no longer has an operational owner. Keeping the
-- entity identifier is sufficient for the append-only billing trail, while a
-- nullable subject prevents a child trigger from blocking auth.users CASCADE.
CREATE OR REPLACE FUNCTION public.audit_user_subscription_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_billing_action(
      NEW.user_id,
      'subscription_created',
      'subscription',
      NEW.id,
      NULL,
      to_jsonb(NEW),
      jsonb_build_object('trigger', 'auto')
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status
       OR OLD.plan_code IS DISTINCT FROM NEW.plan_code
       OR OLD.cancel_at_period_end IS DISTINCT FROM NEW.cancel_at_period_end THEN
      PERFORM public.log_billing_action(
        NEW.user_id,
        'subscription_updated',
        'subscription',
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW),
        jsonb_build_object('trigger', 'auto')
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_billing_action(
      NULL,
      'subscription_deleted',
      'subscription',
      OLD.id,
      to_jsonb(OLD),
      NULL,
      jsonb_build_object(
        'trigger', 'auto',
        'subject_reference_removed', true
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.log_billing_action(
  UUID, TEXT, TEXT, UUID, JSONB, JSONB, JSONB
) IS
  'Append-only billing audit writer. Subject identity is stored only in the relational user_id column, never duplicated in snapshots.';

COMMENT ON FUNCTION public.audit_user_subscription_changes() IS
  'Audits subscription changes without preventing auth user deletion or retaining duplicated subject identifiers in JSON.';

REVOKE ALL ON FUNCTION public.log_billing_action(
  UUID, TEXT, TEXT, UUID, JSONB, JSONB, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_billing_action(
  UUID, TEXT, TEXT, UUID, JSONB, JSONB, JSONB
) TO service_role;

REVOKE ALL ON FUNCTION public.audit_user_subscription_changes()
  FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
