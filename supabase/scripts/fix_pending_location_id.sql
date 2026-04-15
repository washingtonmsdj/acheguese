-- ============================================================================
-- CORREÇÃO MANUAL DE PENDENTES: location_id em business_data e professional_data
-- ============================================================================
-- Usar APÓS rodar audit_pending_location_id.sql e identificar os pendentes.
--
-- INSTRUÇÕES:
--   1. Rodar audit_pending_location_id.sql para ver os pendentes
--   2. Para cada registro pendente, identificar o location_id correto
--      usando a seção 4 do audit (lista de locations disponíveis)
--   3. Preencher os blocos abaixo com os valores corretos
--   4. Executar dentro de uma transação (BEGIN/COMMIT)
--   5. Rodar audit novamente para confirmar que não há mais pendentes
--   6. Só então executar a migration 12 (constraint)
-- ============================================================================

BEGIN;

-- ── BUSINESS: correção individual ────────────────────────────────────────────
-- Substituir <profile_id> e <location_id> pelos valores reais.
-- Repetir o bloco para cada registro pendente.

/*
UPDATE business_data
SET location_id = '<location_id_uuid>'
WHERE profile_id = '<profile_id_uuid>'
  AND location_id IS NULL;
*/

-- Exemplo real (descomente e ajuste):
-- UPDATE business_data
-- SET location_id = 'loc-nordeste-de-amaralina'
-- WHERE profile_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
--   AND location_id IS NULL;


-- ── BUSINESS: aceitar candidato automático para todos com match ───────────────
-- Aplica o candidato encontrado pelo audit para todos os registros que têm
-- um match claro por neighborhood + city. Revisar o resultado do audit antes.
-- DESCOMENTE APENAS SE TIVER REVISADO OS CANDIDATOS E CONFIRMADO QUE ESTÃO CORRETOS.

/*
UPDATE business_data bd
SET location_id = (
  SELECT l.id
  FROM locations l
  JOIN locations city_loc ON city_loc.id = l.parent_id AND city_loc.type = 'city'
  WHERE l.type = 'district' AND l.status = 'active'
    AND l.slug = lower(trim(regexp_replace(unaccent(coalesce(bd.metadata->>'neighborhood', '')), '[^a-z0-9]+', '-', 'g')))
    AND l.slug <> ''
    AND city_loc.slug = lower(trim(regexp_replace(unaccent(coalesce(bd.metadata->>'city', '')), '[^a-z0-9]+', '-', 'g')))
  LIMIT 1
)
WHERE bd.location_id IS NULL
  AND (
    SELECT COUNT(*)
    FROM locations l
    JOIN locations city_loc ON city_loc.id = l.parent_id AND city_loc.type = 'city'
    WHERE l.type = 'district' AND l.status = 'active'
      AND l.slug = lower(trim(regexp_replace(unaccent(coalesce(bd.metadata->>'neighborhood', '')), '[^a-z0-9]+', '-', 'g')))
      AND l.slug <> ''
      AND city_loc.slug = lower(trim(regexp_replace(unaccent(coalesce(bd.metadata->>'city', '')), '[^a-z0-9]+', '-', 'g')))
  ) = 1;
*/


-- ── BUSINESS: mover ativos sem location_id para pending (se não conseguir resolver) ──
-- Usar como último recurso para registros que não têm match possível.
-- Isso permite aplicar a constraint sem bloquear o deploy.
-- O registro fica visível no admin mas sai da vitrine pública.

/*
UPDATE business_data
SET status = 'pending'
WHERE location_id IS NULL
  AND status = 'active';
*/


-- ── PROFESSIONAL: correção individual ────────────────────────────────────────

/*
UPDATE professional_data
SET location_id = '<location_id_uuid>'
WHERE id = '<professional_id_uuid>'
  AND location_id IS NULL;
*/


-- ── PROFESSIONAL: aceitar candidato automático ───────────────────────────────
-- Mesmo padrão do business. Revisar candidatos antes de descomentar.

/*
UPDATE professional_data pd
SET location_id = (
  SELECT l.id
  FROM locations l
  JOIN locations city_loc ON city_loc.id = l.parent_id AND city_loc.type = 'city'
  WHERE l.type = 'district' AND l.status = 'active'
    AND l.slug = lower(trim(regexp_replace(unaccent(coalesce(pd.metadata->'location'->>'neighborhood', '')), '[^a-z0-9]+', '-', 'g')))
    AND l.slug <> ''
    AND city_loc.slug = lower(trim(regexp_replace(unaccent(coalesce(pd.metadata->'location'->>'city', '')), '[^a-z0-9]+', '-', 'g')))
  LIMIT 1
)
WHERE pd.location_id IS NULL
  AND (
    SELECT COUNT(*)
    FROM locations l
    JOIN locations city_loc ON city_loc.id = l.parent_id AND city_loc.type = 'city'
    WHERE l.type = 'district' AND l.status = 'active'
      AND l.slug = lower(trim(regexp_replace(unaccent(coalesce(pd.metadata->'location'->>'neighborhood', '')), '[^a-z0-9]+', '-', 'g')))
      AND l.slug <> ''
      AND city_loc.slug = lower(trim(regexp_replace(unaccent(coalesce(pd.metadata->'location'->>'city', '')), '[^a-z0-9]+', '-', 'g')))
  ) = 1;
*/


-- ── PROFESSIONAL: desativar aceitação de clientes para pendentes irresolvíveis ──

/*
UPDATE professional_data
SET is_accepting_clients = false
WHERE location_id IS NULL
  AND is_accepting_clients = true;
*/


-- Verificar resultado antes de commitar
SELECT
  'business_data' AS tabela,
  COUNT(*) FILTER (WHERE location_id IS NULL AND status = 'active') AS ativos_sem_location_id_restantes
FROM business_data
UNION ALL
SELECT
  'professional_data',
  COUNT(*) FILTER (WHERE location_id IS NULL AND is_accepting_clients = true)
FROM professional_data;

-- Se ambos os valores forem 0, pode commitar e rodar a migration 12.
-- Se ainda houver pendentes, fazer ROLLBACK e resolver antes.

COMMIT;
