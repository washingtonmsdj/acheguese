-- G6 Business/Education: explicit institutional management inheritance for
-- maintainer/Secretariat/public-agency authority over multiple public schools.
--
-- The authority remains a canonical Profile. Its owner/admin memberships live
-- once in profile_members. This private scope links that authority Profile to
-- target school Profiles without copying memberships into every school.
-- Structural ownership transfer and people/access mutation remain owner-only.

CREATE TABLE private.profile_institution_management_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  authority_kind text NOT NULL,
  evidence_url text NOT NULL,
  grant_reason text NOT NULL,
  granted_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  revocation_reason text,
  CONSTRAINT profile_institution_scope_distinct_profiles
    CHECK (authority_profile_id <> target_profile_id),
  CONSTRAINT profile_institution_scope_authority_kind
    CHECK (authority_kind IN (
      'maintainer',
      'municipal_secretariat',
      'state_secretariat',
      'federal_authority',
      'education_network',
      'public_agency'
    )),
  CONSTRAINT profile_institution_scope_evidence_url
    CHECK (
      char_length(evidence_url) BETWEEN 8 AND 2048
      AND evidence_url ~* '^https?://[^[:space:]]+$'
    ),
  CONSTRAINT profile_institution_scope_grant_reason
    CHECK (char_length(btrim(grant_reason)) BETWEEN 10 AND 1000),
  CONSTRAINT profile_institution_scope_revocation_consistency
    CHECK (
      (revoked_at IS NULL AND revocation_reason IS NULL)
      OR (
        revoked_at IS NOT NULL
        AND char_length(btrim(revocation_reason)) BETWEEN 10 AND 1000
      )
    )
);

CREATE UNIQUE INDEX profile_institution_scope_one_active_pair_uidx
  ON private.profile_institution_management_scopes(authority_profile_id, target_profile_id)
  WHERE revoked_at IS NULL;

CREATE INDEX profile_institution_scope_active_target_idx
  ON private.profile_institution_management_scopes(target_profile_id, authority_profile_id)
  WHERE revoked_at IS NULL;

CREATE INDEX profile_institution_scope_authority_history_idx
  ON private.profile_institution_management_scopes(authority_profile_id, granted_at DESC);

REVOKE ALL ON TABLE private.profile_institution_management_scopes
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.user_can_manage_profile_direct(
  p_user_id uuid,
  p_profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT p_user_id IS NOT NULL
    AND p_profile_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = p_profile_id
          AND p.user_id = p_user_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.profile_members pm
        WHERE pm.profile_id = p_profile_id
          AND pm.user_id = p_user_id
          AND pm.is_active = true
          AND pm.role IN ('owner', 'admin')
      )
    );
$function$;

