-- G5: verification-documents is a reserved private path for the canonical
-- profile-verification aggregate, but there is no runtime upload caller and the
-- bucket is empty. Remove dormant browser storage authority without deleting
-- the bucket or changing the storage://verification-documents/<profile>/ contract.

DO $g5_verification_documents_preflight$
DECLARE
  v_public boolean;
  v_object_count bigint;
BEGIN
  SELECT b.public
    INTO v_public
  FROM storage.buckets b
  WHERE b.id = 'verification-documents';

  IF v_public IS NULL THEN
    RAISE EXCEPTION
      'G5_VERIFICATION_DOCUMENTS_BLOCKED: verification-documents bucket is missing';
  END IF;

  IF v_public IS DISTINCT FROM FALSE THEN
    RAISE EXCEPTION
      'G5_VERIFICATION_DOCUMENTS_BLOCKED: verification-documents bucket is not private';
  END IF;

  SELECT count(*)::bigint
    INTO v_object_count
  FROM storage.objects o
  WHERE o.bucket_id = 'verification-documents';

  IF v_object_count <> 0 THEN
    RAISE EXCEPTION
      'G5_VERIFICATION_DOCUMENTS_BLOCKED: bucket is no longer dormant (% objects)',
      v_object_count;
  END IF;
END
$g5_verification_documents_preflight$;

DROP POLICY IF EXISTS verification_documents_owner_delete ON storage.objects;
DROP POLICY IF EXISTS verification_documents_owner_insert ON storage.objects;
DROP POLICY IF EXISTS verification_documents_owner_or_admin_select ON storage.objects;
DROP POLICY IF EXISTS verification_documents_owner_update ON storage.objects;

DO $g5_verification_documents_assertions$
DECLARE
  v_browser_policy_count integer;
BEGIN
  SELECT count(*)::integer
    INTO v_browser_policy_count
  FROM pg_policies p
  WHERE p.schemaname = 'storage'
    AND p.tablename = 'objects'
    AND (
      coalesce(p.qual, '') ILIKE '%verification-documents%'
      OR coalesce(p.with_check, '') ILIKE '%verification-documents%'
    )
    AND (
      'anon' = ANY(p.roles::text[])
      OR 'authenticated' = ANY(p.roles::text[])
      OR 'public' = ANY(lower(p.roles::text)::text[])
    );

  IF v_browser_policy_count <> 0 THEN
    RAISE EXCEPTION
      'G5_VERIFICATION_DOCUMENTS_BLOCKED: % browser storage policies remain',
      v_browser_policy_count;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets b
    WHERE b.id = 'verification-documents'
      AND b.public = FALSE
  ) THEN
    RAISE EXCEPTION
      'G5_VERIFICATION_DOCUMENTS_BLOCKED: private bucket contract was not preserved';
  END IF;
END
$g5_verification_documents_assertions$;
