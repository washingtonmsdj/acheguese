-- Consolidate notification_preferences behind one server-owned patch command.
-- Omitted parameters preserve existing fields; transactional notifications
-- remain mandatory according to the current product contract.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

UPDATE public.notification_preferences
SET transactional_enabled = TRUE
WHERE transactional_enabled IS FALSE;

ALTER TABLE public.notification_preferences
  DROP CONSTRAINT IF EXISTS notification_preferences_transactional_required_check,
  DROP CONSTRAINT IF EXISTS notification_preferences_quiet_hours_pair_check,
  DROP CONSTRAINT IF EXISTS notification_preferences_quiet_hours_days_check;
ALTER TABLE public.notification_preferences
  ADD CONSTRAINT notification_preferences_transactional_required_check
    CHECK (transactional_enabled IS TRUE),
  ADD CONSTRAINT notification_preferences_quiet_hours_pair_check
    CHECK ((quiet_hours_start IS NULL) = (quiet_hours_end IS NULL)),
  ADD CONSTRAINT notification_preferences_quiet_hours_days_check
    CHECK (
      quiet_hours_days IS NULL
      OR (
        cardinality(quiet_hours_days) BETWEEN 1 AND 7
        AND quiet_hours_days <@ ARRAY[1,2,3,4,5,6,7]
      )
    );

-- security-authority: internal-table private.notification_preferences_audit_log
CREATE TABLE IF NOT EXISTS private.notification_preferences_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  actor_user_id UUID,
  changed_fields JSONB NOT NULL
    CHECK (jsonb_typeof(changed_fields) = 'object' AND pg_column_size(changed_fields) <= 2048),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_audit_user
  ON private.notification_preferences_audit_log(user_id, created_at DESC);
REVOKE ALL ON TABLE private.notification_preferences_audit_log
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE private.notification_preferences_audit_log TO service_role;

