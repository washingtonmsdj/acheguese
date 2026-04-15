-- Reconcile motoboy runtime configuration with Mobility SSOT.
-- Scope:
-- - ride_requests (motoboy fields)
-- - driver_data (capabilities)
-- - driver_availability (operational binding)
-- - pricing_rules (active motoboy rule)
--
-- Safety:
-- - Fully idempotent (IF NOT EXISTS / conditional updates)
-- - Does not create any separate motoboy module/table
-- - Keeps single source of truth in mobility tables

DO $$
BEGIN
  IF to_regclass('public.ride_requests') IS NULL THEN
    RAISE NOTICE 'Skipping ride_requests reconciliation: table does not exist.';
    RETURN;
  END IF;

  ALTER TABLE public.ride_requests
    ADD COLUMN IF NOT EXISTS ride_mode TEXT,
    ADD COLUMN IF NOT EXISTS source_type TEXT,
    ADD COLUMN IF NOT EXISTS source_id UUID,
    ADD COLUMN IF NOT EXISTS recipient_name TEXT,
    ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
    ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
    ADD COLUMN IF NOT EXISTS package_description TEXT,
    ADD COLUMN IF NOT EXISTS package_size TEXT,
    ADD COLUMN IF NOT EXISTS proof_of_delivery JSONB,
    ADD COLUMN IF NOT EXISTS pickup_confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS failed_delivery_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS failed_delivery_reason TEXT;

  UPDATE public.ride_requests
  SET ride_mode = COALESCE(ride_mode, 'ride');

  ALTER TABLE public.ride_requests
    ALTER COLUMN ride_mode SET DEFAULT 'ride',
    ALTER COLUMN ride_mode SET NOT NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ride_requests_ride_mode_check'
      AND conrelid = 'public.ride_requests'::regclass
  ) THEN
    ALTER TABLE public.ride_requests
      ADD CONSTRAINT ride_requests_ride_mode_check
      CHECK (ride_mode IN ('ride', 'motoboy')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ride_requests_source_type_check'
      AND conrelid = 'public.ride_requests'::regclass
  ) THEN
    ALTER TABLE public.ride_requests
      ADD CONSTRAINT ride_requests_source_type_check
      CHECK (
        source_type IS NULL OR
        source_type IN ('passenger', 'business', 'gastronomy', 'service')
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ride_requests_package_size_check'
      AND conrelid = 'public.ride_requests'::regclass
  ) THEN
    ALTER TABLE public.ride_requests
      ADD CONSTRAINT ride_requests_package_size_check
      CHECK (
        package_size IS NULL OR
        package_size IN ('small', 'medium', 'large')
      ) NOT VALID;
  END IF;

  CREATE INDEX IF NOT EXISTS idx_ride_requests_ride_mode_status
    ON public.ride_requests (ride_mode, status);
  CREATE INDEX IF NOT EXISTS idx_ride_requests_source_type_source_id
    ON public.ride_requests (source_type, source_id);
END $$;

DO $$
DECLARE
  v_profile_id UUID;
BEGIN
  IF to_regclass('public.driver_data') IS NULL THEN
    RAISE NOTICE 'Skipping driver_data reconciliation: table does not exist.';
    RETURN;
  END IF;

  ALTER TABLE public.driver_data
    ADD COLUMN IF NOT EXISTS can_do_delivery BOOLEAN,
    ADD COLUMN IF NOT EXISTS can_do_rides BOOLEAN;

  UPDATE public.driver_data
  SET
    can_do_delivery = COALESCE(can_do_delivery, TRUE),
    can_do_rides = COALESCE(can_do_rides, TRUE);

  ALTER TABLE public.driver_data
    ALTER COLUMN can_do_delivery SET DEFAULT TRUE,
    ALTER COLUMN can_do_delivery SET NOT NULL,
    ALTER COLUMN can_do_rides SET DEFAULT TRUE,
    ALTER COLUMN can_do_rides SET NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_driver_data_can_do_delivery
    ON public.driver_data (can_do_delivery);
  CREATE INDEX IF NOT EXISTS idx_driver_data_can_do_rides
    ON public.driver_data (can_do_rides);

  IF NOT EXISTS (
    SELECT 1
    FROM public.driver_data
    WHERE can_do_delivery = TRUE
  ) THEN
    SELECT profile_id
    INTO v_profile_id
    FROM public.driver_data
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_profile_id IS NOT NULL THEN
      UPDATE public.driver_data
      SET can_do_delivery = TRUE
      WHERE profile_id = v_profile_id;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.driver_availability') IS NULL THEN
    RAISE NOTICE 'Skipping driver_availability reconciliation: table does not exist.';
    RETURN;
  END IF;

  ALTER TABLE public.driver_availability
    ADD COLUMN IF NOT EXISTS active_ride_id UUID,
    ADD COLUMN IF NOT EXISTS active_ride_mode TEXT,
    ADD COLUMN IF NOT EXISTS busy_since TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

  UPDATE public.driver_availability
  SET last_seen_at = COALESCE(last_seen_at, updated_at, NOW());

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'driver_availability_active_ride_mode_check'
      AND conrelid = 'public.driver_availability'::regclass
  ) THEN
    ALTER TABLE public.driver_availability
      ADD CONSTRAINT driver_availability_active_ride_mode_check
      CHECK (
        active_ride_mode IS NULL OR
        active_ride_mode IN ('ride', 'motoboy')
      ) NOT VALID;
  END IF;

  CREATE INDEX IF NOT EXISTS idx_driver_availability_active_ride_id
    ON public.driver_availability (active_ride_id);
  CREATE INDEX IF NOT EXISTS idx_driver_availability_active_ride_mode
    ON public.driver_availability (active_ride_mode);
END $$;

DO $$
DECLARE
  v_existing_rule UUID;
BEGIN
  IF to_regclass('public.pricing_rules') IS NULL THEN
    RAISE NOTICE 'Skipping pricing reconciliation: pricing_rules table does not exist.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.pricing_rules
    WHERE mode = 'motoboy'
      AND is_active = TRUE
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_until IS NULL OR valid_until >= NOW())
  ) THEN
    RETURN;
  END IF;

  SELECT id
  INTO v_existing_rule
  FROM public.pricing_rules
  WHERE mode = 'motoboy'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_rule IS NOT NULL THEN
    UPDATE public.pricing_rules
    SET
      is_active = TRUE,
      valid_from = COALESCE(valid_from, NOW()),
      valid_until = NULL,
      updated_at = NOW()
    WHERE id = v_existing_rule;
  ELSE
    INSERT INTO public.pricing_rules (
      mode,
      name,
      base_fare,
      price_per_km,
      price_per_minute,
      minimum_fare,
      is_active,
      metadata
    ) VALUES (
      'motoboy',
      'Motoboy Padrao',
      3.50,
      1.80,
      0.30,
      6.00,
      TRUE,
      '{"description":"Default motoboy pricing rule (idempotent reconciliation)"}'::jsonb
    );
  END IF;
END $$;
