-- Remove the obsolete hyphenated classified-images bucket.
-- The canonical bucket is `classified_images`; this legacy alias has no objects,
-- no storage policies and no runtime consumer after storage bucket SSOT cleanup.

BEGIN;

DO $preflight$
DECLARE
  v_objects bigint;
  v_policies integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'classified-images') THEN
    RETURN;
  END IF;

  SELECT count(*) INTO v_objects
  FROM storage.objects
  WHERE bucket_id = 'classified-images';

  IF v_objects <> 0 THEN
    RAISE EXCEPTION 'classified-images bucket is no longer empty (% objects)', v_objects;
  END IF;

  SELECT count(*) INTO v_policies
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (
      COALESCE(qual, '') ILIKE '%classified-images%'
      OR COALESCE(with_check, '') ILIKE '%classified-images%'
      OR policyname ILIKE '%classified-images%'
    );

  IF v_policies <> 0 THEN
    RAISE EXCEPTION 'classified-images storage policies still exist (%)', v_policies;
  END IF;
END
$preflight$;

DELETE FROM storage.buckets
WHERE id = 'classified-images';

DO $verify$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'classified-images') THEN
    RAISE EXCEPTION 'orphan classified-images bucket still exists';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'classified_images') THEN
    RAISE EXCEPTION 'canonical classified_images bucket is missing';
  END IF;
END
$verify$;

COMMIT;
