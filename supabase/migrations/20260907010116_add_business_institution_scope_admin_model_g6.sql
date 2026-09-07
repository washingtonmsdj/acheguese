-- G6 Business/Education: admin-only read model for institutional management.
-- Returns candidate authority Profiles, public schools and scope history without
-- exposing the private scope table to browser roles.

CREATE OR REPLACE FUNCTION public.admin_get_business_institution_scope_model(
  p_actor_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF p_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin(p_actor_user_id), false) THEN
    RAISE EXCEPTION 'institution_scope_admin_required' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'authorities',
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'profile_id', p.id,
          'name', COALESCE(NULLIF(btrim(p.name), ''), NULLIF(btrim(bd.business_name), ''), p.id::text)
        )
        ORDER BY lower(COALESCE(NULLIF(btrim(p.name), ''), NULLIF(btrim(bd.business_name), ''), p.id::text)), p.id
      )
      FROM public.profiles p
      JOIN public.business_data bd
        ON bd.profile_id = p.id
      LEFT JOIN public.education_profiles ep
        ON ep.business_id = p.id
       AND ep.institution_type = 'school'
      WHERE p.profile_type = 'business'
        AND p.is_active = true
        AND COALESCE(p.is_suspended, false) = false
        AND COALESCE(p.suspended, false) = false
        AND ep.id IS NULL
    ), '[]'::jsonb),
    'schools',
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'profile_id', p.id,
          'name', COALESCE(NULLIF(btrim(p.name), ''), p.id::text),
          'school_network', ep.school_network,
          'inep_code', ep.school_inep_code
        )
        ORDER BY lower(COALESCE(NULLIF(btrim(p.name), ''), p.id::text)), p.id
      )
      FROM public.education_profiles ep
      JOIN public.profiles p
        ON p.id = ep.business_id
      WHERE ep.institution_type = 'school'
        AND ep.school_type = 'public'
        AND p.profile_type = 'business'
        AND p.is_active = true
        AND COALESCE(p.is_suspended, false) = false
        AND COALESCE(p.suspended, false) = false
    ), '[]'::jsonb),
    'scopes',
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'scope_id', scope.id,
          'authority_profile_id', scope.authority_profile_id,
          'authority_name', COALESCE(NULLIF(btrim(authority.name), ''), scope.authority_profile_id::text),
          'target_profile_id', scope.target_profile_id,
          'target_name', COALESCE(NULLIF(btrim(target.name), ''), scope.target_profile_id::text),
          'authority_kind', scope.authority_kind,
          'school_network', ep.school_network,
          'inep_code', ep.school_inep_code,
          'evidence_url', scope.evidence_url,
          'grant_reason', scope.grant_reason,
          'granted_at', scope.granted_at,
          'revoked_at', scope.revoked_at,
          'revocation_reason', scope.revocation_reason,
          'is_active', scope.revoked_at IS NULL
        )
        ORDER BY (scope.revoked_at IS NULL) DESC, scope.granted_at DESC, scope.id
      )
      FROM private.profile_institution_management_scopes scope
      JOIN public.profiles authority
        ON authority.id = scope.authority_profile_id
      JOIN public.profiles target
        ON target.id = scope.target_profile_id
      LEFT JOIN public.education_profiles ep
        ON ep.business_id = scope.target_profile_id
    ), '[]'::jsonb)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_get_business_institution_scope_model(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_business_institution_scope_model(uuid)
  TO service_role;

COMMENT ON FUNCTION public.admin_get_business_institution_scope_model(uuid) IS
  'security-authority: service-role-only admin read model for institution management authorities, public schools and scope history.';

NOTIFY pgrst, 'reload schema';
