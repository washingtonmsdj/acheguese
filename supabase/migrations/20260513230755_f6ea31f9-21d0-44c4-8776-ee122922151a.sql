
DROP POLICY IF EXISTS "ai-images public read" ON storage.objects;

-- Mantemos leitura apenas pelo dono via RLS; arquivos continuam acessíveis pela URL pública do CDN.
CREATE POLICY "ai-images owner select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ai-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Mesma correção para o bucket tryon, que já existia.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname IN ('tryon public read', 'Public read access tryon', 'tryon read public')
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "tryon public read" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Public read access tryon" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "tryon read public" ON storage.objects';
  END IF;
END $$;
