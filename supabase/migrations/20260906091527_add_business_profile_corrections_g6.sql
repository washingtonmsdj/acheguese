-- G6 factual correction workflow for public Business profiles.
-- Reporting and factual corrections are intentionally separate aggregates.

CREATE TABLE public.business_profile_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL
    REFERENCES public.business_data(id) ON DELETE CASCADE,
  reporter_profile_id uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  field_code text NOT NULL CHECK (
    field_code IN (
      'name','address','map_location','phone','whatsapp','website',
      'opening_hours','category','school_type','school_network','inep_code',
      'education_levels','shifts','enrollment_status','infrastructure',
      'operating_status','other'
    )
  ),
  proposed_value text NOT NULL CHECK (
    char_length(trim(proposed_value)) BETWEEN 1 AND 1200
  ),
  source_url text CHECK (
    source_url IS NULL
    OR (char_length(source_url) <= 1200 AND source_url ~* '^https?://')
  ),
  explanation text CHECK (
    explanation IS NULL
    OR char_length(trim(explanation)) BETWEEN 3 AND 1000
  ),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','under_review','applied','rejected')
  ),
  reviewed_by_profile_id uuid
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  admin_notes text CHECK (
    admin_notes IS NULL
    OR char_length(trim(admin_notes)) BETWEEN 3 AND 2000
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX business_profile_corrections_open_dedupe_uidx
  ON public.business_profile_corrections(
    reporter_profile_id,business_id,field_code
  )
  WHERE status IN ('pending','under_review');

CREATE INDEX idx_business_profile_corrections_business
  ON public.business_profile_corrections(business_id,created_at DESC);

CREATE INDEX idx_business_profile_corrections_queue
  ON public.business_profile_corrections(status,created_at DESC,id DESC);

CREATE TRIGGER update_business_profile_corrections_updated_at
BEFORE UPDATE ON public.business_profile_corrections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.business_profile_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_profile_corrections_select_own_or_admin
ON public.business_profile_corrections
FOR SELECT
TO authenticated
USING (
  reporter_profile_id = private.current_active_profile_id()
  OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)
);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON public.business_profile_corrections FROM anon, authenticated;
GRANT SELECT ON public.business_profile_corrections TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.create_business_profile_correction(p_business_id uuid, p_field_code text, p_proposed_value text, p_source_url text DEFAULT NULL::text, p_explanation text DEFAULT NULL::text)
 RETURNS business_profile_corrections
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_target_profile_id uuid;
  v_existing public.business_profile_corrections;
  v_correction public.business_profile_corrections;
  v_recent_count integer;
  v_source_url text := NULLIF(trim(COALESCE(p_source_url, '')), '');
  v_explanation text := NULLIF(trim(COALESCE(p_explanation, '')), '');
  v_proposed_value text := trim(COALESCE(p_proposed_value, ''));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF p_field_code NOT IN (
    'name',
    'address',
    'map_location',
    'phone',
    'whatsapp',
    'website',
    'opening_hours',
    'category',
    'school_type',
    'school_network',
    'inep_code',
    'education_levels',
    'shifts',
    'enrollment_status',
    'infrastructure',
    'operating_status',
    'other'
  ) THEN
    RAISE EXCEPTION 'invalid_business_profile_correction_field'
      USING ERRCODE = '22023';
  END IF;

  IF char_length(v_proposed_value) NOT BETWEEN 1 AND 1200 THEN
    RAISE EXCEPTION 'invalid_business_profile_correction_value'
      USING ERRCODE = '22023';
  END IF;

  IF v_source_url IS NOT NULL
     AND (
       char_length(v_source_url) > 1200
       OR v_source_url !~* '^https?://'
     ) THEN
    RAISE EXCEPTION 'invalid_business_profile_correction_source_url'
      USING ERRCODE = '22023';
  END IF;

  IF v_explanation IS NOT NULL
     AND char_length(v_explanation) NOT BETWEEN 3 AND 1000 THEN
    RAISE EXCEPTION 'invalid_business_profile_correction_explanation'
      USING ERRCODE = '22023';
  END IF;

  SELECT bd.profile_id
  INTO v_target_profile_id
  FROM public.business_data bd
  WHERE bd.id = p_business_id
    AND bd.status = 'active';

  IF v_target_profile_id IS NULL THEN
    RAISE EXCEPTION 'business_profile_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF COALESCE(
    private.user_can_manage_profile(auth.uid(), v_target_profile_id),
    false
  ) THEN
    RAISE EXCEPTION 'managed_profile_should_be_edited_directly'
      USING ERRCODE = '23514';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.business_profile_corrections c
  WHERE c.reporter_profile_id = v_actor_profile_id
    AND c.business_id = p_business_id
    AND c.field_code = p_field_code
    AND c.status IN ('pending', 'under_review')
  ORDER BY c.created_at DESC, c.id DESC
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('business_profile_correction_rate'),
    hashtext(v_actor_profile_id::text)
  );

  SELECT count(*)::integer
  INTO v_recent_count
  FROM public.business_profile_corrections c
  WHERE c.reporter_profile_id = v_actor_profile_id
    AND c.created_at >= now() - interval '1 hour';

  IF v_recent_count >= 20 THEN
    RAISE EXCEPTION 'business_profile_correction_rate_limit_exceeded'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.business_profile_corrections (
    business_id,
    reporter_profile_id,
    field_code,
    proposed_value,
    source_url,
    explanation
  )
  VALUES (
    p_business_id,
    v_actor_profile_id,
    p_field_code,
    v_proposed_value,
    v_source_url,
    v_explanation
  )
  RETURNING * INTO v_correction;

  RETURN v_correction;
