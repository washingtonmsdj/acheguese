-- ============================================================================
-- MIGRATION: Configure Storage Buckets
-- ============================================================================
-- Etapa: 1.5 - Storage Buckets
-- Data: 2026-04-18
-- Descrição: Configura buckets de storage com políticas RLS
-- ============================================================================

-- Remover políticas existentes de storage
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- 1. AVATARS - Fotos de perfil
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Políticas para avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 2. BUSINESS_IMAGES - Imagens de negócios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business_images',
  'business_images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Políticas para business_images
CREATE POLICY "Business images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business_images');

CREATE POLICY "Authenticated users can upload business images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'business_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their business images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'business_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their business images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'business_images' AND auth.role() = 'authenticated');

-- 3. DOCUMENTS - Documentos (verificação, etc)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- privado
  20971520, -- 20MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png'];

-- Políticas para documents
CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. POST_IMAGES - Imagens de posts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post_images',
  'post_images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Políticas para post_images
CREATE POLICY "Post images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post_images');

CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their post images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post_images' AND auth.role() = 'authenticated');

-- 5. EVENT_IMAGES - Imagens de eventos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event_images',
  'event_images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Políticas para event_images
CREATE POLICY "Event images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event_images');

CREATE POLICY "Authenticated users can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update event images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'event_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete event images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'event_images' AND auth.role() = 'authenticated');

-- 6. CLASSIFIED_IMAGES - Imagens de classificados
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'classified_images',
  'classified_images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Políticas para classified_images
CREATE POLICY "Classified images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'classified_images');

CREATE POLICY "Authenticated users can upload classified images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'classified_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their classified images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'classified_images' AND auth.role() = 'authenticated');

-- FIM DA MIGRATION