REVOKE ALL ON FUNCTION private.user_can_manage_profile_direct(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.user_can_manage_profile_direct(uuid, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION private.user_can_manage_profile(
  p_user_id uuid,
  p_profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT p_user_id IS NOT NULL
    AND p_profile_id IS NOT NULL
    AND (
      private.user_can_manage_profile_direct(p_user_id, p_profile_id)
      OR EXISTS (
        SELECT 1
        FROM private.profile_institution_management_scopes scope
        JOIN public.profiles authority_profile
          ON authority_profile.id = scope.authority_profile_id
        WHERE scope.target_profile_id = p_profile_id
          AND scope.revoked_at IS NULL
          AND authority_profile.profile_type = 'business'
          AND authority_profile.is_active = true
          AND COALESCE(authority_profile.is_suspended, false) = false
          AND COALESCE(authority_profile.suspended, false) = false
          AND private.user_can_manage_profile_direct(
            p_user_id,
            scope.authority_profile_id
          )
      )
    );
$function$;

REVOKE ALL ON FUNCTION private.user_can_manage_profile(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.user_can_manage_profile(uuid, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION private.can_manage_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT private.user_can_manage_profile(auth.uid(), p_profile_id);
$function$;

REVOKE ALL ON FUNCTION private.can_manage_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_manage_profile(uuid)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_manage_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT private.user_can_manage_profile(auth.uid(), p_profile_id);
$function$;

REVOKE ALL ON FUNCTION public.can_manage_profile(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_profile(uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.broker_user_can_manage_profile(
  p_user_id uuid,
  p_profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT private.user_can_manage_profile(p_user_id, p_profile_id);
$function$;

REVOKE ALL ON FUNCTION public.broker_user_can_manage_profile(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.broker_user_can_manage_profile(uuid, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.admin_grant_business_institution_scope(
  p_actor_user_id uuid,
  p_authority_profile_id uuid,
  p_target_profile_id uuid,
  p_authority_kind text,
  p_evidence_url text,
  p_grant_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_scope_id uuid;
  v_authority_type text;
  v_authority_active boolean;
  v_target_school_type text;
  v_target_school_network text;
BEGIN
  IF p_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin(p_actor_user_id), false) THEN
    RAISE EXCEPTION 'institution_scope_admin_required' USING ERRCODE = '42501';
  END IF;

  IF p_authority_profile_id IS NULL
     OR p_target_profile_id IS NULL
     OR p_authority_profile_id = p_target_profile_id THEN
    RAISE EXCEPTION 'institution_scope_invalid_profiles' USING ERRCODE = '22023';
  END IF;

  IF p_authority_kind NOT IN (
    'maintainer',
    'municipal_secretariat',
    'state_secretariat',
    'federal_authority',
    'education_network',
    'public_agency'
  ) THEN
    RAISE EXCEPTION 'institution_scope_invalid_authority_kind' USING ERRCODE = '22023';
  END IF;

  IF p_evidence_url IS NULL
     OR char_length(p_evidence_url) > 2048
     OR p_evidence_url !~* '^https?://[^[:space:]]+$' THEN
    RAISE EXCEPTION 'institution_scope_official_evidence_required' USING ERRCODE = '22023';
  END IF;

  IF p_grant_reason IS NULL
     OR char_length(btrim(p_grant_reason)) NOT BETWEEN 10 AND 1000 THEN
    RAISE EXCEPTION 'institution_scope_grant_reason_required' USING ERRCODE = '22023';
  END IF;

  SELECT p.profile_type, p.is_active
  INTO v_authority_type, v_authority_active
  FROM public.profiles p
  WHERE p.id = p_authority_profile_id;

  IF v_authority_type IS DISTINCT FROM 'business'
     OR v_authority_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'institution_scope_authority_business_profile_required'
      USING ERRCODE = '23514';
  END IF;

  SELECT ep.school_type, ep.school_network
  INTO v_target_school_type, v_target_school_network
  FROM public.education_profiles ep
  WHERE ep.business_id = p_target_profile_id
    AND ep.institution_type = 'school';

  IF v_target_school_type IS DISTINCT FROM 'public' THEN
    RAISE EXCEPTION 'institution_scope_public_school_required'
      USING ERRCODE = '23514';
  END IF;

  IF p_authority_kind = 'municipal_secretariat'
     AND v_target_school_network IS DISTINCT FROM 'municipal' THEN
    RAISE EXCEPTION 'institution_scope_network_mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF p_authority_kind = 'state_secretariat'
     AND v_target_school_network IS DISTINCT FROM 'state' THEN
    RAISE EXCEPTION 'institution_scope_network_mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF p_authority_kind = 'federal_authority'
     AND v_target_school_network IS DISTINCT FROM 'federal' THEN
    RAISE EXCEPTION 'institution_scope_network_mismatch'
      USING ERRCODE = '23514';
  END IF;

  SELECT scope.id
  INTO v_scope_id
  FROM private.profile_institution_management_scopes scope
  WHERE scope.authority_profile_id = p_authority_profile_id
    AND scope.target_profile_id = p_target_profile_id
    AND scope.revoked_at IS NULL
  FOR UPDATE;

  IF v_scope_id IS NOT NULL THEN
    RETURN v_scope_id;
  END IF;

  INSERT INTO private.profile_institution_management_scopes (
    authority_profile_id,
    target_profile_id,
    authority_kind,
    evidence_url,
    grant_reason,
    granted_by_user_id
  )
  VALUES (
    p_authority_profile_id,
    p_target_profile_id,
    p_authority_kind,
    p_evidence_url,
    btrim(p_grant_reason),
    p_actor_user_id
  )
  RETURNING id INTO v_scope_id;

  RETURN v_scope_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_grant_business_institution_scope(
  uuid, uuid, uuid, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_business_institution_scope(
  uuid, uuid, uuid, text, text, text
) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_revoke_business_institution_scope(
  p_actor_user_id uuid,
  p_scope_id uuid,
  p_revocation_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF p_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin(p_actor_user_id), false) THEN
    RAISE EXCEPTION 'institution_scope_admin_required' USING ERRCODE = '42501';
  END IF;

  IF p_revocation_reason IS NULL
     OR char_length(btrim(p_revocation_reason)) NOT BETWEEN 10 AND 1000 THEN
    RAISE EXCEPTION 'institution_scope_revocation_reason_required'
      USING ERRCODE = '22023';
  END IF;

  UPDATE private.profile_institution_management_scopes scope
  SET revoked_at = now(),
      revoked_by_user_id = p_actor_user_id,
      revocation_reason = btrim(p_revocation_reason)
  WHERE scope.id = p_scope_id
    AND scope.revoked_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'institution_scope_not_active' USING ERRCODE = 'P0002';
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_revoke_business_institution_scope(
  uuid, uuid, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_business_institution_scope(
  uuid, uuid, text
) TO service_role;

COMMENT ON TABLE private.profile_institution_management_scopes IS
  'Explicit, auditable and revocable institutional management inheritance. Membership remains on the authority Profile; target Profiles do not receive repeated profile_members rows.';

COMMENT ON FUNCTION private.user_can_manage_profile(uuid, uuid) IS
  'Canonical Profile management authority: direct structural/delegated management plus one-level active institutional scope inheritance.';

COMMENT ON FUNCTION public.admin_grant_business_institution_scope(
  uuid, uuid, uuid, text, text, text
) IS
  'security-authority: service-role-only admin-reviewed grant of institutional management over a public Education school Profile.';

COMMENT ON FUNCTION public.admin_revoke_business_institution_scope(
  uuid, uuid, text
) IS
  'security-authority: service-role-only immediate revocation of an institutional management scope.';

NOTIFY pgrst, 'reload schema';
