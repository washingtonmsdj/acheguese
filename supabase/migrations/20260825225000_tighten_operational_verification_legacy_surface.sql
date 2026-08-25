-- Safe compatibility hardening while the browser migrates to server-authoritative
-- Gate 7 RPCs. Keep authenticated legacy CRUD temporarily so the currently
-- deployed bundle does not break, but remove anonymous table authority and the
-- dead driver UPDATE policy that compared a profile UUID to auth.uid().

REVOKE SELECT, INSERT, UPDATE, DELETE
ON TABLE public.operational_verifications
FROM anon;

DROP POLICY IF EXISTS "Drivers can update verifications for their rides"
  ON public.operational_verifications;

-- The canonical participant UPDATE policy remains temporarily for compatibility
-- and is removed by the follow-up lockdown migration after the RPC client bundle
-- is confirmed in production.
