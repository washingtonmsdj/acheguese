-- HARDENING: Blindar elegibilidade de motorista
-- Impedir passageiro ser considerado motorista elegível

DROP FUNCTION IF EXISTS find_eligible_drivers(FLOAT, FLOAT, FLOAT);

CREATE OR REPLACE FUNCTION find_eligible_drivers(
  p_origin_lat FLOAT,
  p_origin_lng FLOAT,
  p_max_radius_km FLOAT DEFAULT 10
)
RETURNS TABLE (
  profile_id UUID,
  distance_km FLOAT,
  rating FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.profile_id,
    (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_origin_lat)) * 
          cos(radians(da.current_lat)) * 
          cos(radians(da.current_lng) - radians(p_origin_lng)) + 
          sin(radians(p_origin_lat)) * 
          sin(radians(da.current_lat))
        ))
      )
    ) as distance_km,
    0.0::FLOAT as rating
  FROM driver_availability da
  JOIN profiles p ON p.id = da.profile_id
  WHERE da.is_online = true
    AND da.is_available = true
    AND da.current_lat IS NOT NULL
    AND da.current_lng IS NOT NULL
    -- HARDENING: Garantir que é motorista ativo
    AND p.profile_type = 'driver'  -- Apenas profiles tipo motorista
    AND p.is_active = true          -- Apenas profiles ativos
    AND p.is_suspended = false      -- Não suspensos
    -- HARDENING: Sem corrida ativa
    AND NOT EXISTS (
      SELECT 1 FROM ride_requests rr
      WHERE rr.driver_profile_id = da.profile_id
      AND rr.status IN ('driver_accepted', 'driver_arriving', 'passenger_boarded', 'in_progress')
    )
    -- HARDENING: Filtro de distância no WHERE (não HAVING)
    AND (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_origin_lat)) * 
          cos(radians(da.current_lat)) * 
          cos(radians(da.current_lng) - radians(p_origin_lng)) + 
          sin(radians(p_origin_lat)) * 
          sin(radians(da.current_lat))
        ))
      )
    ) <= p_max_radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validar
SELECT 'Elegibilidade blindada!' as status;

-- Testar: buscar motoristas
SELECT 
  profile_id,
  distance_km,
  rating
FROM find_eligible_drivers(-12.975, -38.476, 10)
LIMIT 5;

-- Verificar que nenhum passageiro está na lista
SELECT 
  'Verificacao: passageiros na lista de motoristas' as check_name,
  COUNT(*) as total
FROM find_eligible_drivers(-12.975, -38.476, 10) f
JOIN profiles p ON p.id = f.profile_id
WHERE p.profile_type != 'driver' OR p.profile_type IS NULL;
-- Deve retornar 0
