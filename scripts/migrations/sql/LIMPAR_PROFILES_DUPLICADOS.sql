-- ============================================
-- LIMPAR PROFILES DUPLICADOS
-- ============================================
-- Execute este SQL no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor
-- ============================================

-- 1. Verificar profiles duplicados
SELECT 
  user_id,
  COUNT(*) as total_profiles,
  ARRAY_AGG(id ORDER BY created_at ASC) as profile_ids,
  ARRAY_AGG(display_name ORDER BY created_at ASC) as display_names
FROM profiles
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- 2. Identificar profile principal (mais antigo com nome)
WITH ranked_profiles AS (
  SELECT 
    id,
    user_id,
    display_name,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY 
        CASE WHEN display_name IS NOT NULL AND display_name != '' THEN 0 ELSE 1 END,
        created_at ASC
    ) as rank
  FROM profiles
)
SELECT 
  user_id,
  id as profile_principal,
  display_name,
  created_at
FROM ranked_profiles
WHERE rank = 1
  AND user_id IN (
    SELECT user_id 
    FROM profiles 
    GROUP BY user_id 
    HAVING COUNT(*) > 1
  )
ORDER BY user_id;

-- 3. BACKUP: Criar tabela temporária com profiles duplicados
CREATE TABLE IF NOT EXISTS profiles_backup_duplicados AS
SELECT * FROM profiles
WHERE user_id IN (
  SELECT user_id 
  FROM profiles 
  GROUP BY user_id 
  HAVING COUNT(*) > 1
);

-- 4. Verificar referências em outras tabelas
SELECT 
  'ride_requests' as tabela,
  'passenger_profile_id' as coluna,
  COUNT(*) as total_referencias
FROM ride_requests
WHERE passenger_profile_id IN (
  SELECT id FROM profiles
  WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
)
UNION ALL
SELECT 
  'ride_requests' as tabela,
  'driver_profile_id' as coluna,
  COUNT(*) as total_referencias
FROM ride_requests
WHERE driver_profile_id IN (
  SELECT id FROM profiles
  WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
)
UNION ALL
SELECT 
  'driver_data' as tabela,
  'driver_profile_id' as coluna,
  COUNT(*) as total_referencias
FROM driver_data
WHERE driver_profile_id IN (
  SELECT id FROM profiles
  WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
);

-- 5. MIGRAR referências para profile principal
-- Atualizar ride_requests (passenger)
WITH profile_principal AS (
  SELECT id
  FROM profiles
  WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
  ORDER BY 
    CASE WHEN display_name IS NOT NULL AND display_name != '' THEN 0 ELSE 1 END,
    created_at ASC
  LIMIT 1
)
UPDATE ride_requests
SET passenger_profile_id = (SELECT id FROM profile_principal)
WHERE passenger_profile_id IN (
  SELECT id FROM profiles
  WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
);

-- Atualizar ride_requests (driver)
WITH profile_principal AS (
  SELECT id
  FROM profiles
  WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
  ORDER BY 
    CASE WHEN display_name IS NOT NULL AND display_name != '' THEN 0 ELSE 1 END,
    created_at ASC
  LIMIT 1
)
UPDATE ride_requests
SET driver_profile_id = (SELECT id FROM profile_principal)
WHERE driver_profile_id IN (
  SELECT id FROM profiles
  WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
);

-- Atualizar driver_data
WITH profile_principal AS (
  SELECT id
  FROM profiles
  WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
  ORDER BY 
    CASE WHEN display_name IS NOT NULL AND display_name != '' THEN 0 ELSE 1 END,
    created_at ASC
  LIMIT 1
)
UPDATE driver_data
SET driver_profile_id = (SELECT id FROM profile_principal)
WHERE driver_profile_id IN (
  SELECT id FROM profiles
  WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
);

-- 6. DELETAR profiles duplicados (manter apenas o principal)
WITH profile_principal AS (
  SELECT id
  FROM profiles
  WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
  ORDER BY 
    CASE WHEN display_name IS NOT NULL AND display_name != '' THEN 0 ELSE 1 END,
    created_at ASC
  LIMIT 1
)
DELETE FROM profiles
WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
  AND id NOT IN (SELECT id FROM profile_principal);

-- 7. Adicionar constraint UNIQUE para prevenir duplicatas futuras
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_user_id_unique;

ALTER TABLE profiles 
  ADD CONSTRAINT profiles_user_id_unique 
  UNIQUE (user_id);

-- 8. Verificar resultado final
SELECT 
  user_id,
  COUNT(*) as total_profiles,
  ARRAY_AGG(id) as profile_ids,
  ARRAY_AGG(display_name) as display_names
FROM profiles
WHERE user_id = 'a3ea040f-6f7a-44dd-b778-10eff4295303'
GROUP BY user_id;

-- 9. Verificar que não há mais duplicatas
SELECT 
  user_id,
  COUNT(*) as total_profiles
FROM profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

SELECT '✅ Profiles duplicados limpos e constraint UNIQUE adicionado!' AS status;
