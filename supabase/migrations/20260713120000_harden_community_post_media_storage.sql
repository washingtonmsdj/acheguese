-- Canonical public media bucket for community post images.
-- Object paths are profile-owned: {profile_id}/posts/{random_name}.jpg.

BEGIN;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'post_images',
  'post_images',
  TRUE,
  5242880,
  ARRAY['image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;
DROP POLICY IF EXISTS post_images_owner_insert ON storage.objects;
DROP POLICY IF EXISTS post_images_owner_delete ON storage.objects;

CREATE POLICY post_images_owner_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post_images'
    AND (storage.foldername(name))[2] = 'posts'
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg')
    AND private.auth_owns_active_profile(
      CASE
        WHEN COALESCE((storage.foldername(name))[1], '')
          ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN (storage.foldername(name))[1]::UUID
        ELSE NULL
      END
    )
  );

CREATE POLICY post_images_owner_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post_images'
    AND (storage.foldername(name))[2] = 'posts'
    AND private.auth_owns_active_profile(
      CASE
        WHEN COALESCE((storage.foldername(name))[1], '')
          ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN (storage.foldername(name))[1]::UUID
        ELSE NULL
      END
    )
  );

COMMIT;
