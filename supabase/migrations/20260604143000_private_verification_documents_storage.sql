-- ============================================================================
-- Private storage for resident/profile verification documents
-- ============================================================================
-- PII: address proofs and residence photos must not be stored in public buckets.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  false,
  5242880,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png'];

DROP POLICY IF EXISTS "verification_documents_owner_or_admin_select" ON storage.objects;
DROP POLICY IF EXISTS "verification_documents_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "verification_documents_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "verification_documents_owner_delete" ON storage.objects;

CREATE POLICY "verification_documents_owner_or_admin_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id::text = (storage.foldername(name))[1]
          AND p.user_id = auth.uid()
      )
      OR coalesce(public.is_admin_from_roles(auth.uid()), false)
    )
  );

CREATE POLICY "verification_documents_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "verification_documents_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "verification_documents_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.user_id = auth.uid()
    )
  );
