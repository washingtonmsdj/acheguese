-- Harden profile_members authorization.
--
-- Two legacy permissive policies made the specific ownership policies moot:
-- 1) "Owners manage members" allowed any authenticated user to manage rows
--    where user_id = auth.uid(), regardless of profile_id. That allowed moving
--    or inserting a self-membership into another profile.
-- 2) "Members viewable by authenticated" exposed every membership row to every
--    authenticated user.
--
-- Keep the existing operation-specific policies that scope writes to profiles
-- actually owned by the caller and reads to profile owners / the member themself.

DROP POLICY IF EXISTS "Owners manage members" ON public.profile_members;
DROP POLICY IF EXISTS "Members viewable by authenticated" ON public.profile_members;

-- Make the UPDATE post-image constraint explicit so profile_id cannot be moved
-- to a profile the caller does not own.
ALTER POLICY "Update profile members"
ON public.profile_members
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = profile_members.profile_id
      AND profiles.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = profile_members.profile_id
      AND profiles.user_id = (SELECT auth.uid())
  )
);
