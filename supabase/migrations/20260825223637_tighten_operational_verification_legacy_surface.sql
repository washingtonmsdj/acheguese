REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.operational_verifications FROM anon;
DROP POLICY IF EXISTS "Drivers can update verifications for their rides" ON public.operational_verifications;