-- G28: make driver moderation history append-only for browser roles.
--
-- The canonical table is an audit/event trail. Admin clients may append through
-- one command, but cannot UPDATE/DELETE historical facts or choose the actor
-- profile / created_at.

CREATE OR REPLACE FUNCTION public.append_driver_moderation_event(
  p_driver_profile_id uuid,
  p_action text,
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.driver_moderation_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_admin_profile_id uuid;
  v_event public.driver_moderation_events%ROWTYPE;
  v_action text := pg_catalog.lower(pg_catalog.btrim(COALESCE(p_action, '')));
  v_reason text := NULLIF(pg_catalog.btrim(COALESCE(p_reason, '')), '');
  v_metadata jsonb := COALESCE(p_metadata, '{}'::jsonb);
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(private.is_admin_from_roles(auth.uid()), false)
  THEN
    RAISE EXCEPTION 'driver_moderation_admin_required'
      USING ERRCODE = '42501';
  END IF;

  SELECT profile.id
  INTO v_admin_profile_id
  FROM public.profiles profile
  LEFT JOIN public.user_active_profiles selection
    ON selection.user_id = auth.uid()
   AND selection.profile_id = profile.id
  WHERE profile.user_id = auth.uid()
    AND profile.is_active = true
  ORDER BY
    CASE WHEN selection.profile_id IS NOT NULL THEN 0 ELSE 1 END,
    CASE WHEN profile.profile_type::text = 'personal' THEN 0 ELSE 1 END,
    profile.created_at,
    profile.id
  LIMIT 1;

  IF v_admin_profile_id IS NULL THEN
    RAISE EXCEPTION 'driver_moderation_admin_profile_required'
      USING ERRCODE = '42501';
  END IF;

  IF p_driver_profile_id IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM public.driver_data driver
       JOIN public.profiles profile
         ON profile.id = driver.profile_id
       WHERE driver.profile_id = p_driver_profile_id
         AND profile.is_active = true
     )
  THEN
    RAISE EXCEPTION 'driver_profile_required'
      USING ERRCODE = '22023';
  END IF;

  IF v_action NOT IN (
    'approved','rejected','suspended',
    'reactivated','set_online','set_offline'
  ) THEN
    RAISE EXCEPTION 'invalid_driver_moderation_action'
      USING ERRCODE = '22023';
  END IF;

  IF v_action IN ('rejected','suspended') AND v_reason IS NULL THEN
    RAISE EXCEPTION 'driver_moderation_reason_required'
      USING ERRCODE = '22023';
  END IF;

  IF v_reason IS NOT NULL AND pg_catalog.char_length(v_reason) > 1000 THEN
    RAISE EXCEPTION 'driver_moderation_reason_too_long'
      USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.jsonb_typeof(v_metadata) <> 'object'
     OR pg_catalog.pg_column_size(v_metadata) > 16384
  THEN
    RAISE EXCEPTION 'invalid_driver_moderation_metadata'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.driver_moderation_events (
    driver_profile_id,
    admin_profile_id,
    action,
    reason,
    metadata,
    created_at
  )
  VALUES (
    p_driver_profile_id,
    v_admin_profile_id,
    v_action,
    v_reason,
    v_metadata,
    pg_catalog.clock_timestamp()
  )
  RETURNING * INTO v_event;

  RETURN v_event;
END;
$function$;

REVOKE ALL ON FUNCTION public.append_driver_moderation_event(
  uuid, text, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.append_driver_moderation_event(
  uuid, text, text, jsonb
) TO authenticated, service_role;

REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.driver_moderation_events
  FROM authenticated;

DROP POLICY IF EXISTS "Admins can manage driver moderation events"
  ON public.driver_moderation_events;

DROP POLICY IF EXISTS "Admins can view driver moderation events"
  ON public.driver_moderation_events;
CREATE POLICY "Admins can view driver moderation events"
  ON public.driver_moderation_events
  FOR SELECT
  TO authenticated
  USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));

COMMENT ON FUNCTION public.append_driver_moderation_event(
  uuid, text, text, jsonb
) IS
  'Admin-only append command for immutable driver moderation history. Actor profile and timestamp are derived server-side; browser roles cannot update/delete historical events.';
