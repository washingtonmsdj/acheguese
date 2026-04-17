-- ============================================================================
-- BUSINESS CAN POST VAGAS CONTROL (SSOT)
-- ----------------------------------------------------------------------------
-- Objetivo:
-- - Adicionar controle explicito por empresa para publicar vagas
-- - Integrar o controle nas policies RLS de create/update de vagas
--
-- Data: 2026-04-17
-- ============================================================================

BEGIN;

ALTER TABLE public.business_data
  ADD COLUMN IF NOT EXISTS can_post_vagas BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.business_data.can_post_vagas
  IS 'Controle administrativo: define se a empresa pode publicar/editar vagas.';

DROP POLICY IF EXISTS "vagas_owner_create" ON public.vagas;
DROP POLICY IF EXISTS "vagas_owner_update" ON public.vagas;

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
            AND COALESCE(b.can_post_vagas, TRUE) = TRUE
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
            AND COALESCE(b.can_post_vagas, TRUE) = TRUE
        )
      )
    )
  );

COMMIT;
