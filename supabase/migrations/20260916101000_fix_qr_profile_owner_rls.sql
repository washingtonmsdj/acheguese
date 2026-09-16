-- QR ownership is profile-based: qr_codes.owner_profile_id references
-- public.profiles(id). The legacy policies compared that profile UUID directly
-- with auth.uid(), which is an auth user UUID. Reuse the canonical profile
-- management authority without reopening browser DML grants.

DROP POLICY IF EXISTS "Users can view their own QR codes" ON public.qr_codes;
CREATE POLICY "Users can view their own QR codes"
ON public.qr_codes
FOR SELECT
TO authenticated
USING (private.can_manage_profile(owner_profile_id));

DROP POLICY IF EXISTS "Users can insert their own QR codes" ON public.qr_codes;
CREATE POLICY "Users can insert their own QR codes"
ON public.qr_codes
FOR INSERT
TO authenticated
WITH CHECK (private.can_manage_profile(owner_profile_id));

DROP POLICY IF EXISTS "Users can update their own QR codes" ON public.qr_codes;
CREATE POLICY "Users can update their own QR codes"
ON public.qr_codes
FOR UPDATE
TO authenticated
USING (private.can_manage_profile(owner_profile_id))
WITH CHECK (private.can_manage_profile(owner_profile_id));

DROP POLICY IF EXISTS "Users can delete their own QR codes" ON public.qr_codes;
CREATE POLICY "Users can delete their own QR codes"
ON public.qr_codes
FOR DELETE
TO authenticated
USING (private.can_manage_profile(owner_profile_id));

DROP POLICY IF EXISTS "QR owners can view scans" ON public.qr_code_scans;
CREATE POLICY "QR owners can view scans"
ON public.qr_code_scans
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.qr_codes qc
    WHERE qc.id = qr_code_scans.qr_code_id
      AND private.can_manage_profile(qc.owner_profile_id)
  )
);

-- Browser writes remain intentionally broker-only. These revokes are repeated
-- as a fail-closed assertion of the current contract rather than relaxed.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.qr_codes
FROM anon, authenticated;

DO $$
BEGIN
  IF has_table_privilege('anon', 'public.qr_codes', 'INSERT')
     OR has_table_privilege('anon', 'public.qr_codes', 'UPDATE')
     OR has_table_privilege('anon', 'public.qr_codes', 'DELETE')
     OR has_table_privilege('authenticated', 'public.qr_codes', 'INSERT')
     OR has_table_privilege('authenticated', 'public.qr_codes', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.qr_codes', 'DELETE') THEN
    RAISE EXCEPTION 'qr_codes browser DML must remain revoked';
  END IF;
END
$$;
