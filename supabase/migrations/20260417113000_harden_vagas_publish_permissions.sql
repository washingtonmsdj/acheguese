-- ==========================================================================
-- HARDEN VAGAS RLS PERMISSIONS (SSOT)
-- --------------------------------------------------------------------------
-- Objetivo:
-- - Remover policies permissivas de create/update/delete em vagas
-- - Garantir publicação apenas por owner/admin de perfil business ativo
-- - Manter override administrativo (role admin em user_roles)
--
-- Data: 2026-04-17
-- ============================================================================

BEGIN;

ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vagas
  ADD COLUMN IF NOT EXISTS owner_profile_id UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_vagas_owner_profile_id
  ON public.vagas(owner_profile_id);

-- --------------------------------------------------------------------------
-- Helpers de autorização
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_profile(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.profile_members pm
    WHERE pm.profile_id = p_profile_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_profile(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_profile(UUID) TO authenticated;

-- --------------------------------------------------------------------------
-- Policies
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "vagas_business_create" ON public.vagas;
DROP POLICY IF EXISTS "vagas_business_update" ON public.vagas;
DROP POLICY IF EXISTS "vagas_owner_create" ON public.vagas;
DROP POLICY IF EXISTS "vagas_owner_update" ON public.vagas;
DROP POLICY IF EXISTS "vagas_owner_delete" ON public.vagas;
DROP POLICY IF EXISTS "vagas_owner_read" ON public.vagas;
DROP POLICY IF EXISTS "vagas_admin_all" ON public.vagas;
DROP POLICY IF EXISTS "vagas_public_read" ON public.vagas;

CREATE POLICY "vagas_public_read"
  ON public.vagas
  FOR SELECT
  TO anon, authenticated
  USING (
    status::text = 'published'
    AND (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "vagas_owner_read"
  ON public.vagas
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_user(auth.uid())
    OR public.can_manage_profile(owner_profile_id)
  );

CREATE POLICY "vagas_owner_create"
  ON public.vagas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_profile_id IS NOT NULL
    AND (
      public.is_admin_user(auth.uid())
      OR (
        public.can_manage_profile(owner_profile_id)
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = owner_profile_id
            AND p.profile_type = 'business'
        )
        AND EXISTS (
          SELECT 1
          FROM public.business_data b
          WHERE b.profile_id = owner_profile_id
            AND COALESCE(b.status, 'active') = 'active'
        )
      )
    )
  );

CREATE POLICY "vagas_owner_update"
  ON public.vagas
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_user(auth.uid())
    OR public.can_manage_profile(owner_profile_id)
  )
  WITH CHECK (
    owner_profile_id IS NOT NULL
    AND (
      public.is_admin_user(auth.uid())
      OR (
        public.can_manage_profile(owner_profile_id)
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = owner_profile_id
            AND p.profile_type = 'business'
        )
        AND EXISTS (
          SELECT 1
          FROM public.business_data b
          WHERE b.profile_id = owner_profile_id
            AND COALESCE(b.status, 'active') = 'active'
        )
      )
    )
  );

CREATE POLICY "vagas_owner_delete"
  ON public.vagas
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin_user(auth.uid())
    OR (
      public.can_manage_profile(owner_profile_id)
      AND status::text IN ('draft', 'pending_review')
    )
  );

COMMENT ON FUNCTION public.is_admin_user(UUID)
  IS 'SSOT vagas: verifica se auth user possui role admin.';

COMMENT ON FUNCTION public.can_manage_profile(UUID)
  IS 'SSOT vagas: verifica ownership estrutural ou role owner/admin em profile_members.';

COMMIT;
