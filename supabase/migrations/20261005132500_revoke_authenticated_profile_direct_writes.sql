BEGIN;

-- Profile lifecycle mutations are broker-owned by the profile-rpc Edge Function.
-- Browser clients must not bypass that boundary with direct table writes.
REVOKE INSERT, UPDATE ON TABLE public.profiles FROM authenticated;

COMMIT;
