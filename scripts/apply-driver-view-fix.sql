-- ============================================================================
-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- ============================================================================
-- Fix driver_complete_profile view - adicionar created_at e outras colunas
-- ============================================================================

-- Recriar a view com todas as colunas necessárias
DROP VIEW IF EXISTS driver_complete_profile;

CREATE VIEW driver_complete_profile AS
SELECT
  dd.profile_id,
  p.name          AS display_name,
  p.avatar_url,
  dd.rating       AS avg_rating,
  dd.total_rides,
  dd.is_online,
  dd.is_verified,
  dd.subscription_active,
  dd.vehicle,
  dd.created_at,
  dd.updated_at
FROM driver_data dd
JOIN profiles p ON p.id = dd.profile_id;

-- Garantir permissões
GRANT SELECT ON driver_complete_profile TO authenticated;
GRANT SELECT ON driver_complete_profile TO anon;

-- Testar a view
SELECT * FROM driver_complete_profile ORDER BY created_at DESC LIMIT 5;
