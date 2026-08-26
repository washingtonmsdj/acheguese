-- Consolidate Business Claim ownership on the canonical required user_id.
-- claimer_id is retained for compatibility but may only be NULL or mirror
-- user_id. Client-side owners can create/read/edit their own pending claim;
-- moderation remains governed by the existing canonical admin policy.

ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users create claims"
ON public.business_claims;
DROP POLICY IF EXISTS "Users create own claims"
ON public.business_claims;
DROP POLICY IF EXISTS "Users update own pending claims"
ON public.business_claims;
DROP POLICY IF EXISTS "Users view own claims"
ON public.business_claims;
DROP POLICY IF EXISTS business_claims_owner_insert
ON public.business_claims;
DROP POLICY IF EXISTS business_claims_owner_select
ON public.business_claims;
DROP POLICY IF EXISTS business_claims_owner_update
ON public.business_claims;

ALTER TABLE public.business_claims
  DROP CONSTRAINT IF EXISTS business_claims_identity_consistent;

ALTER TABLE public.business_claims
  ADD CONSTRAINT business_claims_identity_consistent
  CHECK (claimer_id IS NULL OR claimer_id = user_id)
  NOT VALID;

ALTER TABLE public.business_claims
  VALIDATE CONSTRAINT business_claims_identity_consistent;

CREATE POLICY business_claims_owner_select
ON public.business_claims
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

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
);

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
);

DO $verify$
DECLARE
  v_orphan_visibility integer;
  v_insert_policies integer;
  v_update_policies integer;
BEGIN
  SELECT count(*)
  INTO v_orphan_visibility
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'business_claims'
    AND p.roles && ARRAY['anon', 'authenticated', 'public']::name[]
    AND (
      COALESCE(p.qual, '') ILIKE '%claimer_id IS NULL%'
      OR COALESCE(p.with_check, '') ILIKE '%claimer_id IS NULL%'
    )
    AND COALESCE(p.qual, '') NOT ILIKE '%user_id%'
    AND COALESCE(p.with_check, '') NOT ILIKE '%user_id%';

  IF v_orphan_visibility <> 0 THEN
    RAISE EXCEPTION 'orphan-only Business Claim policy remains';
  END IF;

  SELECT count(*) INTO v_insert_policies
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'business_claims'
    AND p.cmd = 'INSERT'
    AND p.roles && ARRAY['authenticated']::name[]
    AND p.policyname = 'business_claims_owner_insert';

  SELECT count(*) INTO v_update_policies
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'business_claims'
    AND p.cmd = 'UPDATE'
    AND p.roles && ARRAY['authenticated']::name[]
    AND p.policyname = 'business_claims_owner_update';

  IF v_insert_policies <> 1 OR v_update_policies <> 1 THEN
    RAISE EXCEPTION 'canonical Business Claim owner policies missing';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
