-- ============================================================================
-- Fix driver_complete_profile view permissions
-- ============================================================================
-- Views não herdam RLS automaticamente, precisamos dar GRANT explícito
-- ============================================================================

-- Garantir que a view pode ser acessada por usuários autenticados
GRANT SELECT ON driver_complete_profile TO authenticated;
GRANT SELECT ON driver_complete_profile TO anon;

-- Comentário explicativo
COMMENT ON VIEW driver_complete_profile IS 
'View consolidada de motoristas para MobilityService. Combina driver_data + profiles.';
