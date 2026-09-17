-- G36C2 contract: retire the obsolete suspension RPC after the
-- admin-suspend-profile Edge cutover has been proven live.
DROP FUNCTION IF EXISTS public.suspend_profile(uuid, uuid, text);
