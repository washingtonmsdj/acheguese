-- Business MVP: make Address + Business persistence atomic and idempotent.
--
-- This migration keeps the existing public RPC names as the single service-role
-- write boundary. The wrappers extract broker-only metadata and delegate to
-- private transactional executors. Browser roles never gain access to the
-- operation ledger or the new Address writer.

CREATE TABLE IF NOT EXISTS private.business_operation_receipts (
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_id uuid NOT NULL,
  operation_kind text NOT NULL CHECK (operation_kind IN ('create', 'update')),
  request_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'committed', 'rejected')),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (actor_user_id, operation_id)
);

CREATE INDEX IF NOT EXISTS business_operation_receipts_profile_idx
  ON private.business_operation_receipts(profile_id)
  WHERE profile_id IS NOT NULL;

REVOKE ALL ON TABLE private.business_operation_receipts
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.profile_create_business_address(
  p_actor_user_id uuid,
  p_address_patch jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_unknown_key text;
  v_location_id uuid;
  v_address_id uuid;
  v_address_type text;
  v_precision public.address_precision := 'neighborhood';
  v_latitude numeric;
  v_longitude numeric;
  v_confidence numeric;
BEGIN
  IF p_actor_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users AS actor WHERE actor.id = p_actor_user_id
  ) THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_address_patch IS NULL OR jsonb_typeof(p_address_patch) <> 'object' THEN
    RAISE EXCEPTION 'Invalid address patch';
  END IF;

  SELECT keys.key_name
  INTO v_unknown_key
  FROM jsonb_object_keys(p_address_patch) AS keys(key_name)
  WHERE keys.key_name NOT IN (
    'location_id',
    'postal_code',
    'street',
    'number',
    'complement',
    'address_type',
    'precision',
    'latitude',
    'longitude',
    'geocoded_at',
    'geocoding_source',
    'geocoding_confidence',
    'metadata'
  )
  LIMIT 1;

  IF v_unknown_key IS NOT NULL THEN
    RAISE EXCEPTION 'Unsupported address field: %', v_unknown_key;
  END IF;

  IF COALESCE(p_address_patch->>'location_id', '') !~*
     '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid address location_id';
  END IF;
  v_location_id := (p_address_patch->>'location_id')::uuid;

  IF NOT EXISTS (
    SELECT 1
    FROM public.locations AS location
    WHERE location.id = v_location_id
  ) THEN
    RAISE EXCEPTION 'Address location not found';
  END IF;

  v_address_type := COALESCE(NULLIF(p_address_patch->>'address_type', ''), 'exact');
  IF v_address_type NOT IN ('exact', 'approximate', 'landmark', 'gps_only') THEN
    RAISE EXCEPTION 'Invalid address_type';
  END IF;

  IF v_address_type = 'exact'
     AND NULLIF(btrim(COALESCE(p_address_patch->>'street', '')), '') IS NULL THEN
    RAISE EXCEPTION 'street is required for exact address';
  END IF;

  IF p_address_patch ? 'postal_code'
     AND p_address_patch->'postal_code' <> 'null'::jsonb
     AND COALESCE(p_address_patch->>'postal_code', '') !~ '^[0-9]{5}-?[0-9]{3} THEN
    RAISE EXCEPTION 'Invalid postal_code';
  END IF;

  FOR v_unknown_key IN
    SELECT limits.key_name
    FROM (VALUES
      ('street', 300),
      ('number', 64),
      ('complement', 300),
      ('geocoding_source', 64)
    ) AS limits(key_name, max_length)
    WHERE p_address_patch ? limits.key_name
      AND p_address_patch->limits.key_name <> 'null'::jsonb
      AND (
        jsonb_typeof(p_address_patch->limits.key_name) <> 'string'
        OR length(p_address_patch->>limits.key_name) > limits.max_length
      )
  LOOP
    RAISE EXCEPTION 'Invalid address %', v_unknown_key;
  END LOOP;

  IF p_address_patch ? 'precision'
     AND p_address_patch->'precision' <> 'null'::jsonb THEN
    IF p_address_patch->>'precision' NOT IN (
      'exact', 'interpolated', 'street', 'neighborhood', 'district', 'city'
    ) THEN
      RAISE EXCEPTION 'Invalid address precision';
    END IF;
    v_precision := (p_address_patch->>'precision')::public.address_precision;
  END IF;

  IF p_address_patch ? 'latitude'
     AND p_address_patch->'latitude' <> 'null'::jsonb THEN
    IF jsonb_typeof(p_address_patch->'latitude') <> 'number' THEN
      RAISE EXCEPTION 'Invalid latitude';
    END IF;
    v_latitude := (p_address_patch->>'latitude')::numeric;
    IF v_latitude < -90 OR v_latitude > 90 THEN
      RAISE EXCEPTION 'Invalid latitude';
    END IF;
  END IF;

  IF p_address_patch ? 'longitude'
     AND p_address_patch->'longitude' <> 'null'::jsonb THEN
    IF jsonb_typeof(p_address_patch->'longitude') <> 'number' THEN
      RAISE EXCEPTION 'Invalid longitude';
    END IF;
    v_longitude := (p_address_patch->>'longitude')::numeric;
    IF v_longitude < -180 OR v_longitude > 180 THEN
      RAISE EXCEPTION 'Invalid longitude';
    END IF;
  END IF;

  IF v_address_type = 'gps_only'
     AND (v_latitude IS NULL OR v_longitude IS NULL) THEN
    RAISE EXCEPTION 'gps_only address requires coordinates';
  END IF;

  IF p_address_patch ? 'geocoding_confidence'
     AND p_address_patch->'geocoding_confidence' <> 'null'::jsonb THEN
    IF jsonb_typeof(p_address_patch->'geocoding_confidence') <> 'number' THEN
      RAISE EXCEPTION 'Invalid geocoding_confidence';
    END IF;
    v_confidence := (p_address_patch->>'geocoding_confidence')::numeric;
    IF v_confidence < 0 OR v_confidence > 1 THEN
      RAISE EXCEPTION 'Invalid geocoding_confidence';
    END IF;
  END IF;

  IF p_address_patch ? 'geocoded_at'
     AND p_address_patch->'geocoded_at' <> 'null'::jsonb
     AND jsonb_typeof(p_address_patch->'geocoded_at') <> 'string' THEN
    RAISE EXCEPTION 'Invalid geocoded_at';
  END IF;

  IF p_address_patch ? 'metadata'
     AND p_address_patch->'metadata' <> 'null'::jsonb
     AND jsonb_typeof(p_address_patch->'metadata') <> 'object' THEN
    RAISE EXCEPTION 'Invalid address metadata';
  END IF;

  INSERT INTO public.addresses (
    location_id,
    owner_user_id,
    address_type,
    street,
    number,
    complement,
    postal_code,
    latitude,
    longitude,
    precision,
    geocoding_source,
    geocoding_confidence,
    geocoded_at,
    metadata
  ) VALUES (
    v_location_id,
    p_actor_user_id,
    v_address_type,
    NULLIF(btrim(p_address_patch->>'street'), ''),
    NULLIF(btrim(p_address_patch->>'number'), ''),
    NULLIF(btrim(p_address_patch->>'complement'), ''),
    NULLIF(btrim(p_address_patch->>'postal_code'), ''),
    v_latitude,
    v_longitude,
    v_precision,
    NULLIF(btrim(p_address_patch->>'geocoding_source'), ''),
    v_confidence,
    CASE
      WHEN NULLIF(p_address_patch->>'geocoded_at', '') IS NULL THEN NULL
      ELSE (p_address_patch->>'geocoded_at')::timestamptz
    END,
    COALESCE(p_address_patch->'metadata', '{}'::jsonb)
  )
  RETURNING id INTO v_address_id;

  RETURN v_address_id;
