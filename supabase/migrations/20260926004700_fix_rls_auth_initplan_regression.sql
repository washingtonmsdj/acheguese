-- Restore the auth initplan optimization for policies recreated after
-- 20260719120000_optimize_rls_auth_initplan.sql.
--
-- Wrapping auth.uid() in a scalar SELECT lets PostgreSQL evaluate the
-- session identity once per statement instead of once per candidate row.
-- Policy roles and authorization predicates are otherwise unchanged.

BEGIN;

ALTER POLICY "business_direct_reports_own_or_admin_select"
  ON public.business_direct_message_reports
  USING (
    private.auth_owns_active_profile(reporter_profile_id)
    OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)
  );

ALTER POLICY "vaga_applications_insert"
  ON public.vaga_applications
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = vaga_applications.candidato_profile_id
        AND p.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM public.vagas v
      WHERE v.id = vaga_applications.vaga_id
        AND v.status = 'published'::public.vaga_status
        AND v.owner_profile_id <> vaga_applications.candidato_profile_id
    )
  );

ALTER POLICY "vagas_owner_create"
  ON public.vagas
  WITH CHECK (
    owner_profile_id IS NOT NULL
    AND (
      private.is_admin_user((SELECT auth.uid()))
      OR (
        private.can_manage_profile(owner_profile_id)
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = vagas.owner_profile_id
            AND p.profile_type = 'business'
        )
        AND EXISTS (
          SELECT 1
          FROM public.business_data b
          WHERE b.profile_id = vagas.owner_profile_id
            AND COALESCE(b.status, 'active') = 'active'
            AND COALESCE(b.can_post_vagas, true) = true
        )
      )
    )
  );

ALTER POLICY "vagas_owner_delete"
  ON public.vagas
  USING (
    private.is_admin_user((SELECT auth.uid()))
    OR (
      private.can_manage_profile(owner_profile_id)
      AND status = ANY (ARRAY['draft'::public.vaga_status, 'pending_review'::public.vaga_status])
    )
  );

ALTER POLICY "vagas_owner_read"
  ON public.vagas
  USING (
    private.is_admin_user((SELECT auth.uid()))
    OR private.can_manage_profile(owner_profile_id)
  );

ALTER POLICY "vagas_owner_update"
  ON public.vagas
  USING (
    private.is_admin_user((SELECT auth.uid()))
    OR private.can_manage_profile(owner_profile_id)
  )
  WITH CHECK (
    owner_profile_id IS NOT NULL
    AND (
      private.is_admin_user((SELECT auth.uid()))
      OR (
        private.can_manage_profile(owner_profile_id)
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = vagas.owner_profile_id
            AND p.profile_type = 'business'
        )
        AND EXISTS (
          SELECT 1
          FROM public.business_data b
          WHERE b.profile_id = vagas.owner_profile_id
            AND COALESCE(b.status, 'active') = 'active'
            AND COALESCE(b.can_post_vagas, true) = true
        )
      )
    )
  );

COMMIT;
