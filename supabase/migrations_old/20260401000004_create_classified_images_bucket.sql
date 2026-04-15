-- ============================================================================
-- Migration: Create Classified Images Storage Bucket
-- Description: Configura bucket para upload de fotos de classificados com RLS
-- Created: 2026-04-01
-- ============================================================================

-- ─── 1. Criar Bucket ─────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'classified-images',
  'classified-images',
  true, -- Público para URLs diretas
  10485760, -- 10MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Políticas RLS para Upload ───────────────────────────────────────────

-- Permitir upload apenas para usuários autenticados nas suas próprias pastas
CREATE POLICY "Users can upload own classified images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'classified-images' AND
  -- Verifica se o primeiro nível da pasta é o ID do usuário
  (storage.foldername(name))[1] = (
    SELECT id::text 
    FROM profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

-- ─── 3. Políticas RLS para Leitura ──────────────────────────────────────────

-- Permitir leitura pública de todas as imagens
CREATE POLICY "Public read access to classified images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'classified-images');

-- ─── 4. Políticas RLS para Atualização ──────────────────────────────────────

-- Permitir atualização apenas das próprias imagens
CREATE POLICY "Users can update own classified images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'classified-images' AND
  (storage.foldername(name))[1] = (
    SELECT id::text 
    FROM profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
)
WITH CHECK (
  bucket_id = 'classified-images' AND
  (storage.foldername(name))[1] = (
    SELECT id::text 
    FROM profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

-- ─── 5. Políticas RLS para Deleção ──────────────────────────────────────────

-- Permitir deleção apenas das próprias imagens
CREATE POLICY "Users can delete own classified images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'classified-images' AND
  (storage.foldername(name))[1] = (
    SELECT id::text 
    FROM profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

-- ─── 6. Comentários ──────────────────────────────────────────────────────────

COMMENT ON POLICY "Users can upload own classified images" ON storage.objects IS
  'Permite que usuários façam upload de imagens apenas nas suas próprias pastas (profileId/images/ ou profileId/thumbnails/)';

COMMENT ON POLICY "Public read access to classified images" ON storage.objects IS
  'Permite leitura pública de todas as imagens de classificados para exibição nos anúncios';

COMMENT ON POLICY "Users can update own classified images" ON storage.objects IS
  'Permite que usuários atualizem apenas suas próprias imagens';

COMMENT ON POLICY "Users can delete own classified images" ON storage.objects IS
  'Permite que usuários deletem apenas suas próprias imagens ao remover ou editar anúncios';

-- ─── 7. Índices para Performance ─────────────────────────────────────────────

-- Nota: storage.objects já possui índices padrão do Supabase
-- Não é necessário criar índices adicionais para este caso de uso

-- ─── 8. Verificação ──────────────────────────────────────────────────────────

DO $$
BEGIN
  -- Verificar se o bucket foi criado
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'classified-images') THEN
    RAISE EXCEPTION 'Bucket classified-images não foi criado corretamente';
  END IF;

  -- Verificar se as políticas foram criadas
  IF (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%classified images%') < 4 THEN
    RAISE WARNING 'Algumas políticas podem não ter sido criadas. Verifique manualmente.';
  END IF;

  RAISE NOTICE '✅ Bucket classified-images criado com sucesso com 4 políticas RLS';
END $$;
