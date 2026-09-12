-- PENDING G83 — NÃO MOVER PARA supabase/migrations NEM APLICAR SEM PREFLIGHT REMOTO.
--
-- Objetivo:
-- - retirar de `update_owned_driver_data` a authority histórica sobre presença;
-- - manter `driver_data` restrito a cadastro/CNH/veículo;
-- - manter `driver_availability` + mobility-rpc como único owner de online,
--   disponibilidade, heartbeat e localização operacional.
--
-- Motivo para permanecer PENDING:
-- - o frontend/main já foi consolidado no SSOT G83;
-- - o remoto respondeu com connection timeout até para `list_migrations`;
-- - sem leitura/preflight do definition/grants atuais não é seguro executar DDL.
--
-- Gate para promoção:
-- 1. banco remoto acessível;
-- 2. capturar pg_get_functiondef(public.update_owned_driver_data(uuid,jsonb));
-- 3. confirmar grants/policies e callers atuais;
-- 4. executar esta mudança como migration canônica;
-- 5. provar que presence keys são rejeitadas pelo RPC legado;
-- 6. provar que edição de CNH/veículo continua funcional;
-- 7. provar go_online/set_available/heartbeat exclusivamente por mobility-rpc/G8.

BEGIN;

CREATE OR REPLACE FUNCTION public.update_owned_driver_data(
  p_profile_id uuid,
  p_updates jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_actor_user_id uuid := auth.uid();
  v_current public.driver_data%ROWTYPE;
  v_updated public.driver_data%ROWTYPE;
  v_key text;
  v_identity_changed boolean := false;
BEGIN
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_updates IS NULL OR pg_catalog.jsonb_typeof(p_updates) <> 'object' THEN
    RAISE EXCEPTION 'Driver update payload must be an object'
      USING ERRCODE = '22023';
  END IF;

  -- G83: presença operacional NÃO pertence mais a este command.
  -- is_online, is_available, last_location_update e current_location devem
  -- falhar aqui em vez de criar uma segunda authority concorrente ao G8.
  FOR v_key IN SELECT pg_catalog.jsonb_object_keys(p_updates)
  LOOP
    IF v_key NOT IN (
      'license_number',
      'license_category',
      'license_expiry',
      'license_state',
      'vehicle_type',
      'vehicle_plate',
      'vehicle_model',
      'vehicle_year',
      'vehicle_color'
    ) THEN
      RAISE EXCEPTION 'Unsupported driver_data field: %', v_key
        USING ERRCODE = '42501';
    END IF;
  END LOOP;

  IF p_updates ? 'vehicle_year'
     AND pg_catalog.jsonb_typeof(p_updates->'vehicle_year') NOT IN ('number', 'null')
  THEN
    RAISE EXCEPTION 'vehicle_year must be numeric or null' USING ERRCODE = '22023';
  END IF;

  IF p_updates ? 'vehicle_year'
     AND pg_catalog.jsonb_typeof(p_updates->'vehicle_year') = 'number'
  THEN
    IF (p_updates->>'vehicle_year')::integer < 1900
       OR (p_updates->>'vehicle_year')::integer >
          EXTRACT(YEAR FROM CURRENT_DATE)::integer + 1
    THEN
      RAISE EXCEPTION 'Invalid vehicle_year' USING ERRCODE = '22023';
    END IF;
  END IF;

  SELECT driver.*
  INTO v_current
  FROM public.driver_data driver
  JOIN public.profiles profile ON profile.id = driver.profile_id
  WHERE driver.profile_id = p_profile_id
    AND profile.user_id = v_actor_user_id
    AND profile.profile_type = 'driver'
  FOR UPDATE OF driver;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Driver data is not owned by the authenticated user'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.driver_data driver
  SET
    license_number = CASE WHEN p_updates ? 'license_number'
      THEN NULLIF(pg_catalog.btrim(p_updates->>'license_number'), '') ELSE driver.license_number END,
    license_category = CASE WHEN p_updates ? 'license_category'
      THEN NULLIF(pg_catalog.btrim(p_updates->>'license_category'), '') ELSE driver.license_category END,
    license_expiry = CASE WHEN p_updates ? 'license_expiry'
      THEN NULLIF(p_updates->>'license_expiry', '')::date ELSE driver.license_expiry END,
    license_state = CASE WHEN p_updates ? 'license_state'
      THEN NULLIF(pg_catalog.upper(pg_catalog.btrim(p_updates->>'license_state')), '') ELSE driver.license_state END,
    vehicle_type = CASE WHEN p_updates ? 'vehicle_type'
      THEN NULLIF(pg_catalog.btrim(p_updates->>'vehicle_type'), '') ELSE driver.vehicle_type END,
    vehicle_plate = CASE WHEN p_updates ? 'vehicle_plate'
      THEN NULLIF(pg_catalog.upper(pg_catalog.btrim(p_updates->>'vehicle_plate')), '') ELSE driver.vehicle_plate END,
    vehicle_model = CASE WHEN p_updates ? 'vehicle_model'
      THEN NULLIF(pg_catalog.btrim(p_updates->>'vehicle_model'), '') ELSE driver.vehicle_model END,
    vehicle_year = CASE WHEN p_updates ? 'vehicle_year'
      THEN NULLIF(p_updates->>'vehicle_year', '')::integer ELSE driver.vehicle_year END,
    vehicle_color = CASE WHEN p_updates ? 'vehicle_color'
      THEN NULLIF(pg_catalog.btrim(p_updates->>'vehicle_color'), '') ELSE driver.vehicle_color END
  WHERE driver.profile_id = p_profile_id
  RETURNING driver.* INTO v_updated;

  IF p_updates ? 'vehicle_type'
     OR p_updates ? 'vehicle_plate'
     OR p_updates ? 'vehicle_model'
     OR p_updates ? 'vehicle_year'
     OR p_updates ? 'vehicle_color'
  THEN
    UPDATE public.driver_data driver
    SET vehicle = pg_catalog.jsonb_strip_nulls(
      pg_catalog.jsonb_build_object(
        'type', v_updated.vehicle_type,
        'plate', v_updated.vehicle_plate,
        'model', v_updated.vehicle_model,
        'year', v_updated.vehicle_year,
        'color', v_updated.vehicle_color
      )
    )
    WHERE driver.profile_id = p_profile_id
    RETURNING driver.* INTO v_updated;
  END IF;

  v_identity_changed :=
    v_updated.license_number IS DISTINCT FROM v_current.license_number
    OR v_updated.license_category IS DISTINCT FROM v_current.license_category
    OR v_updated.license_expiry IS DISTINCT FROM v_current.license_expiry
    OR v_updated.license_state IS DISTINCT FROM v_current.license_state
    OR v_updated.vehicle_type IS DISTINCT FROM v_current.vehicle_type
    OR v_updated.vehicle_plate IS DISTINCT FROM v_current.vehicle_plate
    OR v_updated.vehicle_model IS DISTINCT FROM v_current.vehicle_model
    OR v_updated.vehicle_year IS DISTINCT FROM v_current.vehicle_year
    OR v_updated.vehicle_color IS DISTINCT FROM v_current.vehicle_color;

  IF v_identity_changed THEN
    UPDATE public.driver_data driver
    SET
      is_verified = false,
      documents_verified = false,
      documents_verified_at = NULL,
      background_check_status = 'pending',
      background_check_date = NULL
    WHERE driver.profile_id = p_profile_id
    RETURNING driver.* INTO v_updated;
  END IF;

  RETURN pg_catalog.to_jsonb(v_updated);
END;
$function$;

REVOKE ALL ON FUNCTION public.update_owned_driver_data(uuid, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_owned_driver_data(uuid, jsonb)
  TO authenticated;

COMMENT ON FUNCTION public.update_owned_driver_data(uuid, jsonb) IS
  'G83 owner-bound registration/vehicle mutation only. Operational presence, availability, heartbeat and live location belong exclusively to driver_availability via mobility-rpc.';

COMMIT;

-- PRE/POSTFLIGHT SUGERIDO (executar separadamente no remoto):
--
-- SELECT pg_get_functiondef('public.update_owned_driver_data(uuid,jsonb)'::regprocedure);
--
-- SELECT grantee, privilege_type
-- FROM information_schema.routine_privileges
-- WHERE specific_schema = 'public'
--   AND routine_name = 'update_owned_driver_data'
-- ORDER BY grantee, privilege_type;
--
-- Com JWT authenticated do próprio motorista:
--   update_owned_driver_data(profile, '{"vehicle_color":"Preto"}') -> PASS
--   update_owned_driver_data(profile, '{"is_online":true}') -> 42501
--   update_owned_driver_data(profile, '{"is_available":true}') -> 42501
--   update_owned_driver_data(profile, '{"current_location":{"lat":0,"lng":0}}') -> 42501
--
-- Depois provar go_online/set_available/heartbeat via mobility-rpc no mesmo perfil.