END;
$function$
;

CREATE OR REPLACE FUNCTION private.resolve_business_profile_correction(p_correction_id uuid, p_status text, p_admin_notes text DEFAULT NULL::text)
 RETURNS business_profile_corrections
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_correction public.business_profile_corrections;
BEGIN
  IF NOT COALESCE(private.is_admin_user(auth.uid()), false) THEN
    RAISE EXCEPTION 'business_profile_correction_review_not_authorized'
      USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('under_review', 'applied', 'rejected') THEN
    RAISE EXCEPTION 'invalid_business_profile_correction_status'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.business_profile_corrections
  SET
    status = p_status,
    reviewed_by_profile_id = private.current_active_profile_id(),
    reviewed_at = now(),
    admin_notes = NULLIF(trim(COALESCE(p_admin_notes, '')), '')
  WHERE id = p_correction_id
    AND status IN ('pending', 'under_review')
  RETURNING * INTO v_correction;

  IF v_correction.id IS NULL THEN
    RAISE EXCEPTION 'business_profile_correction_not_found_or_terminal'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN v_correction;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_business_profile_correction(p_business_id uuid, p_field_code text, p_proposed_value text, p_source_url text DEFAULT NULL::text, p_explanation text DEFAULT NULL::text)
 RETURNS business_profile_corrections
 LANGUAGE sql
 SET search_path TO 'private', 'pg_temp'
AS $function$
  SELECT private.create_business_profile_correction(
    p_business_id,
    p_field_code,
    p_proposed_value,
    p_source_url,
    p_explanation
  );
$function$
;

CREATE OR REPLACE FUNCTION public.list_business_profile_correction_queue(p_status text DEFAULT 'pending'::text, p_limit integer DEFAULT 30)
 RETURNS TABLE(id uuid, business_id uuid, profile_id uuid, business_name text, field_code text, proposed_value text, source_url text, explanation text, status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
 SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 30), 1), 50);
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(private.is_admin_user(auth.uid()), false) THEN
    RAISE EXCEPTION 'business_profile_correction_queue_not_authorized'
      USING ERRCODE = '42501';
  END IF;

  IF p_status IS NOT NULL
     AND p_status NOT IN ('pending', 'under_review', 'applied', 'rejected') THEN
    RAISE EXCEPTION 'invalid_business_profile_correction_status'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.business_id,
    bd.profile_id,
    COALESCE(p.display_name, p.name)::text AS business_name,
    c.field_code,
    c.proposed_value,
    c.source_url,
    c.explanation,
    c.status,
    c.created_at
  FROM public.business_profile_corrections c
  JOIN public.business_data bd ON bd.id = c.business_id
  JOIN public.profiles p ON p.id = bd.profile_id
  WHERE p_status IS NULL OR c.status = p_status
  ORDER BY c.created_at DESC, c.id DESC
  LIMIT v_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_business_profile_correction(p_correction_id uuid, p_status text, p_admin_notes text DEFAULT NULL::text)
 RETURNS business_profile_corrections
 LANGUAGE sql
 SET search_path TO 'private', 'pg_temp'
AS $function$
  SELECT private.resolve_business_profile_correction(
    p_correction_id,
    p_status,
    p_admin_notes
  );
$function$
;

REVOKE ALL ON FUNCTION private.create_business_profile_correction(
  uuid,text,text,text,text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.create_business_profile_correction(
  uuid,text,text,text,text
) TO authenticated;

REVOKE ALL ON FUNCTION private.resolve_business_profile_correction(
  uuid,text,text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.resolve_business_profile_correction(
  uuid,text,text
) TO authenticated;

REVOKE ALL ON FUNCTION public.create_business_profile_correction(
  uuid,text,text,text,text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_business_profile_correction(
  uuid,text,text,text,text
) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.list_business_profile_correction_queue(
  text,integer
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_business_profile_correction_queue(
  text,integer
) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.resolve_business_profile_correction(
  uuid,text,text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_business_profile_correction(
  uuid,text,text
) TO authenticated, service_role;

COMMENT ON TABLE public.business_profile_corrections IS
  'Factual correction proposals for canonical Business profiles. Separate from abuse/safety reporting.';