END;
$$;

REVOKE ALL ON FUNCTION private.profile_create_business_address(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_create_business_address(uuid, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION private.profile_execute_business_operation(
  p_operation_kind text,
  p_actor_user_id uuid,
  p_operation_id uuid,
  p_profile_id uuid,
  p_business_patch jsonb,
  p_address_patch jsonb DEFAULT NULL,
  p_contact_channels jsonb DEFAULT NULL,
  p_business_hours jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_inserted boolean := false;
  v_existing private.business_operation_receipts%ROWTYPE;
  v_request_hash text;
  v_effective_patch jsonb;
  v_address_id uuid;
  v_result jsonb;
  v_result_profile_id uuid;
BEGIN
  IF p_operation_kind NOT IN ('create', 'update') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid operation kind');
  END IF;

  IF p_actor_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users AS actor WHERE actor.id = p_actor_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_operation_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'operation_id is required');
  END IF;

  IF p_business_patch IS NULL OR jsonb_typeof(p_business_patch) <> 'object' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid business patch');
  END IF;

  IF p_operation_kind = 'update' AND p_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_id is required');
  END IF;

  v_request_hash := md5(
    jsonb_build_object(
      'kind', p_operation_kind,
      'profile_id', p_profile_id,
      'business_patch', p_business_patch,
      'address_patch', p_address_patch,
      'contact_channels', p_contact_channels,
      'business_hours', p_business_hours
    )::text
  );

  INSERT INTO private.business_operation_receipts (
    actor_user_id,
    operation_id,
    operation_kind,
    request_hash,
    status
  ) VALUES (
    p_actor_user_id,
    p_operation_id,
    p_operation_kind,
    v_request_hash,
    'pending'
  )
  ON CONFLICT (actor_user_id, operation_id) DO NOTHING
  RETURNING true INTO v_inserted;

  IF NOT COALESCE(v_inserted, false) THEN
    SELECT receipt.*
    INTO v_existing
    FROM private.business_operation_receipts AS receipt
    WHERE receipt.actor_user_id = p_actor_user_id
      AND receipt.operation_id = p_operation_id
    FOR UPDATE;

    IF v_existing.operation_kind IS DISTINCT FROM p_operation_kind
       OR v_existing.request_hash IS DISTINCT FROM v_request_hash THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'operation_id was already used with a different payload',
        'operation_id', p_operation_id
      );
    END IF;

    IF v_existing.status IN ('committed', 'rejected') THEN
      RETURN COALESCE(
        v_existing.result,
        jsonb_build_object(
          'success', false,
          'error', 'Stored operation has no receipt',
          'operation_id', p_operation_id
        )
      );
    END IF;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Business operation is still pending',
      'operation_id', p_operation_id
    );
  END IF;

  BEGIN
    v_effective_patch := p_business_patch;

    IF p_address_patch IS NOT NULL THEN
      v_address_id := private.profile_create_business_address(
        p_actor_user_id,
        p_address_patch
      );
      v_effective_patch := v_effective_patch
        || jsonb_build_object(
          'address_id', v_address_id,
          'location_id', (p_address_patch->>'location_id')::uuid
        );
    END IF;

    IF p_operation_kind = 'create' THEN
      v_result := private.profile_create_business(
        p_actor_user_id,
        v_effective_patch,
        p_contact_channels,
        p_business_hours
      );
    ELSE
      v_result := private.profile_patch_business_data(
        p_actor_user_id,
        p_profile_id,
        v_effective_patch,
        p_contact_channels,
        p_business_hours
      );
    END IF;

    IF NOT COALESCE((v_result->>'success')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_result->>'error', 'Business operation rejected');
    END IF;

    v_result_profile_id := NULLIF(v_result->'data'->>'profile_id', '')::uuid;
    IF v_result_profile_id IS NULL THEN
      RAISE EXCEPTION 'Business operation returned no profile receipt';
    END IF;
    v_result := v_result || jsonb_build_object('operation_id', p_operation_id);
  EXCEPTION
    WHEN OTHERS THEN
      v_result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'operation_id', p_operation_id
      );

      UPDATE private.business_operation_receipts AS receipt
      SET status = 'rejected',
          result = v_result,
          updated_at = now()
      WHERE receipt.actor_user_id = p_actor_user_id
        AND receipt.operation_id = p_operation_id;

      RETURN v_result;
  END;

  UPDATE private.business_operation_receipts AS receipt
  SET status = 'committed',
      profile_id = v_result_profile_id,
      address_id = v_address_id,
      result = v_result,
      updated_at = now()
  WHERE receipt.actor_user_id = p_actor_user_id
    AND receipt.operation_id = p_operation_id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION private.profile_execute_business_operation(
  text, uuid, uuid, uuid, jsonb, jsonb, jsonb, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_execute_business_operation(
  text, uuid, uuid, uuid, jsonb, jsonb, jsonb, jsonb
) TO service_role;

CREATE OR REPLACE FUNCTION public.profile_rpc_create_business(
  p_actor_user_id uuid,
  p_business_patch jsonb,
  p_contact_channels jsonb DEFAULT NULL,
  p_business_hours jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.profile_execute_business_operation(
    'create',
    p_actor_user_id,
    COALESCE(
      NULLIF(p_business_patch->>'__operation_id', '')::uuid,
      gen_random_uuid()
    ),
    NULL,
    p_business_patch - '__operation_id' - '__address_patch',
    p_business_patch->'__address_patch',
    p_contact_channels,
    p_business_hours
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_rpc_update_business(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_business_patch jsonb,
  p_contact_channels jsonb DEFAULT NULL,
  p_business_hours jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.profile_execute_business_operation(
    'update',
    p_actor_user_id,
    COALESCE(
      NULLIF(p_business_patch->>'__operation_id', '')::uuid,
      gen_random_uuid()
    ),
    p_profile_id,
    p_business_patch - '__operation_id' - '__address_patch',
    p_business_patch->'__address_patch',
    p_contact_channels,
    p_business_hours
  );
$$;

REVOKE ALL ON FUNCTION public.profile_rpc_create_business(uuid, jsonb, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profile_rpc_update_business(uuid, uuid, jsonb, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.profile_rpc_create_business(uuid, jsonb, jsonb, jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.profile_rpc_update_business(uuid, uuid, jsonb, jsonb, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION public.profile_rpc_get_business_operation(
  p_actor_user_id uuid,
  p_operation_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT CASE
    WHEN receipt.operation_id IS NULL THEN
      jsonb_build_object('found', false, 'operation_id', p_operation_id)
    ELSE
      jsonb_build_object(
        'found', true,
        'operation_id', receipt.operation_id,
        'operation_kind', receipt.operation_kind,
        'status', receipt.status,
        'profile_id', receipt.profile_id,
        'address_id', receipt.address_id,
        'result', receipt.result,
        'created_at', receipt.created_at,
        'updated_at', receipt.updated_at
      )
  END
  FROM (SELECT 1) AS seed
  LEFT JOIN private.business_operation_receipts AS receipt
    ON receipt.actor_user_id = p_actor_user_id
   AND receipt.operation_id = p_operation_id;
$$;

REVOKE ALL ON FUNCTION public.profile_rpc_get_business_operation(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.profile_rpc_get_business_operation(uuid, uuid)
  TO service_role;

COMMENT ON TABLE private.business_operation_receipts
  IS 'Durable idempotency and reconciliation ledger for Business create/update commands.';
COMMENT ON FUNCTION private.profile_execute_business_operation(
  text, uuid, uuid, uuid, jsonb, jsonb, jsonb, jsonb
) IS 'Single transactional Business operation owner: optional Address version + Business commit + durable receipt.';
COMMENT ON FUNCTION public.profile_rpc_get_business_operation(uuid, uuid)
  IS 'Service-role-only reconciliation read for a Business operation owned by the authenticated actor.';
 THEN
    RAISE EXCEPTION 'Invalid postal_code';
  END IF;

  FOR v_unknown_key IN
    SELECT limits.key_name
    FROM (VALUES
      ('street', 300),
      ('number', 64),
      ('complement', 300),
      ('geocoding_source', 64)
    ) AS limits(key_name, max_length)
    WHERE p_address_patch ? limits.key_name
      AND p_address_patch->limits.key_name <> 'null'::jsonb
      AND (
        jsonb_typeof(p_address_patch->limits.key_name) <> 'string'
        OR length(p_address_patch->>limits.key_name) > limits.max_length
      )
  LOOP
    RAISE EXCEPTION 'Invalid address %', v_unknown_key;
  END LOOP;

  IF p_address_patch ? 'precision'
     AND p_address_patch->'precision' <> 'null'::jsonb THEN
    IF p_address_patch->>'precision' NOT IN (
      'exact', 'interpolated', 'street', 'neighborhood', 'district', 'city'
    ) THEN
      RAISE EXCEPTION 'Invalid address precision';
    END IF;
    v_precision := (p_address_patch->>'precision')::public.address_precision;
  END IF;

  IF p_address_patch ? 'latitude'
     AND p_address_patch->'latitude' <> 'null'::jsonb THEN
    IF jsonb_typeof(p_address_patch->'latitude') <> 'number' THEN
      RAISE EXCEPTION 'Invalid latitude';
    END IF;
    v_latitude := (p_address_patch->>'latitude')::numeric;
    IF v_latitude < -90 OR v_latitude > 90 THEN
      RAISE EXCEPTION 'Invalid latitude';
    END IF;
  END IF;

  IF p_address_patch ? 'longitude'
     AND p_address_patch->'longitude' <> 'null'::jsonb THEN
    IF jsonb_typeof(p_address_patch->'longitude') <> 'number' THEN
      RAISE EXCEPTION 'Invalid longitude';
    END IF;
    v_longitude := (p_address_patch->>'longitude')::numeric;
    IF v_longitude < -180 OR v_longitude > 180 THEN
      RAISE EXCEPTION 'Invalid longitude';
    END IF;
  END IF;

  IF v_address_type = 'gps_only'
     AND (v_latitude IS NULL OR v_longitude IS NULL) THEN
    RAISE EXCEPTION 'gps_only address requires coordinates';
  END IF;

  IF p_address_patch ? 'geocoding_confidence'
     AND p_address_patch->'geocoding_confidence' <> 'null'::jsonb THEN
    IF jsonb_typeof(p_address_patch->'geocoding_confidence') <> 'number' THEN
      RAISE EXCEPTION 'Invalid geocoding_confidence';
    END IF;
    v_confidence := (p_address_patch->>'geocoding_confidence')::numeric;
    IF v_confidence < 0 OR v_confidence > 1 THEN
      RAISE EXCEPTION 'Invalid geocoding_confidence';
    END IF;
  END IF;

  IF p_address_patch ? 'geocoded_at'
     AND p_address_patch->'geocoded_at' <> 'null'::jsonb
     AND jsonb_typeof(p_address_patch->'geocoded_at') <> 'string' THEN
    RAISE EXCEPTION 'Invalid geocoded_at';
  END IF;

  IF p_address_patch ? 'metadata'
     AND p_address_patch->'metadata' <> 'null'::jsonb
     AND jsonb_typeof(p_address_patch->'metadata') <> 'object' THEN
    RAISE EXCEPTION 'Invalid address metadata';
  END IF;

  INSERT INTO public.addresses (
    location_id,
    owner_user_id,
    address_type,
    street,
    number,
    complement,
    postal_code,
    latitude,
    longitude,
    precision,
    geocoding_source,
    geocoding_confidence,
    geocoded_at,
    metadata
  ) VALUES (
    v_location_id,
    p_actor_user_id,
    v_address_type,
    NULLIF(btrim(p_address_patch->>'street'), ''),
    NULLIF(btrim(p_address_patch->>'number'), ''),
    NULLIF(btrim(p_address_patch->>'complement'), ''),
    NULLIF(btrim(p_address_patch->>'postal_code'), ''),
    v_latitude,
    v_longitude,
    v_precision,
    NULLIF(btrim(p_address_patch->>'geocoding_source'), ''),
    v_confidence,
    CASE
      WHEN NULLIF(p_address_patch->>'geocoded_at', '') IS NULL THEN NULL
      ELSE (p_address_patch->>'geocoded_at')::timestamptz
    END,
    COALESCE(p_address_patch->'metadata', '{}'::jsonb)
  )
  RETURNING id INTO v_address_id;

  RETURN v_address_id;
END;
$$;

REVOKE ALL ON FUNCTION private.profile_create_business_address(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_create_business_address(uuid, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION private.profile_execute_business_operation(
  p_operation_kind text,
  p_actor_user_id uuid,
  p_operation_id uuid,
  p_profile_id uuid,
  p_business_patch jsonb,
  p_address_patch jsonb DEFAULT NULL,
  p_contact_channels jsonb DEFAULT NULL,
  p_business_hours jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_inserted boolean := false;
  v_existing private.business_operation_receipts%ROWTYPE;
  v_request_hash text;
  v_effective_patch jsonb;
  v_address_id uuid;
  v_result jsonb;
  v_result_profile_id uuid;
BEGIN
  IF p_operation_kind NOT IN ('create', 'update') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid operation kind');
  END IF;

  IF p_actor_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM auth.users AS actor WHERE actor.id = p_actor_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_operation_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'operation_id is required');
  END IF;

  IF p_business_patch IS NULL OR jsonb_typeof(p_business_patch) <> 'object' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid business patch');
  END IF;

  IF p_operation_kind = 'update' AND p_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_id is required');
  END IF;

  v_request_hash := md5(
    jsonb_build_object(
      'kind', p_operation_kind,
      'profile_id', p_profile_id,
      'business_patch', p_business_patch,
      'address_patch', p_address_patch,
      'contact_channels', p_contact_channels,
      'business_hours', p_business_hours
    )::text
  );

  INSERT INTO private.business_operation_receipts (
    actor_user_id,
    operation_id,
    operation_kind,
    request_hash,
    status
  ) VALUES (
    p_actor_user_id,
    p_operation_id,
    p_operation_kind,
    v_request_hash,
    'pending'
  )
  ON CONFLICT (actor_user_id, operation_id) DO NOTHING
  RETURNING true INTO v_inserted;

  IF NOT COALESCE(v_inserted, false) THEN
    SELECT receipt.*
    INTO v_existing
    FROM private.business_operation_receipts AS receipt
    WHERE receipt.actor_user_id = p_actor_user_id
      AND receipt.operation_id = p_operation_id
    FOR UPDATE;

    IF v_existing.operation_kind IS DISTINCT FROM p_operation_kind
       OR v_existing.request_hash IS DISTINCT FROM v_request_hash THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'operation_id was already used with a different payload',
        'operation_id', p_operation_id
      );
    END IF;

    IF v_existing.status IN ('committed', 'rejected') THEN
      RETURN COALESCE(
        v_existing.result,
        jsonb_build_object(
          'success', false,
          'error', 'Stored operation has no receipt',
          'operation_id', p_operation_id
        )
      );
    END IF;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Business operation is still pending',
      'operation_id', p_operation_id
    );
  END IF;

  BEGIN
    v_effective_patch := p_business_patch;

    IF p_address_patch IS NOT NULL THEN
      v_address_id := private.profile_create_business_address(
        p_actor_user_id,
        p_address_patch
      );
      v_effective_patch := v_effective_patch
        || jsonb_build_object(
          'address_id', v_address_id,
          'location_id', (p_address_patch->>'location_id')::uuid
        );
    END IF;

    IF p_operation_kind = 'create' THEN
      v_result := private.profile_create_business(
        p_actor_user_id,
        v_effective_patch,
        p_contact_channels,
        p_business_hours
      );
    ELSE
      v_result := private.profile_patch_business_data(
        p_actor_user_id,
        p_profile_id,
        v_effective_patch,
        p_contact_channels,
        p_business_hours
      );
    END IF;

    IF NOT COALESCE((v_result->>'success')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_result->>'error', 'Business operation rejected');
    END IF;

    v_result_profile_id := NULLIF(v_result->'data'->>'profile_id', '')::uuid;
    v_result := v_result || jsonb_build_object('operation_id', p_operation_id);
  EXCEPTION
    WHEN OTHERS THEN
      v_result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'operation_id', p_operation_id
      );

      UPDATE private.business_operation_receipts AS receipt
      SET status = 'rejected',
          result = v_result,
          updated_at = now()
      WHERE receipt.actor_user_id = p_actor_user_id
        AND receipt.operation_id = p_operation_id;

      RETURN v_result;
  END;

  UPDATE private.business_operation_receipts AS receipt
  SET status = 'committed',
      profile_id = v_result_profile_id,
      address_id = v_address_id,
      result = v_result,
      updated_at = now()
  WHERE receipt.actor_user_id = p_actor_user_id
    AND receipt.operation_id = p_operation_id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION private.profile_execute_business_operation(
  text, uuid, uuid, uuid, jsonb, jsonb, jsonb, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.profile_execute_business_operation(
  text, uuid, uuid, uuid, jsonb, jsonb, jsonb, jsonb
) TO service_role;

CREATE OR REPLACE FUNCTION public.profile_rpc_create_business(
  p_actor_user_id uuid,
  p_business_patch jsonb,
  p_contact_channels jsonb DEFAULT NULL,
  p_business_hours jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.profile_execute_business_operation(
    'create',
    p_actor_user_id,
    COALESCE(
      NULLIF(p_business_patch->>'__operation_id', '')::uuid,
      gen_random_uuid()
    ),
    NULL,
    p_business_patch - '__operation_id' - '__address_patch',
    p_business_patch->'__address_patch',
    p_contact_channels,
    p_business_hours
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_rpc_update_business(
  p_actor_user_id uuid,
  p_profile_id uuid,
  p_business_patch jsonb,
  p_contact_channels jsonb DEFAULT NULL,
  p_business_hours jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.profile_execute_business_operation(
    'update',
    p_actor_user_id,
    COALESCE(
      NULLIF(p_business_patch->>'__operation_id', '')::uuid,
      gen_random_uuid()
    ),
    p_profile_id,
    p_business_patch - '__operation_id' - '__address_patch',
    p_business_patch->'__address_patch',
    p_contact_channels,
    p_business_hours
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_rpc_get_business_operation(
  p_actor_user_id uuid,
  p_operation_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT CASE
    WHEN receipt.operation_id IS NULL THEN
      jsonb_build_object('found', false, 'operation_id', p_operation_id)
    ELSE
      jsonb_build_object(
        'found', true,
        'operation_id', receipt.operation_id,
        'operation_kind', receipt.operation_kind,
        'status', receipt.status,
        'profile_id', receipt.profile_id,
        'address_id', receipt.address_id,
        'result', receipt.result,
        'created_at', receipt.created_at,
        'updated_at', receipt.updated_at
      )
  END
  FROM (SELECT 1) AS seed
  LEFT JOIN private.business_operation_receipts AS receipt
    ON receipt.actor_user_id = p_actor_user_id
   AND receipt.operation_id = p_operation_id;
$$;

REVOKE ALL ON FUNCTION public.profile_rpc_get_business_operation(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.profile_rpc_get_business_operation(uuid, uuid)
  TO service_role;

COMMENT ON TABLE private.business_operation_receipts
  IS 'Durable idempotency and reconciliation ledger for Business create/update commands.';
COMMENT ON FUNCTION private.profile_execute_business_operation(
  text, uuid, uuid, uuid, jsonb, jsonb, jsonb, jsonb
) IS 'Single transactional Business operation owner: optional Address version + Business commit + durable receipt.';
COMMENT ON FUNCTION public.profile_rpc_get_business_operation(uuid, uuid)
  IS 'Service-role-only reconciliation read for a Business operation owned by the authenticated actor.';
