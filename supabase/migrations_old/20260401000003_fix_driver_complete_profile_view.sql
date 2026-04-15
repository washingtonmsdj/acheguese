-- ============================================================================
-- Fix driver_complete_profile view - adicionar created_at
-- ============================================================================

-- Recriar a view com a coluna created_at
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

COMMENT ON VIEW driver_complete_profile IS 
'View consolidada de motoristas para MobilityService. Combina driver_data + profiles com todas as colunas necessárias.';
