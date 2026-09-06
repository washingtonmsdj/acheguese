-- G6 membership repair.
-- A legacy updated_at trigger existed on profile_members without the column.
-- Add the intended audit timestamp and mirror every structural Business /
-- Professional owner in profile_members so People & Access has one coherent read.

ALTER TABLE public.profile_members
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

INSERT INTO public.profile_members (
  profile_id,
  user_id,
  role,
  joined_at,
  invited_by,
  is_active
)
SELECT
  p.id,
  p.user_id,
  'owner',
  COALESCE(p.created_at, now()),
  p.user_id,
  true
FROM public.profiles p
WHERE p.profile_type IN ('business', 'professional')
  AND p.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.profile_members pm
    WHERE pm.profile_id = p.id
      AND pm.user_id = p.user_id
  );

COMMENT ON COLUMN public.profile_members.updated_at IS
  'Last access-role or membership-state change timestamp; maintained by update_profile_members_updated_at.';

COMMENT ON TABLE public.profile_members IS
  'Profile-scoped access. profiles.user_id is the structural owner; role=owner mirrors it, role=admin is surfaced as Gestor/Manager, and role=member is limited access.';
