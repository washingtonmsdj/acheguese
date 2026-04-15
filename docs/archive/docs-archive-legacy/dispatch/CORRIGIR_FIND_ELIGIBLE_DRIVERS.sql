-- Corrigir funcao find_eligible_drivers
-- Problema: coluna p.rating nao existe

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
    AND NOT EXISTS (
      SELECT 1 FROM ride_requests rr
      WHERE rr.driver_profile_id = da.profile_id
      AND rr.status IN ('driver_accepted', 'driver_arriving', 'passenger_boarded', 'in_progress')
    )
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
SELECT 'Funcao corrigida com sucesso!' as status;

-- Testar
SELECT * FROM find_eligible_drivers(-12.975, -38.476, 10) LIMIT 5;
