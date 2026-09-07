-- G6 Education: destructive deletion of the Education identity is not part of
-- delegated/institutional management.
--
-- Managers keep read/create/update authority. Deleting education_profiles is
-- reserved to the structural Profile owner; FK cascades remain available to
-- trusted server-side cleanup and owner-driven compensation.

DROP POLICY IF EXISTS education_profiles_owner_all
  ON public.education_profiles;

CREATE POLICY education_profiles_manager_select
  ON public.education_profiles
  FOR SELECT
  TO authenticated
  USING (private.can_operate_business_profile(business_id));

CREATE POLICY education_profiles_manager_insert
  ON public.education_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (private.can_operate_business_profile(business_id));

CREATE POLICY education_profiles_manager_update
  ON public.education_profiles
  FOR UPDATE
  TO authenticated
  USING (private.can_operate_business_profile(business_id))
  WITH CHECK (private.can_operate_business_profile(business_id));

CREATE POLICY education_profiles_structural_owner_delete
  ON public.education_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = education_profiles.business_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

COMMENT ON POLICY education_profiles_structural_owner_delete
  ON public.education_profiles IS
  'Destructive deletion of the Education identity is structural-owner-only. Delegated and institutional managers retain read/create/update management but cannot delete the extension row.';
