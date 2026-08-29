-- Harden the legacy private `documents` bucket without changing ownership semantics.
-- The historical policies were created without an explicit TO clause, which made
-- them apply to PUBLIC and rely on auth.uid() = NULL to fail closed for anon.
-- Keep the exact owner-folder predicate but make browser reachability explicit.

BEGIN;

UPDATE storage.buckets
SET public = false,
    updated_at = now()
WHERE id = 'documents';

DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

CREATE POLICY "Users can view their own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DO $verify$
DECLARE
  v_bad_policies integer;
  v_expected_policies integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'documents'
      AND public = false
  ) THEN
    RAISE EXCEPTION 'documents bucket must remain private';
  END IF;

  SELECT count(*)
  INTO v_expected_policies
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname IN (
      'Users can view their own documents',
      'Users can upload their own documents',
      'Users can delete their own documents'
    )
    AND roles = ARRAY['authenticated']::name[];

  IF v_expected_policies <> 3 THEN
    RAISE EXCEPTION 'documents storage policies are not authenticated-only';
  END IF;

  SELECT count(*)
  INTO v_bad_policies
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname IN (
      'Users can view their own documents',
      'Users can upload their own documents',
      'Users can delete their own documents'
    )
    AND roles && ARRAY['public', 'anon']::name[];

  IF v_bad_policies <> 0 THEN
    RAISE EXCEPTION 'public/anon documents storage policy remains';
  END IF;
END
$verify$;

COMMIT;
