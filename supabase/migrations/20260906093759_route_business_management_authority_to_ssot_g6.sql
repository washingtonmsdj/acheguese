-- G6 Business management authority consolidation.
-- Active Business commands must use the same Profile management SSOT.

CREATE OR REPLACE FUNCTION private.enqueue_business_claim_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_business_name TEXT := 'empresa';
  v_approved BOOLEAN;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status
     OR NEW.status NOT IN ('approved', 'aprovada', 'rejected', 'rejeitada') THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(btrim(business.business_name), ''), 'empresa')
  INTO v_business_name
  FROM public.business_data business
  WHERE business.id = NEW.business_id;

  v_business_name := COALESCE(v_business_name, 'empresa');
  v_approved := NEW.status IN ('approved', 'aprovada');

  PERFORM private.enqueue_notification(
    NEW.user_id,
    'business_claim_resolved',
    'business_claim',
    NEW.id::TEXT,
    CASE WHEN v_approved THEN 'success' ELSE 'warning' END,
    'transactional',
    'high',
    CASE
      WHEN v_approved THEN 'Reivindicacao aprovada'
      ELSE 'Reivindicacao rejeitada'
    END,
    CASE
      WHEN v_approved THEN
        'Sua reivindicacao da empresa "' || v_business_name || '" foi aprovada!'
      ELSE
        'Sua reivindicacao da empresa "' || v_business_name || '" foi rejeitada.'
    END,
    CASE WHEN v_approved THEN '/central/empresas' ELSE '/conta' END,
    CASE WHEN v_approved THEN 'Gerenciar empresa' ELSE 'Ver conta' END,
    jsonb_build_object(
      'domain', 'business',
      'event', 'business_claim_resolved',
      'business_claim_id', NEW.id,
      'business_id', NEW.business_id,
      'status', NEW.status
    ),
    'business:claim:' || NEW.id::TEXT || ':' || lower(NEW.status),
    now(),
    5::SMALLINT
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.request_account_deletion_for_user(p_user_id uuid, p_reason text DEFAULT NULL::text, p_export_requested boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
 SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_request public.account_deletion_requests%ROWTYPE;
  v_request_exists BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_owned_profile_ids UUID[];
  v_days INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users user_row WHERE user_row.id = p_user_id) THEN
    RAISE EXCEPTION 'account deletion user not found' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_request
  FROM public.account_deletion_requests
  WHERE user_id = p_user_id
  FOR UPDATE;
  v_request_exists := FOUND;

  IF v_request_exists AND v_request.status = 'scheduled' THEN
    UPDATE public.account_deletion_requests
    SET
      reason = LEFT(COALESCE(NULLIF(BTRIM(p_reason), ''), reason), 1000),
      export_requested = export_requested OR COALESCE(p_export_requested, FALSE),
      updated_at = v_now
    WHERE id = v_request.id
    RETURNING * INTO v_request;
  ELSE
    IF v_request_exists AND v_request.status IN ('processing', 'completed') THEN
      RAISE EXCEPTION 'deletion request cannot be restarted from status %', v_request.status
        USING ERRCODE = '55000';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.user_roles role_row
      WHERE role_row.user_id = p_user_id
        AND role_row.role_enum::TEXT IN ('admin', 'super_admin')
        AND role_row.is_active = TRUE
        AND role_row.revoked_at IS NULL
        AND (role_row.expires_at IS NULL OR role_row.expires_at > v_now)
    ) THEN
      RAISE EXCEPTION 'ACCOUNT_DELETION_ADMIN_REQUIRES_DPO' USING ERRCODE = '42501';
    END IF;

    SELECT COALESCE(array_agg(profile.id), ARRAY[]::UUID[])
    INTO v_owned_profile_ids
    FROM public.profiles profile
    WHERE profile.user_id = p_user_id;

    IF EXISTS (
      SELECT 1
      FROM public.business_data business
      JOIN public.profiles profile ON profile.id = business.profile_id
      WHERE profile.user_id = p_user_id
        AND business.status IN ('active', 'pending', 'suspended')
    ) THEN
      RAISE EXCEPTION 'ACCOUNT_DELETION_ACTIVE_BUSINESS' USING ERRCODE = '55000';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.ride_requests ride
      WHERE (
        ride.passenger_profile_id = ANY(v_owned_profile_ids)
        OR ride.driver_profile_id = ANY(v_owned_profile_ids)
      )
        AND ride.status NOT IN (
          'delivered', 'completed', 'cancelled_by_passenger',
          'cancelled_by_driver', 'expired', 'failed', 'cancelled'
        )
    ) THEN
      RAISE EXCEPTION 'ACCOUNT_DELETION_ACTIVE_RIDE' USING ERRCODE = '55000';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.orders order_row
      WHERE (
        order_row.customer_profile_id = ANY(v_owned_profile_ids)
        OR order_row.merchant_profile_id = ANY(v_owned_profile_ids)
        OR order_row.courier_profile_id = ANY(v_owned_profile_ids)
      )
        AND (
          order_row.logistics_status NOT IN ('delivered', 'canceled', 'failed')
          OR order_row.financial_status IN ('pending_payment', 'payout_pending', 'payout_failed')
        )
    ) THEN
      RAISE EXCEPTION 'ACCOUNT_DELETION_ACTIVE_ORDER' USING ERRCODE = '55000';
    END IF;

    IF v_request_exists THEN
      UPDATE public.account_deletion_requests
      SET
        status = 'scheduled',
        reason = LEFT(NULLIF(BTRIM(p_reason), ''), 1000),
        export_requested = COALESCE(p_export_requested, FALSE),
        requested_at = v_now,
        scheduled_purge_at = v_now + INTERVAL '30 days',
        cancelled_at = NULL,
        cancellation_reason = NULL,
        processing_started_at = NULL,
        completed_at = NULL,
        failure_code = NULL,
        profile_state_snapshot = '{}'::JSONB,
        role_state_snapshot = '{}'::JSONB,
        updated_at = v_now
      WHERE id = v_request.id
      RETURNING * INTO v_request;
    ELSE
      INSERT INTO public.account_deletion_requests (
        user_id,
        status,
        reason,
        export_requested,
        requested_at,
        scheduled_purge_at,
        created_at,
        updated_at
      ) VALUES (
        p_user_id,
        'scheduled',
        LEFT(NULLIF(BTRIM(p_reason), ''), 1000),
        COALESCE(p_export_requested, FALSE),
        v_now,
        v_now + INTERVAL '30 days',
        v_now,
        v_now
      )
      RETURNING * INTO v_request;
    END IF;
  END IF;

  v_days := GREATEST(
    0,
    CEIL(EXTRACT(EPOCH FROM (v_request.scheduled_purge_at - clock_timestamp())) / 86400.0)::INTEGER
  );

  RETURN jsonb_build_object(
    'requestId', v_request.id,
    'status', v_request.status,
    'requestedAt', v_request.requested_at,
    'scheduledPurgeAt', v_request.scheduled_purge_at,
    'daysRemaining', v_days,
    'daysUntilPurge', v_days,
    'recoveryPossibleUntil', v_request.scheduled_purge_at,
    'exportRequested', v_request.export_requested
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.request_ad_campaign(payload jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_owner_business_id UUID := NULLIF(payload->>'owner_business_id', '')::UUID;
  v_created_by_profile_id UUID;
  v_business_name TEXT;
  v_advertiser_name TEXT := btrim(COALESCE(payload->>'advertiser_name', ''));
  v_advertiser_contact TEXT := NULLIF(btrim(COALESCE(payload->>'advertiser_contact', '')), '');
  v_title TEXT := btrim(COALESCE(payload->>'title', ''));
  v_description TEXT := NULLIF(btrim(COALESCE(payload->>'description', '')), '');
  v_image_url TEXT := NULLIF(btrim(COALESCE(payload->>'image_url', '')), '');
  v_cta_label TEXT := NULLIF(btrim(COALESCE(payload->>'cta_label', '')), '');
  v_cta_url TEXT := NULLIF(btrim(COALESCE(payload->>'cta_url', '')), '');
  v_placement_key TEXT := COALESCE(NULLIF(payload->>'placement_key', ''), 'sidebar_widget');
  v_territory_ref_id UUID := NULLIF(payload->>'territory_ref_id', '')::UUID;
  v_territory_type TEXT := COALESCE(NULLIF(payload->>'territory_type', ''), 'city');
  v_starts_at TIMESTAMPTZ := COALESCE(NULLIF(payload->>'starts_at', '')::TIMESTAMPTZ, now());
  v_ends_at TIMESTAMPTZ := NULLIF(payload->>'ends_at', '')::TIMESTAMPTZ;
  v_budget_total NUMERIC(12,2) := COALESCE(NULLIF(payload->>'budget_total', '')::NUMERIC, 0);
  v_targets JSONB := CASE
    WHEN jsonb_typeof(payload->'targets') = 'array' THEN payload->'targets'
    ELSE '[]'::jsonb
  END;
  v_campaign_id UUID;
  v_target JSONB;
  v_target_location_id UUID;
  v_target_scope TEXT;
BEGIN
  IF (select auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT bd.profile_id, bd.business_name
    INTO v_created_by_profile_id, v_business_name
  FROM public.business_data bd
  WHERE bd.id = v_owner_business_id
    AND COALESCE(
      private.user_can_manage_profile((select auth.uid()), bd.profile_id),
      false
    );

  IF v_created_by_profile_id IS NULL THEN
    RAISE EXCEPTION 'business_not_authorized' USING ERRCODE = '42501';
  END IF;

  IF v_advertiser_name = '' THEN
    v_advertiser_name := v_business_name;
  END IF;

  IF char_length(v_advertiser_name) < 2 OR char_length(v_advertiser_name) > 120 THEN
    RAISE EXCEPTION 'invalid_advertiser_name' USING ERRCODE = '22023';
  END IF;

  IF char_length(v_title) < 4 OR char_length(v_title) > 90 THEN
    RAISE EXCEPTION 'invalid_title' USING ERRCODE = '22023';
  END IF;

  IF v_description IS NULL OR char_length(v_description) < 8 OR char_length(v_description) > 220 THEN
    RAISE EXCEPTION 'invalid_description' USING ERRCODE = '22023';
  END IF;

  IF v_cta_label IS NOT NULL AND char_length(v_cta_label) > 36 THEN
    RAISE EXCEPTION 'invalid_cta_label' USING ERRCODE = '22023';
  END IF;

  IF v_cta_url IS NOT NULL AND v_cta_url !~ '^(https?://|/)' THEN
    RAISE EXCEPTION 'invalid_cta_url' USING ERRCODE = '22023';
  END IF;

  IF v_image_url IS NOT NULL AND v_image_url !~ '^https?://' THEN
    RAISE EXCEPTION 'invalid_image_url' USING ERRCODE = '22023';
  END IF;

  IF v_placement_key NOT IN ('feed_sponsored', 'sidebar_widget', 'banner_top', 'banner_bottom') THEN
    RAISE EXCEPTION 'invalid_placement_key' USING ERRCODE = '22023';
  END IF;

  IF v_territory_type NOT IN ('city', 'district', 'neighborhood') THEN
    RAISE EXCEPTION 'invalid_territory_type' USING ERRCODE = '22023';
  END IF;

  IF v_budget_total < 0 THEN
    RAISE EXCEPTION 'invalid_budget_total' USING ERRCODE = '22023';
  END IF;

  IF v_ends_at IS NOT NULL AND v_ends_at <= v_starts_at THEN
    RAISE EXCEPTION 'invalid_date_window' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.locations l
    WHERE l.id = v_territory_ref_id
      AND l.status = 'active'
  ) THEN
    RAISE EXCEPTION 'invalid_territory' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.ad_campaigns (
    owner_business_id,
    created_by_profile_id,
    advertiser_contact,
    advertiser_name,
    title,
    description,
    image_url,
    cta_label,
    cta_url,
    placement_key,
    starts_at,
    ends_at,
    budget_total,
    territory_ref_id,
    territory_type,
    status,
    review_status,
    billing_status,
    source,
    priority
  )
  VALUES (
    v_owner_business_id,
    v_created_by_profile_id,
    v_advertiser_contact,
    v_advertiser_name,
    v_title,
    v_description,
    v_image_url,
    v_cta_label,
    v_cta_url,
    v_placement_key,
    v_starts_at,
    v_ends_at,
    v_budget_total,
    v_territory_ref_id,
    v_territory_type,
    'paused',
    'pending',
    'unpaid',
    'self_service',
    0
  )
  RETURNING id INTO v_campaign_id;

  IF jsonb_array_length(v_targets) = 0 THEN
    v_targets := jsonb_build_array(
      jsonb_build_object(
        'location_id', v_territory_ref_id::TEXT,
        'target_scope', v_territory_type
      )
    );
  END IF;

  FOR v_target IN SELECT value FROM jsonb_array_elements(v_targets)
  LOOP
    v_target_location_id := NULLIF(v_target->>'location_id', '')::UUID;
    v_target_scope := COALESCE(NULLIF(v_target->>'target_scope', ''), v_territory_type);

    IF v_target_scope NOT IN ('city', 'district', 'neighborhood') THEN
      RAISE EXCEPTION 'invalid_target_scope' USING ERRCODE = '22023';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.locations l
      WHERE l.id = v_target_location_id
        AND l.status = 'active'
    ) THEN
      RAISE EXCEPTION 'invalid_target_location' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.ad_targets (campaign_id, location_id, target_scope)
    VALUES (v_campaign_id, v_target_location_id, v_target_scope);
  END LOOP;

  RETURN v_campaign_id;
END;
$function$
;

COMMENT ON FUNCTION private.enqueue_business_claim_notification() IS
  'Business claim notification reads the canonical business_data aggregate.';
COMMENT ON FUNCTION public.request_account_deletion_for_user(uuid, text, boolean) IS
  'Schedules deletion only after checking active canonical business_data, rides and orders.';
COMMENT ON FUNCTION public.request_ad_campaign(jsonb) IS
  'Self-service ad request authorized by private.user_can_manage_profile over the Business Profile.';
