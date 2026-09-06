CREATE OR REPLACE FUNCTION private.profile_transfer_ownership_core(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_new_owner_user_id uuid,
  p_keep_previous_owner_as_manager boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
DECLARE
  v_profile_type text;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_new_owner_user_id IS NULL OR p_new_owner_user_id = p_actor_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Choose a different new owner');
  END IF;

  SELECT p.profile_type
  INTO v_profile_type
  FROM public.profiles p
  WHERE p.id = p_profile_id
    AND p.user_id = p_actor_user_id
  FOR UPDATE;

  IF v_profile_type IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only the current profile owner can transfer ownership'
    );
  END IF;

  IF v_profile_type IN ('personal', 'driver') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot transfer ownership of personal or driver profiles'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = p_new_owner_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'New owner user not found');
  END IF;

  UPDATE public.profiles
  SET user_id = p_new_owner_user_id,
      updated_at = now()
  WHERE id = p_profile_id;

  IF p_keep_previous_owner_as_manager THEN
    INSERT INTO public.profile_members (
      profile_id,
      user_id,
      role,
      invited_by,
      is_active
    )
    VALUES (
      p_profile_id,
      p_actor_user_id,
      'admin',
      p_actor_user_id,
      true
    )
    ON CONFLICT (profile_id, user_id) DO UPDATE
    SET role = 'admin',
        is_active = true;
  ELSE
    UPDATE public.profile_members
    SET role = 'admin',
        is_active = false
    WHERE profile_id = p_profile_id
      AND user_id = p_actor_user_id;
  END IF;

  UPDATE public.profile_members
  SET role = 'admin'
  WHERE profile_id = p_profile_id
    AND role = 'owner'
    AND user_id <> p_new_owner_user_id;

  INSERT INTO public.profile_members (
    profile_id,
    user_id,
    role,
    invited_by,
    is_active
  )
  VALUES (
    p_profile_id,
    p_new_owner_user_id,
    'owner',
    p_actor_user_id,
    true
  )
  ON CONFLICT (profile_id, user_id) DO UPDATE
  SET role = 'owner',
      is_active = true,
      invited_by = EXCLUDED.invited_by;

  UPDATE public.business_data
  SET
    metadata = CASE
      WHEN COALESCE(metadata->>'custody_status', '') = 'claimed'
        THEN COALESCE(metadata, '{}'::jsonb)
          || jsonb_build_object(
            'claimed_user_id', p_new_owner_user_id,
            'ownership_transferred_at', now()
          )
      ELSE metadata
    END,
    updated_at = now()
  WHERE profile_id = p_profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'profile_id', p_profile_id,
    'previous_owner_user_id', p_actor_user_id,
    'new_owner_user_id', p_new_owner_user_id,
    'previous_owner_role', 'admin',
    'previous_owner_active', p_keep_previous_owner_as_manager
  );
END;
$function$;

