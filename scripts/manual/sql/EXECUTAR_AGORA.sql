-- ============================================================================
-- EXECUTAR NO SUPABASE DASHBOARD SQL EDITOR
-- ============================================================================

-- 1. Recarregar schema cache
NOTIFY pgrst, 'reload schema';

-- 2. Verificar fila
SELECT pg_notification_queue_usage();

-- 3. Verificar se encanador existe
SELECT professional_name, slug, service_category, location_id
FROM professional_data
WHERE slug LIKE '%encanador%'
  AND location_id = '384add59-4e53-489d-a7b5-97dea2b3f442';

-- 4. Se não existir, criar encanador
INSERT INTO professional_data (
  id,
  profile_id,
  professional_name,
  slug,
  service_category,
  location_id,
  is_accepting_clients,
  phone,
  metadata,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE username LIKE '%encanador%' LIMIT 1),
  'Carlos Santos - Encanador',
  'encanador-carlos-ai-seed',
  'Encanador',
  '384add59-4e53-489d-a7b5-97dea2b3f442',
  true,
  '(71) 9999-7777',
  jsonb_build_object('latitude', -12.9978, 'longitude', -38.4503),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM professional_data WHERE slug = 'encanador-carlos-ai-seed'
);

-- 5. Verificar seed completo
SELECT 
  'EMPRESAS' as tipo,
  COUNT(*) as quantidade
FROM businesses
WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442'
  AND status = 'active'
UNION ALL
SELECT 
  'PROFISSIONAIS' as tipo,
  COUNT(*) as quantidade
FROM professional_data
WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442'
  AND is_accepting_clients = true;
