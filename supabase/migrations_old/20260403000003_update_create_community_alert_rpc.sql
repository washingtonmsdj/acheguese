-- Migration: update_create_community_alert_rpc
-- Atualiza a RPC create_community_alert para aceitar coordenadas.
-- Inclui validação server-side e fallback para centroide territorial.
--
-- Segurança:
-- - SECURITY DEFINER com SET search_path = '' (padrão mais seguro, recomendado pela Supabase)
-- - Todas as referências de tabela totalmente qualificadas com schema (public.*)
-- - Elimina risco de search_path injection

CREATE OR REPLACE FUNCTION create_community_alert(
  p_title        TEXT,
  p_description  TEXT,
  p_type         TEXT,
  p_location_id  UUID    DEFAULT NULL,
  p_latitude     DECIMAL DEFAULT NULL,
  p_longitude    DECIMAL DEFAULT NULL,
  p_coord_source TEXT    DEFAULT NULL   -- 'exact' | 'geocoded' | 'approximate'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile_id UUID;
  v_alert_id   UUID;
  v_lat        DECIMAL;
  v_lng        DECIMAL;
  v_source     TEXT;
BEGIN
  -- Resolver perfil ativo do usuário autenticado
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'No active profile found';
  END IF;

  -- Validação: lat e lng devem existir juntos ou ambos NULL
  IF (p_latitude IS NULL) != (p_longitude IS NULL) THEN
    RAISE EXCEPTION 'latitude e longitude devem ser ambos NULL ou ambos NOT NULL';
  END IF;

  -- Validação: coordinate_source obrigatório quando há coordenadas
  IF p_latitude IS NOT NULL AND p_coord_source IS NULL THEN
    RAISE EXCEPTION 'coordinate_source é obrigatório quando há coordenadas';
  END IF;

  -- Validação: coordinate_source deve ser valor válido
  IF p_coord_source IS NOT NULL AND p_coord_source NOT IN ('exact', 'geocoded', 'approximate') THEN
    RAISE EXCEPTION 'coordinate_source inválido: %. Valores aceitos: exact, geocoded, approximate', p_coord_source;
  END IF;

  -- Validação: faixas geográficas
  IF p_latitude IS NOT NULL AND (p_latitude < -90 OR p_latitude > 90) THEN
    RAISE EXCEPTION 'latitude fora do intervalo [-90, 90]: %', p_latitude;
  END IF;
  IF p_longitude IS NOT NULL AND (p_longitude < -180 OR p_longitude > 180) THEN
    RAISE EXCEPTION 'longitude fora do intervalo [-180, 180]: %', p_longitude;
  END IF;

  -- Fallback: sem coordenadas diretas mas com location_id → usar centroide territorial
  -- Classificado como 'approximate' — canonical_lat/lng é centro geométrico, não ponto exato
  IF p_latitude IS NULL AND p_location_id IS NOT NULL THEN
    SELECT canonical_lat, canonical_lng
    INTO v_lat, v_lng
    FROM public.locations
    WHERE id = p_location_id;

    IF v_lat IS NOT NULL THEN
      v_source := 'approximate';
    END IF;
  ELSE
    v_lat    := p_latitude;
    v_lng    := p_longitude;
    v_source := p_coord_source;
  END IF;

  INSERT INTO public.community_alerts (
    profile_id, title, description, type, location_id,
    latitude, longitude, coordinate_source
  )
  VALUES (
    v_profile_id, p_title, p_description, p_type, p_location_id,
    v_lat, v_lng, v_source
  )
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$;