REVOKE ALL ON FUNCTION private.profile_transfer_ownership_core(
  uuid, uuid, uuid, boolean
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_transfer_ownership_core(
  uuid, uuid, uuid, boolean
) TO service_role;

CREATE OR REPLACE FUNCTION private.profile_transfer_ownership(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_new_owner_user_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'private', 'pg_temp'
AS $function$
  SELECT private.profile_transfer_ownership_core(
    p_actor_user_id,
    p_profile_id,
    p_new_owner_user_id,
    true
  );
$function$;

REVOKE ALL ON FUNCTION private.profile_transfer_ownership(uuid, uuid, uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_transfer_ownership(uuid, uuid, uuid)
TO service_role;

DROP POLICY IF EXISTS business_claims_owner_insert
ON public.business_claims;
CREATE POLICY business_claims_owner_insert
ON public.business_claims
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND (claimer_id IS NULL OR claimer_id = (SELECT auth.uid()))
  AND status = 'pendente'
  AND resolved_at IS NULL
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND review_notes IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.business_data bd
    WHERE bd.id = business_claims.business_id
      AND bd.status = 'active'
      AND (
        bd.metadata->>'custody_status' IN (
          'platform_curated_pending_official_claim',
          'directory_unclaimed',
          'source_backed_unclaimed'
        )
        OR bd.metadata->>'public_record_provenance_status' = 'source_backed_unclaimed'
      )
  )
  AND (
    NOT EXISTS (
      SELECT 1
      FROM public.business_data bd_public
      JOIN public.education_profiles ep
        ON ep.business_id = bd_public.profile_id
      WHERE bd_public.id = business_claims.business_id
        AND ep.school_type = 'public'
    )
    OR private.business_claim_has_official_evidence(documents)
  )
);

DROP POLICY IF EXISTS business_claims_owner_update
ON public.business_claims;
CREATE POLICY business_claims_owner_update
ON public.business_claims
FOR UPDATE TO authenticated
USING (
  user_id = (SELECT auth.uid())
  AND status = 'pendente'
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND (claimer_id IS NULL OR claimer_id = (SELECT auth.uid()))
  AND status = 'pendente'
  AND resolved_at IS NULL
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND review_notes IS NULL
  AND (
    NOT EXISTS (
      SELECT 1
      FROM public.business_data bd_public
      JOIN public.education_profiles ep
        ON ep.business_id = bd_public.profile_id
      WHERE bd_public.id = business_claims.business_id
        AND ep.school_type = 'public'
    )
    OR private.business_claim_has_official_evidence(documents)
  )
);

CREATE OR REPLACE FUNCTION public.admin_resolve_business_claim(
  p_actor_user_id uuid,
  p_claim_id uuid,
  p_decision text,
  p_review_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
DECLARE
  v_claim public.business_claims%ROWTYPE;
  v_business public.business_data%ROWTYPE;
  v_profile_id uuid;
  v_current_owner_user_id uuid;
  v_school_type text;
  v_decision text := lower(trim(COALESCE(p_decision, '')));
  v_review_notes text := NULLIF(trim(COALESCE(p_review_notes, '')), '');
  v_target_status text;
  v_transfer_result jsonb;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     OR p_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin_user(p_actor_user_id), false) THEN
    RAISE EXCEPTION 'business_claim_admin_required'
      USING ERRCODE = '42501';
  END IF;

  IF v_decision NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'invalid_business_claim_decision'
      USING ERRCODE = '22023';
  END IF;

  v_target_status := CASE v_decision
    WHEN 'approve' THEN 'aprovada'
    ELSE 'rejeitada'
  END;

  SELECT *
  INTO v_claim
  FROM public.business_claims
  WHERE id = p_claim_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'business_claim_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_claim.status <> 'pendente' THEN
    IF v_claim.status = v_target_status THEN
      RETURN jsonb_build_object(
        'id', v_claim.id,
        'business_id', v_claim.business_id,
        'profile_id', (
          SELECT bd.profile_id
          FROM public.business_data bd
          WHERE bd.id = v_claim.business_id
        ),
        'status', v_claim.status,
        'idempotent', true
      );
    END IF;

    RAISE EXCEPTION 'business_claim_already_resolved'
      USING ERRCODE = '23514';
  END IF;

  SELECT *
  INTO v_business
  FROM public.business_data
  WHERE id = v_claim.business_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'business_claim_business_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  v_profile_id := v_business.profile_id;

  SELECT p.user_id
  INTO v_current_owner_user_id
  FROM public.profiles p
  WHERE p.id = v_profile_id
  FOR UPDATE;

  IF v_current_owner_user_id IS NULL THEN
    RAISE EXCEPTION 'business_claim_profile_owner_missing'
      USING ERRCODE = '23514';
  END IF;

  SELECT ep.school_type
  INTO v_school_type
  FROM public.education_profiles ep
  WHERE ep.business_id = v_profile_id
  ORDER BY ep.updated_at DESC
  LIMIT 1;

  IF v_decision = 'approve' THEN
    IF NOT (
      v_business.metadata->>'custody_status' IN (
        'platform_curated_pending_official_claim',
        'directory_unclaimed',
        'source_backed_unclaimed'
      )
      OR v_business.metadata->>'public_record_provenance_status' = 'source_backed_unclaimed'
    ) THEN
      RAISE EXCEPTION 'business_profile_not_claimable'
        USING ERRCODE = '23514';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.profile_members pm
      WHERE pm.profile_id = v_profile_id
        AND pm.is_active
        AND pm.role = 'admin'
        AND pm.user_id <> v_current_owner_user_id
    ) THEN
      RAISE EXCEPTION 'business_profile_already_managed'
        USING ERRCODE = '23514';
    END IF;

    IF v_school_type = 'public' THEN
      IF NOT private.business_claim_has_official_evidence(v_claim.documents) THEN
        RAISE EXCEPTION 'public_education_claim_requires_documents'
          USING ERRCODE = '23514';
      END IF;

      IF v_review_notes IS NULL OR length(v_review_notes) < 10 THEN
        RAISE EXCEPTION 'public_education_claim_requires_review_notes'
          USING ERRCODE = '23514';
      END IF;
    END IF;

    v_transfer_result := private.profile_transfer_ownership_core(
      v_current_owner_user_id,
      v_profile_id,
      v_claim.user_id,
      false
    );

    IF NOT COALESCE((v_transfer_result->>'success')::boolean, false) THEN
      RAISE EXCEPTION 'business_claim_ownership_transfer_failed: %',
        COALESCE(v_transfer_result->>'error', 'unknown')
        USING ERRCODE = '23514';
    END IF;

    UPDATE public.business_data
    SET
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'custody_status', 'claimed',
        'claimed_at', now(),
        'claim_id', v_claim.id,
        'claimed_user_id', v_claim.user_id,
        'previous_custodian_user_id', v_current_owner_user_id
      ),
      updated_at = now()
    WHERE id = v_business.id;

    UPDATE public.business_claims
    SET
      status = 'rejeitada',
      resolved_at = now(),
      reviewed_at = now(),
      reviewed_by = p_actor_user_id,
      review_notes = 'Outra reivindicacao foi aprovada para este perfil.',
      updated_at = now()
    WHERE business_id = v_business.id
      AND id <> v_claim.id
      AND status = 'pendente';
  END IF;

  UPDATE public.business_claims
  SET
    status = v_target_status,
    resolved_at = now(),
    reviewed_at = now(),
    reviewed_by = p_actor_user_id,
    review_notes = v_review_notes,
    updated_at = now()
  WHERE id = v_claim.id
  RETURNING * INTO v_claim;

  RETURN jsonb_build_object(
    'id', v_claim.id,
    'business_id', v_claim.business_id,
    'profile_id', v_profile_id,
    'user_id', v_claim.user_id,
    'status', v_claim.status,
    'public_education', v_school_type = 'public',
    'ownership_transferred', v_decision = 'approve',
    'previous_custodian_user_id',
      CASE WHEN v_decision = 'approve' THEN v_current_owner_user_id ELSE NULL END,
    'idempotent', false
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_resolve_business_claim(uuid, uuid, text, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resolve_business_claim(uuid, uuid, text, text)
TO service_role;

COMMENT ON FUNCTION private.profile_transfer_ownership_core(
  uuid, uuid, uuid, boolean
) IS
  'Canonical structural ownership mutation. Normal transfers keep the previous owner as Manager; curated-directory claims may deactivate the technical custodian.';
COMMENT ON FUNCTION private.profile_transfer_ownership(uuid, uuid, uuid) IS
  'Owner-only facade over the canonical structural ownership mutation; normal transfers keep the former owner as Manager.';
COMMENT ON FUNCTION public.admin_resolve_business_claim(uuid, uuid, text, text) IS
  'security-authority: service-role-only admin claim resolution reusing canonical profile ownership transfer; public Education requires validated official evidence and review notes.';
