-- G6 safe factual correction application.
-- Only fields with a deterministic canonical mapping can be auto-applied.
-- Complex structured fields remain in manual review.

CREATE OR REPLACE FUNCTION private.apply_business_profile_correction(p_correction_id uuid)
 RETURNS business_profile_corrections
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_correction public.business_profile_corrections;
  v_profile_id uuid;
  v_value text;
  v_items text[];
  v_item text;
  v_enrollment boolean;
BEGIN
  IF NOT COALESCE(private.is_admin_user(auth.uid()), false) THEN
    RAISE EXCEPTION 'business_profile_correction_apply_not_authorized'
      USING ERRCODE = '42501';
  END IF;

  SELECT c.*
  INTO v_correction
  FROM public.business_profile_corrections c
  WHERE c.id = p_correction_id
    AND c.status IN ('pending', 'under_review')
  FOR UPDATE;

  IF v_correction.id IS NULL THEN
    RAISE EXCEPTION 'business_profile_correction_not_found_or_terminal'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT bd.profile_id
  INTO v_profile_id
  FROM public.business_data bd
  WHERE bd.id = v_correction.business_id;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'business_profile_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  v_value := trim(v_correction.proposed_value);

  CASE v_correction.field_code
    WHEN 'name' THEN
      IF char_length(v_value) NOT BETWEEN 2 AND 160 THEN
        RAISE EXCEPTION 'invalid_business_name_correction'
          USING ERRCODE = '22023';
      END IF;
      UPDATE public.business_data
      SET business_name = v_value, updated_at = now()
      WHERE id = v_correction.business_id;

    WHEN 'website' THEN
      IF v_value !~* '^https?://' OR char_length(v_value) > 500 THEN
        RAISE EXCEPTION 'invalid_business_website_correction'
          USING ERRCODE = '22023';
      END IF;
      UPDATE public.business_data
      SET website = v_value, updated_at = now()
      WHERE id = v_correction.business_id;

    WHEN 'category' THEN
      IF char_length(v_value) NOT BETWEEN 2 AND 80 THEN
        RAISE EXCEPTION 'invalid_business_category_correction'
          USING ERRCODE = '22023';
      END IF;
      UPDATE public.business_data
      SET category = lower(v_value), updated_at = now()
      WHERE id = v_correction.business_id;

    WHEN 'school_type' THEN
      IF lower(v_value) NOT IN ('public','private','charter','community') THEN
        RAISE EXCEPTION 'invalid_school_type_correction'
          USING ERRCODE = '22023';
      END IF;
      UPDATE public.education_profiles
      SET school_type = lower(v_value), updated_at = now()
      WHERE business_id = v_profile_id;

    WHEN 'school_network' THEN
      IF lower(v_value) NOT IN ('municipal','state','federal','private') THEN
        RAISE EXCEPTION 'invalid_school_network_correction'
          USING ERRCODE = '22023';
      END IF;
      UPDATE public.education_profiles
      SET school_network = lower(v_value), updated_at = now()
      WHERE business_id = v_profile_id;

    WHEN 'inep_code' THEN
      IF v_value !~ '^[0-9]{8}$' THEN
        RAISE EXCEPTION 'invalid_inep_code_correction'
          USING ERRCODE = '22023';
      END IF;
      UPDATE public.education_profiles
      SET school_inep_code = v_value, updated_at = now()
      WHERE business_id = v_profile_id;

    WHEN 'education_levels' THEN
      v_items := regexp_split_to_array(lower(v_value), '\s*,\s*');
      IF cardinality(v_items) = 0 THEN
        RAISE EXCEPTION 'invalid_education_levels_correction'
          USING ERRCODE = '22023';
      END IF;
      FOREACH v_item IN ARRAY v_items LOOP
        IF v_item NOT IN (
          'early_childhood','elementary_1','elementary_2',
          'youth_adult_education','high_school','technical'
        ) THEN
          RAISE EXCEPTION 'invalid_education_levels_correction'
            USING ERRCODE = '22023';
        END IF;
      END LOOP;
      UPDATE public.education_profiles
      SET education_levels = ARRAY(SELECT DISTINCT unnest(v_items)),
          updated_at = now()
      WHERE business_id = v_profile_id;

    WHEN 'shifts' THEN
      v_items := regexp_split_to_array(lower(v_value), '\s*,\s*');
      IF cardinality(v_items) = 0 THEN
        RAISE EXCEPTION 'invalid_school_shifts_correction'
          USING ERRCODE = '22023';
      END IF;
      FOREACH v_item IN ARRAY v_items LOOP
        IF v_item NOT IN ('morning','afternoon','evening','full_day') THEN
          RAISE EXCEPTION 'invalid_school_shifts_correction'
            USING ERRCODE = '22023';
        END IF;
      END LOOP;
      UPDATE public.education_profiles
      SET shifts = ARRAY(SELECT DISTINCT unnest(v_items)),
          updated_at = now()
      WHERE business_id = v_profile_id;

    WHEN 'enrollment_status' THEN
      CASE lower(v_value)
        WHEN 'open' THEN v_enrollment := true;
        WHEN 'aberta' THEN v_enrollment := true;
        WHEN 'aberto' THEN v_enrollment := true;
        WHEN 'true' THEN v_enrollment := true;
        WHEN 'closed' THEN v_enrollment := false;
        WHEN 'fechada' THEN v_enrollment := false;
        WHEN 'fechado' THEN v_enrollment := false;
        WHEN 'false' THEN v_enrollment := false;
        WHEN 'unknown' THEN v_enrollment := null;
        WHEN 'desconhecido' THEN v_enrollment := null;
        WHEN 'nao informado' THEN v_enrollment := null;
        ELSE
          RAISE EXCEPTION 'invalid_enrollment_status_correction'
            USING ERRCODE = '22023';
      END CASE;
      UPDATE public.education_profiles
      SET enrollment_open = v_enrollment, updated_at = now()
      WHERE business_id = v_profile_id;

    ELSE
      RAISE EXCEPTION 'business_profile_correction_requires_manual_application'
        USING ERRCODE = '0A000';
  END CASE;

  UPDATE public.business_profile_corrections
  SET status = 'applied',
      reviewed_by_profile_id = private.current_active_profile_id(),
      reviewed_at = now(),
      admin_notes = COALESCE(admin_notes, 'Aplicada automaticamente ao SSOT.'),
      updated_at = now()
  WHERE id = v_correction.id
  RETURNING * INTO v_correction;

  RETURN v_correction;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.apply_business_profile_correction(p_correction_id uuid)
 RETURNS business_profile_corrections
 LANGUAGE sql
 SET search_path TO 'private', 'pg_temp'
AS $function$
  SELECT private.apply_business_profile_correction(p_correction_id);
$function$
;

REVOKE ALL ON FUNCTION private.apply_business_profile_correction(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.apply_business_profile_correction(uuid)
TO authenticated;

REVOKE ALL ON FUNCTION public.apply_business_profile_correction(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_business_profile_correction(uuid)
TO authenticated, service_role;

COMMENT ON FUNCTION public.apply_business_profile_correction(uuid) IS
  'Admin-only automatic application for correction fields with safe canonical mappings; complex fields require manual review.';
