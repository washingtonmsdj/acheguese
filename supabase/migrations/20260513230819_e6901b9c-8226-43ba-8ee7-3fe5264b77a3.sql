
DROP POLICY IF EXISTS "tryon storage public read" ON storage.objects;

CREATE POLICY "tryon owner select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tryon'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
