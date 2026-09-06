-- G6 Business/Education claim authority reconciliation.
-- business_claims had drifted to legacy public.businesses while the canonical
-- business identity is public.business_data -> profiles. Because the live claim
-- table is empty, repair the FK without compatibility duplication and make claim
-- approval atomically transfer real profile authority.

DO $$
DECLARE
  v_claim_count integer;
BEGIN
  SELECT count(*) INTO v_claim_count FROM public.business_claims;
  IF v_claim_count <> 0 THEN
    RAISE EXCEPTION 'business_claims_fk_reconciliation_requires_empty_table: %', v_claim_count;
  END IF;
END
$$;

ALTER TABLE public.business_claims
  DROP CONSTRAINT IF EXISTS business_claims_business_id_fkey;

ALTER TABLE public.business_claims
  ADD CONSTRAINT business_claims_business_id_fkey
  FOREIGN KEY (business_id)
  REFERENCES public.business_data(id)
  ON DELETE CASCADE;

ALTER TABLE public.business_claims
  DROP CONSTRAINT IF EXISTS unique_pending_claim;

DROP INDEX IF EXISTS public.unique_pending_claim;
DROP INDEX IF EXISTS public.business_claims_pending_user_business_uidx;

CREATE UNIQUE INDEX business_claims_pending_user_business_uidx
  ON public.business_claims(user_id, business_id)
  WHERE status = 'pendente';

DROP POLICY IF EXISTS "Admins manage all claims" ON public.business_claims;
DROP POLICY IF EXISTS business_claims_admin_select ON public.business_claims;
CREATE POLICY business_claims_admin_select
ON public.business_claims
FOR SELECT TO authenticated
USING (private.is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS business_claims_owner_insert ON public.business_claims;
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
    WHERE bd.id = business_id
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
  v_school_type text;
  v_decision text := lower(trim(COALESCE(p_decision, '')));
  v_review_notes text := NULLIF(trim(COALESCE(p_review_notes, '')), '');
  v_target_status text;
  v_documents_count integer;
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
        AND pm.role IN ('owner', 'admin')
    ) THEN
      RAISE EXCEPTION 'business_profile_already_managed'
        USING ERRCODE = '23514';
    END IF;

    IF v_school_type = 'public' THEN
      v_documents_count := jsonb_array_length(COALESCE(v_claim.documents, '[]'::jsonb));

      IF v_documents_count = 0 THEN
        RAISE EXCEPTION 'public_education_claim_requires_documents'
          USING ERRCODE = '23514';
      END IF;

      IF v_review_notes IS NULL OR length(v_review_notes) < 10 THEN
        RAISE EXCEPTION 'public_education_claim_requires_review_notes'
          USING ERRCODE = '23514';
      END IF;
    END IF;

    UPDATE public.profiles
    SET user_id = v_claim.user_id, updated_at = now()
    WHERE id = v_profile_id;

    INSERT INTO public.profile_members (
      profile_id, user_id, role, joined_at, invited_by, is_active
    )
    VALUES (
      v_profile_id, v_claim.user_id, 'owner', now(), p_actor_user_id, true
    )
    ON CONFLICT (profile_id, user_id) DO UPDATE
    SET role = 'owner', is_active = true, invited_by = EXCLUDED.invited_by;

    UPDATE public.business_data
    SET
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'custody_status', 'claimed',
        'claimed_at', now(),
        'claim_id', v_claim.id,
        'claimed_user_id', v_claim.user_id
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
    'idempotent', false
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_resolve_business_claim(uuid, uuid, text, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_resolve_business_claim(uuid, uuid, text, text)
TO service_role;

COMMENT ON FUNCTION public.admin_resolve_business_claim(uuid, uuid, text, text) IS
  'security-authority: service-role-only, admin-bound atomic business claim resolution and profile ownership transfer.';
