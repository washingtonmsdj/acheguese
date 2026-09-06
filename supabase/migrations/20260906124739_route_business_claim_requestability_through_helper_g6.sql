CREATE OR REPLACE FUNCTION private.business_claim_is_requestable(
  p_business_id uuid,
  p_documents jsonb
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
DECLARE
  v_profile_id uuid;
  v_claimable boolean := false;
  v_is_public_education boolean := false;
BEGIN
  IF p_business_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT
    bd.profile_id,
    (
      bd.status = 'active'
      AND (
        bd.metadata->>'custody_status' IN (
          'platform_curated_pending_official_claim',
          'directory_unclaimed',
          'source_backed_unclaimed'
        )
        OR bd.metadata->>'public_record_provenance_status' = 'source_backed_unclaimed'
      )
    )
  INTO v_profile_id, v_claimable
  FROM public.business_data bd
  WHERE bd.id = p_business_id;

  IF v_profile_id IS NULL OR NOT COALESCE(v_claimable, false) THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.education_profiles ep
    WHERE ep.business_id = v_profile_id
      AND ep.school_type = 'public'
  )
  INTO v_is_public_education;

  IF v_is_public_education THEN
    RETURN private.business_claim_has_official_evidence(p_documents);
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION private.business_claim_is_requestable(uuid, jsonb)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.business_claim_is_requestable(uuid, jsonb)
TO authenticated, service_role;

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
  AND private.business_claim_is_requestable(
    business_claims.business_id,
    documents
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
  AND private.business_claim_is_requestable(
    business_claims.business_id,
    documents
  )
);

COMMENT ON FUNCTION private.business_claim_is_requestable(uuid, jsonb) IS
  'Bounded SECURITY DEFINER policy helper. Returns only whether an active canonical Business is claimable; public Education additionally requires validated official-source evidence.';