-- security-authority: internal-function private.get_current_notification_preferences
CREATE OR REPLACE FUNCTION private.get_current_notification_preferences()
RETURNS public.notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_preferences public.notification_preferences;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.notification_preferences(user_id)
  VALUES (auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_preferences
  FROM public.notification_preferences preference
  WHERE preference.user_id = auth.uid();
  RETURN v_preferences;
END;
$$;
REVOKE ALL ON FUNCTION private.get_current_notification_preferences()
  FROM PUBLIC, anon, authenticated;

-- security-authority: internal-function private.patch_current_notification_preferences
CREATE OR REPLACE FUNCTION private.patch_current_notification_preferences(
  p_email_enabled BOOLEAN DEFAULT NULL,
  p_push_enabled BOOLEAN DEFAULT NULL,
  p_inapp_enabled BOOLEAN DEFAULT NULL,
  p_social_enabled BOOLEAN DEFAULT NULL,
  p_system_enabled BOOLEAN DEFAULT NULL,
  p_marketing_enabled BOOLEAN DEFAULT NULL,
  p_frequency TEXT DEFAULT NULL,
  p_quiet_hours_set BOOLEAN DEFAULT FALSE,
  p_quiet_hours_start TIME DEFAULT NULL,
  p_quiet_hours_end TIME DEFAULT NULL,
  p_quiet_hours_days INTEGER[] DEFAULT NULL
)
RETURNS public.notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_preferences public.notification_preferences;
  v_changed_fields JSONB := '{}'::jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF p_frequency IS NOT NULL
     AND p_frequency NOT IN ('immediate', 'daily', 'weekly', 'never') THEN
    RAISE EXCEPTION 'invalid_notification_frequency' USING ERRCODE = '22023';
  END IF;
  IF p_quiet_hours_set
     AND ((p_quiet_hours_start IS NULL) <> (p_quiet_hours_end IS NULL)) THEN
    RAISE EXCEPTION 'quiet_hours_pair_required' USING ERRCODE = '22023';
  END IF;
  IF p_quiet_hours_days IS NOT NULL AND NOT (
    cardinality(p_quiet_hours_days) BETWEEN 1 AND 7
    AND p_quiet_hours_days <@ ARRAY[1,2,3,4,5,6,7]
  ) THEN
    RAISE EXCEPTION 'invalid_quiet_hours_days' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.notification_preferences(user_id)
  VALUES (auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_preferences
  FROM public.notification_preferences preference
  WHERE preference.user_id = auth.uid()
  FOR UPDATE;

  UPDATE public.notification_preferences preference
  SET email_enabled = COALESCE(p_email_enabled, preference.email_enabled),
      push_enabled = COALESCE(p_push_enabled, preference.push_enabled),
      inapp_enabled = COALESCE(p_inapp_enabled, preference.inapp_enabled),
      transactional_enabled = TRUE,
      social_enabled = COALESCE(p_social_enabled, preference.social_enabled),
      system_enabled = COALESCE(p_system_enabled, preference.system_enabled),
      marketing_enabled = COALESCE(p_marketing_enabled, preference.marketing_enabled),
      frequency = COALESCE(p_frequency, preference.frequency),
      quiet_hours_start = CASE WHEN p_quiet_hours_set
        THEN p_quiet_hours_start ELSE preference.quiet_hours_start END,
      quiet_hours_end = CASE WHEN p_quiet_hours_set
        THEN p_quiet_hours_end ELSE preference.quiet_hours_end END,
      quiet_hours_days = CASE WHEN p_quiet_hours_set
        THEN COALESCE(p_quiet_hours_days, preference.quiet_hours_days)
        ELSE preference.quiet_hours_days END
  WHERE preference.user_id = auth.uid()
  RETURNING * INTO v_preferences;

  v_changed_fields := jsonb_strip_nulls(jsonb_build_object(
    'email_enabled', CASE WHEN p_email_enabled IS NOT NULL THEN TRUE END,
    'push_enabled', CASE WHEN p_push_enabled IS NOT NULL THEN TRUE END,
    'inapp_enabled', CASE WHEN p_inapp_enabled IS NOT NULL THEN TRUE END,
    'social_enabled', CASE WHEN p_social_enabled IS NOT NULL THEN TRUE END,
    'system_enabled', CASE WHEN p_system_enabled IS NOT NULL THEN TRUE END,
    'marketing_enabled', CASE WHEN p_marketing_enabled IS NOT NULL THEN TRUE END,
    'frequency', CASE WHEN p_frequency IS NOT NULL THEN TRUE END,
    'quiet_hours', CASE WHEN p_quiet_hours_set THEN TRUE END
  ));

  IF v_changed_fields <> '{}'::jsonb THEN
    INSERT INTO private.notification_preferences_audit_log (
      user_id, actor_user_id, changed_fields
    ) VALUES (
      auth.uid(), auth.uid(), v_changed_fields
    );
  END IF;
  RETURN v_preferences;
END;
$$;
REVOKE ALL ON FUNCTION private.patch_current_notification_preferences(
  BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN,
  TEXT, BOOLEAN, TIME, TIME, INTEGER[]
) FROM PUBLIC, anon, authenticated;

-- security-authority: public-rpc public.get_current_notification_preferences
CREATE OR REPLACE FUNCTION public.get_current_notification_preferences()
RETURNS public.notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  RETURN private.get_current_notification_preferences();
END;
$$;

-- security-authority: public-rpc public.patch_current_notification_preferences
CREATE OR REPLACE FUNCTION public.patch_current_notification_preferences(
  p_email_enabled BOOLEAN DEFAULT NULL,
  p_push_enabled BOOLEAN DEFAULT NULL,
  p_inapp_enabled BOOLEAN DEFAULT NULL,
  p_social_enabled BOOLEAN DEFAULT NULL,
  p_system_enabled BOOLEAN DEFAULT NULL,
  p_marketing_enabled BOOLEAN DEFAULT NULL,
  p_frequency TEXT DEFAULT NULL,
  p_quiet_hours_set BOOLEAN DEFAULT FALSE,
  p_quiet_hours_start TIME DEFAULT NULL,
  p_quiet_hours_end TIME DEFAULT NULL,
  p_quiet_hours_days INTEGER[] DEFAULT NULL
)
RETURNS public.notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  RETURN private.patch_current_notification_preferences(
    p_email_enabled,
    p_push_enabled,
    p_inapp_enabled,
    p_social_enabled,
    p_system_enabled,
    p_marketing_enabled,
    p_frequency,
    p_quiet_hours_set,
    p_quiet_hours_start,
    p_quiet_hours_end,
    p_quiet_hours_days
  );
END;
$$;

DROP POLICY IF EXISTS notification_preferences_insert_own
  ON public.notification_preferences;
DROP POLICY IF EXISTS notification_preferences_update_own
  ON public.notification_preferences;

REVOKE INSERT, UPDATE, DELETE ON public.notification_preferences
  FROM authenticated;
GRANT SELECT ON public.notification_preferences TO authenticated;

REVOKE ALL ON FUNCTION public.get_current_notification_preferences()
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.patch_current_notification_preferences(
  BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN,
  TEXT, BOOLEAN, TIME, TIME, INTEGER[]
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_notification_preferences()
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.patch_current_notification_preferences(
  BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN,
  TEXT, BOOLEAN, TIME, TIME, INTEGER[]
) TO authenticated;

COMMENT ON TABLE public.notification_preferences IS
  'SSOT de preferencias por User; browser escreve somente por patch server-owned preservativo.';
COMMENT ON FUNCTION public.patch_current_notification_preferences(
  BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN,
  TEXT, BOOLEAN, TIME, TIME, INTEGER[]
) IS
  'Patch atomico de canais, topicos, frequencia e horario; parametros omitidos preservam o estado atual.';
