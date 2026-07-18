-- Security Authority: canonical profile verification lifecycle.
-- `public.verification` owns requests and review state. `profiles.verified`
-- remains only the public identity-badge projection.

CREATE TABLE IF NOT EXISTS public.verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  document_url TEXT,
  document_type TEXT,
  notes TEXT,
  review_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.verification
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS review_reason TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Preserve the existing remote lifecycle before removing its duplicated fields.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'verification'
      AND column_name = 'verified'
  ) THEN
    EXECUTE $sql$
      UPDATE public.verification
      SET status = CASE
        WHEN verified THEN 'approved'
        WHEN rejection_reason IS NOT NULL THEN 'rejected'
        ELSE 'pending'
      END,
      review_reason = COALESCE(review_reason, rejection_reason),
      reviewed_at = COALESCE(reviewed_at, verified_at),
      reviewed_by = COALESCE(reviewed_by, verified_by)
    $sql$;
  END IF;
END
$migration$;

UPDATE public.verification
SET status = COALESCE(NULLIF(status, ''), 'pending'),
    submitted_at = COALESCE(submitted_at, created_at, now()),
    created_at = COALESCE(created_at, submitted_at, now()),
    updated_at = COALESCE(updated_at, created_at, now());

ALTER TABLE public.verification
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN submitted_at SET DEFAULT now(),
  ALTER COLUMN submitted_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.verification
  DROP CONSTRAINT IF EXISTS verification_status_check;
ALTER TABLE public.verification
  ADD CONSTRAINT verification_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'revoked'));

CREATE UNIQUE INDEX IF NOT EXISTS verification_profile_type_uidx
  ON public.verification(profile_id, verification_type);
CREATE INDEX IF NOT EXISTS verification_review_queue_idx
  ON public.verification(status, submitted_at, id);
CREATE INDEX IF NOT EXISTS verification_profile_history_idx
  ON public.verification(profile_id, updated_at DESC);

ALTER TABLE public.verification
  DROP COLUMN IF EXISTS verified,
  DROP COLUMN IF EXISTS verified_at,
  DROP COLUMN IF EXISTS verified_by,
  DROP COLUMN IF EXISTS rejection_reason;

