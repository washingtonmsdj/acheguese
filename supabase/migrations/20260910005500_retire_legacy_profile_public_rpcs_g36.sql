-- G36C4 contract: retire the original auth.uid()-based public mutation RPCs.
-- All live product callers already use authenticated Edge brokers backed by
-- service-role-only RPCs. No CASCADE: unexpected database dependencies fail closed.

DROP FUNCTION IF EXISTS public.create_profile_with_extension(
  text, text, text, text, text, jsonb
);
DROP FUNCTION IF EXISTS public.update_profile_handle(uuid, text);
DROP FUNCTION IF EXISTS public.delete_profile(uuid);
DROP FUNCTION IF EXISTS public.transfer_profile_ownership(uuid, uuid);
DROP FUNCTION IF EXISTS public.invite_profile_member_by_email(uuid, text, text);
