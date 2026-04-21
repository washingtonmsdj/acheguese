-- ============================================================================
-- MIGRATION: Fix Storage Ownership Policies & PII Access Log Security
-- ============================================================================
-- Data: 2026-04-20
-- Descrição:
--   1. Corrige políticas de upload dos buckets business_images, post_images,
--      event_images e classified_images para exigir ownership (user_id no path).
--      Antes qualquer usuário autenticado podia fazer upload em qualquer path,
--      incluindo sobrescrever arquivos de outros usuários.
--   2. Restringe EXECUTE da função log_pii_access a service_role apenas,
--      impedindo que usuários comuns insiram registros falsos no audit trail.
-- ============================================================================

-- ============================================================================
-- 1. BUSINESS_IMAGES — adicionar ownership check no upload
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can upload business images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their business images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their business images" ON storage.objects;

-- Upload: o primeiro segmento do path deve ser o user_id do usuário autenticado
CREATE POLICY "Users can upload their own business images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'business_images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update: apenas o dono do path pode atualizar
CREATE POLICY "Users can update their own business images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'business_images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Delete: apenas o dono do path pode deletar
CREATE POLICY "Users can delete their own business images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'business_images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- 2. POST_IMAGES — adicionar ownership check no upload
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their post images" ON storage.objects;

CREATE POLICY "Users can upload their own post images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post_images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post_images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- 3. EVENT_IMAGES — adicionar ownership check no upload
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete event images" ON storage.objects;

CREATE POLICY "Users can upload their own event images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event_images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own event images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'event_images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own event images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event_images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- 4. CLASSIFIED_IMAGES — adicionar ownership check no upload
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can upload classified images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their classified images" ON storage.objects;

CREATE POLICY "Users can upload their own classified images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'classified_images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own classified images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'classified_images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- 5. PII_ACCESS_LOG — restringir EXECUTE de log_pii_access a service_role
-- ============================================================================
-- A função log_pii_access é SECURITY DEFINER e pode ser chamada via .rpc()
-- por qualquer usuário autenticado, permitindo inserção de registros falsos
-- no audit trail. Revogamos o EXECUTE de 'authenticated' e concedemos apenas
-- a 'service_role' (usada pelas edge functions).

REVOKE EXECUTE ON FUNCTION log_pii_access(UUID, VARCHAR, UUID, VARCHAR, TEXT, VARCHAR, TEXT, VARCHAR)
  FROM authenticated;

REVOKE EXECUTE ON FUNCTION log_pii_access(UUID, VARCHAR, UUID, VARCHAR, TEXT, VARCHAR, TEXT, VARCHAR)
  FROM anon;

GRANT EXECUTE ON FUNCTION log_pii_access(UUID, VARCHAR, UUID, VARCHAR, TEXT, VARCHAR, TEXT, VARCHAR)
  TO service_role;

-- Comentário de auditoria
COMMENT ON FUNCTION log_pii_access IS
  'Registra acesso a dados PII para auditoria LGPD. '
  'EXECUTE restrito a service_role (edge functions) — v2.4.0 security fix.';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
