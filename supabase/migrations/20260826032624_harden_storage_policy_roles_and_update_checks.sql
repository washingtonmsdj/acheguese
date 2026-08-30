-- Make storage mutation reachability explicit and preserve owner/admin semantics.
-- Historical policies without TO clauses applied to PUBLIC and relied on
-- auth.uid() = NULL to fail closed for anonymous callers. Recreate them as
-- authenticated-only and add explicit WITH CHECK predicates to UPDATE policies
-- so authorized callers cannot move objects into another bucket/folder.

BEGIN;

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload their own business images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own business images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own business images" ON storage.objects;
CREATE POLICY "Users can upload their own business images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'business_images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own business images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'business_images' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'business_images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own business images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'business_images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload their own classified images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own classified images" ON storage.objects;
CREATE POLICY "Users can upload their own classified images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'classified_images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own classified images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'classified_images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload their own event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own event images" ON storage.objects;
CREATE POLICY "Users can upload their own event images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event_images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own event images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'event_images' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'event_images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own event images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'event_images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "ai-images owner insert" ON storage.objects;
DROP POLICY IF EXISTS "ai-images owner select" ON storage.objects;
DROP POLICY IF EXISTS "ai-images owner update" ON storage.objects;
DROP POLICY IF EXISTS "ai-images owner delete" ON storage.objects;
CREATE POLICY "ai-images owner insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ai-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ai-images owner select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ai-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ai-images owner update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ai-images' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'ai-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ai-images owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ai-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "tryon owner select" ON storage.objects;
DROP POLICY IF EXISTS "tryon storage user upload" ON storage.objects;
DROP POLICY IF EXISTS "tryon storage user update" ON storage.objects;
DROP POLICY IF EXISTS "tryon storage user delete" ON storage.objects;
CREATE POLICY "tryon owner select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'tryon' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "tryon storage user upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tryon' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "tryon storage user update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'tryon' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'tryon' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "tryon storage user delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'tryon' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "public-assets_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "public-assets_update_admin" ON storage.objects;
DROP POLICY IF EXISTS "public-assets_delete_admin" ON storage.objects;
CREATE POLICY "public-assets_insert_admin" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public-assets' AND COALESCE(private.is_admin_from_roles(auth.uid()), FALSE));
CREATE POLICY "public-assets_update_admin" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'public-assets' AND COALESCE(private.is_admin_from_roles(auth.uid()), FALSE)) WITH CHECK (bucket_id = 'public-assets' AND COALESCE(private.is_admin_from_roles(auth.uid()), FALSE));
CREATE POLICY "public-assets_delete_admin" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'public-assets' AND COALESCE(private.is_admin_from_roles(auth.uid()), FALSE));

DO $verify$
DECLARE
  v_public_mutation_policies integer;
  v_missing_update_checks integer;
BEGIN
  SELECT count(*) INTO v_public_mutation_policies
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
    AND (
      qual ILIKE ANY (ARRAY['%bucket_id = ''avatars''%','%bucket_id = ''business_images''%','%bucket_id = ''classified_images''%','%bucket_id = ''event_images''%','%bucket_id = ''ai-images''%','%bucket_id = ''tryon''%','%bucket_id = ''public-assets''%'])
      OR with_check ILIKE ANY (ARRAY['%bucket_id = ''avatars''%','%bucket_id = ''business_images''%','%bucket_id = ''classified_images''%','%bucket_id = ''event_images''%','%bucket_id = ''ai-images''%','%bucket_id = ''tryon''%','%bucket_id = ''public-assets''%'])
    )
    AND roles && ARRAY['public', 'anon']::name[];
  IF v_public_mutation_policies <> 0 THEN RAISE EXCEPTION 'public/anon storage mutation policies remain on hardened buckets'; END IF;

  SELECT count(*) INTO v_missing_update_checks
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname IN ('Users can update their own avatar','Users can update their own business images','Users can update their own event images','ai-images owner update','tryon storage user update','public-assets_update_admin')
    AND with_check IS NULL;
  IF v_missing_update_checks <> 0 THEN RAISE EXCEPTION 'storage UPDATE policy missing WITH CHECK'; END IF;
END
$verify$;

COMMIT;