CREATE TABLE IF NOT EXISTS private.profile_verification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES public.verification(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (
    action IN ('submitted', 'resubmitted', 'approved', 'rejected', 'revoked')
  ),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_verification_audit_profile_idx
  ON private.profile_verification_audit_log(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profile_verification_audit_verification_idx
  ON private.profile_verification_audit_log(verification_id, created_at DESC);

REVOKE ALL ON TABLE private.profile_verification_audit_log
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.guard_profile_verification_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role'
     OR COALESCE(
       current_setting('achegue.trusted_profile_verification_command', TRUE),
       ''
     ) = '1' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'profile_verification_direct_write_forbidden'
    USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION private.guard_profile_verification_write()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_profile_verification_write
  ON public.verification;
CREATE TRIGGER trg_guard_profile_verification_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.verification
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_profile_verification_write();

CREATE OR REPLACE FUNCTION public.request_profile_verification(
  p_profile_id UUID,
  p_verification_type TEXT,
  p_document_url TEXT DEFAULT NULL,
  p_document_type TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_actor_user_id UUID := auth.uid();
  v_type TEXT := lower(trim(COALESCE(p_verification_type, '')));
  v_document_url TEXT := NULLIF(trim(COALESCE(p_document_url, '')), '');
  v_document_type TEXT := NULLIF(trim(COALESCE(p_document_type, '')), '');
  v_notes TEXT := NULLIF(trim(COALESCE(p_notes, '')), '');
  v_existing public.verification%ROWTYPE;
  v_result public.verification%ROWTYPE;
  v_action TEXT := 'submitted';
BEGIN
  IF v_actor_user_id IS NULL
     OR p_profile_id IS NULL
     OR NOT private.auth_owns_active_profile(p_profile_id) THEN
    RAISE EXCEPTION 'profile_verification_profile_not_owned'
      USING ERRCODE = '42501';
  END IF;

  IF v_type NOT IN ('email', 'phone', 'document', 'resident', 'business') THEN
    RAISE EXCEPTION 'invalid_profile_verification_type'
      USING ERRCODE = '22023';
  END IF;

  IF v_document_url IS NOT NULL AND (
    length(v_document_url) > 1024
    OR v_document_url NOT LIKE
      'storage://verification-documents/' || p_profile_id::TEXT || '/%'
  ) THEN
    RAISE EXCEPTION 'invalid_profile_verification_document_reference'
      USING ERRCODE = '22023';
  END IF;

  IF v_document_type IS NOT NULL AND (
    length(v_document_type) > 64
    OR v_document_type !~ '^[a-z0-9][a-z0-9_-]*$'
  ) THEN
    RAISE EXCEPTION 'invalid_profile_verification_document_type'
      USING ERRCODE = '22023';
  END IF;

  IF v_notes IS NOT NULL AND length(v_notes) > 2000 THEN
    RAISE EXCEPTION 'profile_verification_notes_too_long'
      USING ERRCODE = '22023';
  END IF;

  SELECT verification.*
  INTO v_existing
  FROM public.verification
  WHERE profile_id = p_profile_id
    AND verification_type = v_type
  FOR UPDATE;

  IF FOUND AND v_existing.status IN ('pending', 'approved') THEN
    RETURN jsonb_build_object(
      'id', v_existing.id,
      'profile_id', v_existing.profile_id,
      'verification_type', v_existing.verification_type,
      'status', v_existing.status,
      'submitted_at', v_existing.submitted_at
    );
  END IF;

  IF FOUND THEN
    v_action := 'resubmitted';
    PERFORM set_config('achegue.trusted_profile_verification_command', '1', TRUE);
    UPDATE public.verification
    SET status = 'pending',
        document_url = v_document_url,
        document_type = v_document_type,
        notes = v_notes,
        review_reason = NULL,
        reviewed_at = NULL,
        reviewed_by = NULL,
        submitted_at = now(),
        updated_at = now()
    WHERE id = v_existing.id
    RETURNING * INTO v_result;
  ELSE
    PERFORM set_config('achegue.trusted_profile_verification_command', '1', TRUE);
    INSERT INTO public.verification (
      profile_id,
      verification_type,
      status,
      document_url,
      document_type,
      notes
    ) VALUES (
      p_profile_id,
      v_type,
      'pending',
      v_document_url,
      v_document_type,
      v_notes
    )
    RETURNING * INTO v_result;
  END IF;

  INSERT INTO private.profile_verification_audit_log (
    verification_id,
    profile_id,
    verification_type,
    actor_user_id,
    action
  ) VALUES (
    v_result.id,
    v_result.profile_id,
    v_result.verification_type,
    v_actor_user_id,
    v_action
  );

  RETURN jsonb_build_object(
    'id', v_result.id,
    'profile_id', v_result.profile_id,
    'verification_type', v_result.verification_type,
    'status', v_result.status,
    'submitted_at', v_result.submitted_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.review_profile_verification(
  p_actor_user_id UUID,
  p_verification_id UUID,
  p_decision TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_decision TEXT := lower(trim(COALESCE(p_decision, '')));
  v_reason TEXT := NULLIF(trim(COALESCE(p_reason, '')), '');
  v_status TEXT;
  v_row public.verification%ROWTYPE;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     OR p_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin_user(p_actor_user_id), FALSE) THEN
    RAISE EXCEPTION 'profile_verification_admin_required'
      USING ERRCODE = '42501';
  END IF;

  IF v_decision NOT IN ('approve', 'reject', 'revoke') THEN
    RAISE EXCEPTION 'invalid_profile_verification_decision'
      USING ERRCODE = '22023';
  END IF;

  IF v_decision = 'reject' AND (v_reason IS NULL OR length(v_reason) < 10) THEN
    RAISE EXCEPTION 'profile_verification_rejection_reason_required'
      USING ERRCODE = '22023';
  END IF;

  IF v_reason IS NOT NULL AND length(v_reason) > 500 THEN
    RAISE EXCEPTION 'profile_verification_reason_too_long'
      USING ERRCODE = '22023';
  END IF;

  v_status := CASE v_decision
    WHEN 'approve' THEN 'approved'
    WHEN 'reject' THEN 'rejected'
    ELSE 'revoked'
  END;

  UPDATE public.verification
  SET status = v_status,
      review_reason = v_reason,
      reviewed_at = now(),
      reviewed_by = p_actor_user_id,
      updated_at = now()
  WHERE id = p_verification_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_verification_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  -- Only document verification owns the public identity badge projection.
  IF v_row.verification_type = 'document' THEN
    UPDATE public.profiles
    SET verified = v_status = 'approved',
        verified_at = CASE WHEN v_status = 'approved' THEN now() ELSE NULL END,
        updated_at = now()
    WHERE id = v_row.profile_id;
  END IF;

  INSERT INTO private.profile_verification_audit_log (
    verification_id,
    profile_id,
    verification_type,
    actor_user_id,
    action,
    reason
  ) VALUES (
    v_row.id,
    v_row.profile_id,
    v_row.verification_type,
    p_actor_user_id,
    v_status,
    v_reason
  );

  RETURN jsonb_build_object(
    'id', v_row.id,
    'profile_id', v_row.profile_id,
    'verification_type', v_row.verification_type,
    'status', v_row.status,
    'reviewed_at', v_row.reviewed_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_profile_verification_badge(
  p_actor_user_id UUID,
  p_profile_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_reason TEXT := NULLIF(trim(COALESCE(p_reason, '')), '');
  v_verification_id UUID;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     OR p_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin_user(p_actor_user_id), FALSE) THEN
    RAISE EXCEPTION 'profile_verification_admin_required'
      USING ERRCODE = '42501';
  END IF;

  IF p_profile_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_profile_id
  ) THEN
    RAISE EXCEPTION 'profile_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_reason IS NOT NULL AND length(v_reason) > 500 THEN
    RAISE EXCEPTION 'profile_verification_reason_too_long'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.verification (
    profile_id,
    verification_type,
    status,
    review_reason,
    reviewed_at,
    reviewed_by
  ) VALUES (
    p_profile_id,
    'document',
    'approved',
    COALESCE(v_reason, 'Aprovacao administrativa de identidade'),
    now(),
    p_actor_user_id
  )
  ON CONFLICT (profile_id, verification_type) DO UPDATE
  SET status = 'approved',
      review_reason = EXCLUDED.review_reason,
      reviewed_at = now(),
      reviewed_by = p_actor_user_id,
      updated_at = now()
  RETURNING id INTO v_verification_id;

  UPDATE public.profiles
  SET verified = TRUE,
      verified_at = now(),
      updated_at = now()
  WHERE id = p_profile_id;

  INSERT INTO private.profile_verification_audit_log (
    verification_id,
    profile_id,
    verification_type,
    actor_user_id,
    action,
    reason
  ) VALUES (
    v_verification_id,
    p_profile_id,
    'document',
    p_actor_user_id,
    'approved',
    COALESCE(v_reason, 'Aprovacao administrativa de identidade')
  );

  RETURN jsonb_build_object(
    'id', v_verification_id,
    'profile_id', p_profile_id,
    'verification_type', 'document',
    'status', 'approved'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.request_profile_verification(
  UUID, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_profile_verification(
  UUID, TEXT, TEXT, TEXT, TEXT
) TO authenticated;

REVOKE ALL ON FUNCTION public.review_profile_verification(
  UUID, UUID, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_profile_verification(
  UUID, UUID, TEXT, TEXT
) TO service_role;

REVOKE ALL ON FUNCTION public.set_profile_verification_badge(
  UUID, UUID, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_profile_verification_badge(
  UUID, UUID, TEXT
) TO service_role;

ALTER TABLE public.verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS verification_owner_read ON public.verification;
CREATE POLICY verification_owner_read
  ON public.verification
  FOR SELECT
  TO authenticated
  USING (private.auth_owns_active_profile(profile_id));

REVOKE ALL ON TABLE public.verification FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.verification FROM authenticated;
GRANT SELECT ON TABLE public.verification TO authenticated;
GRANT ALL ON TABLE public.verification TO service_role;

-- Replace the undocumented legacy RPC with a compatibility-safe, actor-bound
-- implementation that writes through the canonical verification aggregate.
CREATE OR REPLACE FUNCTION public.verify_profile(
  p_profile_id UUID,
  p_admin_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
  SELECT public.set_profile_verification_badge(
    p_admin_user_id,
    p_profile_id,
    p_reason
  );
$$;

REVOKE ALL ON FUNCTION public.verify_profile(UUID, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_profile(UUID, UUID, TEXT)
  TO service_role;

COMMENT ON TABLE public.verification IS
  'Canonical profile verification requests and current review state; sensitive evidence is owner/admin only.';
COMMENT ON COLUMN public.verification.status IS
  'Lifecycle SSOT: pending, approved, rejected or revoked.';
COMMENT ON COLUMN public.profiles.verified IS
  'Public identity badge projection; source of truth is approved document verification.';
COMMENT ON FUNCTION public.request_profile_verification(UUID, TEXT, TEXT, TEXT, TEXT) IS
  'security-authority: actor-owned, idempotent profile verification request command.';
COMMENT ON FUNCTION public.review_profile_verification(UUID, UUID, TEXT, TEXT) IS
  'security-authority: service-role-only, actor-bound verification review command.';
COMMENT ON FUNCTION public.set_profile_verification_badge(UUID, UUID, TEXT) IS
  'security-authority: service-role-only administrative identity verification command.';
