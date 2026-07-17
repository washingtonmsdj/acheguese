-- Normalize the Safety emergency alert contract and move Safety notifications
-- to trusted database producers. The browser may select one of its profiles,
-- but RLS verifies ownership and never accepts a notification recipient.

CREATE TABLE IF NOT EXISTS public.safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.ride_requests(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'reported',
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.safety_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.safety_incidents(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ride_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.ride_requests(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.safety_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  performed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.emergency_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.emergency_alerts(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.emergency_contacts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  target TEXT NOT NULL,
  error_message TEXT,
  metadata JSONB,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_safety_incidents_reporter_created
  ON public.safety_incidents (reported_by, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_ride
  ON public.safety_incidents (ride_id, created_at DESC)
  WHERE ride_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_safety_evidence_incident_created
  ON public.safety_evidence (incident_id, created_at DESC, id DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ride_shares_share_token
  ON public.ride_shares (share_token);
CREATE INDEX IF NOT EXISTS idx_ride_shares_creator_created
  ON public.ride_shares (created_by, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_safety_audit_entity_created
  ON public.safety_audit_log (entity_type, entity_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_profile_active
  ON public.emergency_contacts (profile_id, is_active, is_primary DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_delivery_rate_limit
  ON public.emergency_delivery_log (alert_id, contact_id, channel, created_at DESC);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'emergency_alerts'
      AND column_name = 'type'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'emergency_alerts'
      AND column_name = 'alert_type'
  ) THEN
    ALTER TABLE public.emergency_alerts RENAME COLUMN type TO alert_type;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'emergency_alerts'
      AND column_name = 'message'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'emergency_alerts'
      AND column_name = 'description'
  ) THEN
    ALTER TABLE public.emergency_alerts RENAME COLUMN message TO description;
  END IF;
END;
$$;

ALTER TABLE public.emergency_alerts
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS accuracy DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

ALTER TABLE public.emergency_alerts
  DROP CONSTRAINT IF EXISTS emergency_alerts_profile_required,
  DROP CONSTRAINT IF EXISTS emergency_alerts_alert_type_check,
  DROP CONSTRAINT IF EXISTS emergency_alerts_status_check,
  DROP CONSTRAINT IF EXISTS emergency_alerts_description_length,
  DROP CONSTRAINT IF EXISTS emergency_alerts_location_check,
  DROP CONSTRAINT IF EXISTS emergency_alerts_accuracy_check,
  DROP CONSTRAINT IF EXISTS emergency_alerts_metadata_contract;

ALTER TABLE public.emergency_alerts
  ADD CONSTRAINT emergency_alerts_profile_required CHECK (
    profile_id IS NOT NULL
  ) NOT VALID,
  ADD CONSTRAINT emergency_alerts_alert_type_check CHECK (
    alert_type IN ('sos', 'emergency_button', 'automatic', 'manual', 'panic')
  ) NOT VALID,
  ADD CONSTRAINT emergency_alerts_status_check CHECK (
    status IN ('active', 'acknowledged', 'resolved', 'false_alarm')
  ) NOT VALID,
  ADD CONSTRAINT emergency_alerts_description_length CHECK (
    description IS NULL
    OR (
      char_length(description) BETWEEN 1 AND 1000
      AND description !~ '[<>]'
    )
  ) NOT VALID,
  ADD CONSTRAINT emergency_alerts_location_check CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (
      latitude BETWEEN -90 AND 90
      AND longitude BETWEEN -180 AND 180
    )
  ) NOT VALID,
  ADD CONSTRAINT emergency_alerts_accuracy_check CHECK (
    accuracy IS NULL OR accuracy BETWEEN 0 AND 100000
  ) NOT VALID,
  ADD CONSTRAINT emergency_alerts_metadata_contract CHECK (
    jsonb_typeof(metadata) = 'object'
    AND pg_column_size(metadata) <= 32768
  ) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_profile_status_created
  ON public.emergency_alerts (profile_id, status, created_at DESC, id DESC);

ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_delivery_log ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_policy RECORD;
BEGIN
  FOR v_policy IN
    SELECT policy.schemaname, policy.tablename, policy.policyname
    FROM pg_policies policy
    WHERE policy.schemaname = 'public'
      AND policy.tablename IN (
        'emergency_alerts',
        'emergency_contacts',
        'emergency_delivery_log',
        'safety_incidents',
        'safety_evidence',
        'ride_shares',
        'safety_audit_log'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      v_policy.policyname,
      v_policy.schemaname,
      v_policy.tablename
    );
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS "Admins view emergency alerts" ON public.emergency_alerts;
DROP POLICY IF EXISTS "Authenticated insert emergency alerts" ON public.emergency_alerts;
DROP POLICY IF EXISTS emergency_alerts_select_authorized ON public.emergency_alerts;
DROP POLICY IF EXISTS emergency_alerts_insert_own ON public.emergency_alerts;

CREATE POLICY emergency_alerts_select_authorized
  ON public.emergency_alerts
  FOR SELECT
  TO authenticated
  USING (private.auth_can_access_profile(emergency_alerts.profile_id));

CREATE POLICY emergency_alerts_insert_own
  ON public.emergency_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = emergency_alerts.profile_id
        AND profile.user_id = auth.uid()
    )
    AND (
      emergency_alerts.ride_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.ride_requests ride
        WHERE ride.id = emergency_alerts.ride_id
          AND emergency_alerts.profile_id IN (
            ride.passenger_profile_id,
            ride.driver_profile_id
          )
      )
    )
  );

REVOKE ALL ON TABLE public.emergency_alerts FROM anon;
REVOKE ALL ON TABLE public.emergency_alerts FROM authenticated;
GRANT SELECT, INSERT ON TABLE public.emergency_alerts TO authenticated;
GRANT ALL ON TABLE public.emergency_alerts TO service_role;

ALTER TABLE public.emergency_contacts
  DROP CONSTRAINT IF EXISTS emergency_contacts_name_contract,
  DROP CONSTRAINT IF EXISTS emergency_contacts_target_contract,
  DROP CONSTRAINT IF EXISTS emergency_contacts_relationship_contract,
  DROP CONSTRAINT IF EXISTS emergency_contacts_metadata_contract;

ALTER TABLE public.emergency_contacts
  ADD CONSTRAINT emergency_contacts_name_contract CHECK (
    char_length(btrim(name)) BETWEEN 1 AND 100
    AND name !~ '[<>]'
  ) NOT VALID,
  ADD CONSTRAINT emergency_contacts_target_contract CHECK (
    char_length(btrim(phone)) BETWEEN 3 AND 254
    AND phone !~ '[<>]'
  ) NOT VALID,
  ADD CONSTRAINT emergency_contacts_relationship_contract CHECK (
    relationship IS NULL
    OR (
      char_length(btrim(relationship)) BETWEEN 1 AND 80
      AND relationship !~ '[<>]'
    )
  ) NOT VALID,
  ADD CONSTRAINT emergency_contacts_metadata_contract CHECK (
    metadata IS NULL
    OR (
      jsonb_typeof(metadata) = 'object'
      AND pg_column_size(metadata) <= 16384
    )
  ) NOT VALID;

CREATE POLICY emergency_contacts_select_own
  ON public.emergency_contacts
  FOR SELECT
  TO authenticated
  USING (private.auth_can_access_profile(emergency_contacts.profile_id));

CREATE POLICY emergency_contacts_insert_own
  ON public.emergency_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = emergency_contacts.profile_id
        AND profile.user_id = auth.uid()
    )
  );

CREATE POLICY emergency_contacts_update_own
  ON public.emergency_contacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = emergency_contacts.profile_id
        AND profile.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = emergency_contacts.profile_id
        AND profile.user_id = auth.uid()
    )
  );

REVOKE ALL ON TABLE public.emergency_contacts FROM anon;
REVOKE ALL ON TABLE public.emergency_contacts FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.emergency_contacts TO authenticated;
GRANT ALL ON TABLE public.emergency_contacts TO service_role;

ALTER TABLE public.emergency_delivery_log
  DROP CONSTRAINT IF EXISTS emergency_delivery_channel_contract,
  DROP CONSTRAINT IF EXISTS emergency_delivery_status_contract,
  DROP CONSTRAINT IF EXISTS emergency_delivery_target_contract,
  DROP CONSTRAINT IF EXISTS emergency_delivery_error_contract,
  DROP CONSTRAINT IF EXISTS emergency_delivery_metadata_contract;

ALTER TABLE public.emergency_delivery_log
  ADD CONSTRAINT emergency_delivery_channel_contract CHECK (
    channel IN ('email', 'sms', 'push', 'whatsapp')
  ) NOT VALID,
  ADD CONSTRAINT emergency_delivery_status_contract CHECK (
    status IN ('pending', 'sent', 'delivered', 'failed')
  ) NOT VALID,
  ADD CONSTRAINT emergency_delivery_target_contract CHECK (
    char_length(btrim(target)) BETWEEN 3 AND 254
    AND target !~ '[<>]'
  ) NOT VALID,
  ADD CONSTRAINT emergency_delivery_error_contract CHECK (
    error_message IS NULL OR char_length(error_message) <= 1000
  ) NOT VALID,
  ADD CONSTRAINT emergency_delivery_metadata_contract CHECK (
    metadata IS NULL
    OR (
      jsonb_typeof(metadata) = 'object'
      AND pg_column_size(metadata) <= 16384
    )
  ) NOT VALID;

REVOKE ALL ON TABLE public.emergency_delivery_log FROM anon, authenticated;
GRANT ALL ON TABLE public.emergency_delivery_log TO service_role;

-- security-authority: internal-function private.guard_safety_rate_limit
CREATE OR REPLACE FUNCTION private.guard_safety_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_profile_id UUID;
  v_window INTERVAL;
  v_limit INTEGER;
  v_recent_count INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'emergency_alerts' THEN
    v_profile_id := NEW.profile_id;
    v_window := INTERVAL '5 minutes';
    v_limit := 10;
  ELSIF TG_TABLE_NAME = 'safety_incidents' THEN
    v_profile_id := NEW.reported_by;
    v_window := INTERVAL '1 hour';
    v_limit := 20;
  ELSE
    RAISE EXCEPTION 'unsupported_safety_rate_limit_source'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    TG_TABLE_NAME || ':' || v_profile_id::TEXT,
    0
  ));

  EXECUTE format(
    'SELECT count(*) FROM public.%I WHERE %I = $1 AND created_at >= now() - $2',
    TG_TABLE_NAME,
    CASE
      WHEN TG_TABLE_NAME = 'emergency_alerts' THEN 'profile_id'
      ELSE 'reported_by'
    END
  )
  INTO v_recent_count
  USING v_profile_id, v_window;

  IF v_recent_count >= v_limit THEN
    RAISE EXCEPTION 'safety_rate_limit_exceeded'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_safety_rate_limit()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_emergency_alert_rate_limit
  ON public.emergency_alerts;
CREATE TRIGGER trg_guard_emergency_alert_rate_limit
  BEFORE INSERT ON public.emergency_alerts
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_safety_rate_limit();

ALTER TABLE public.safety_incidents
  DROP CONSTRAINT IF EXISTS safety_incidents_type_check,
  DROP CONSTRAINT IF EXISTS safety_incidents_severity_check,
  DROP CONSTRAINT IF EXISTS safety_incidents_status_check,
  DROP CONSTRAINT IF EXISTS safety_incidents_description_contract,
  DROP CONSTRAINT IF EXISTS safety_incidents_location_check,
  DROP CONSTRAINT IF EXISTS safety_incidents_metadata_contract;

ALTER TABLE public.safety_incidents
  ADD CONSTRAINT safety_incidents_type_check CHECK (
    incident_type IN (
      'harassment',
      'unsafe_driving',
      'route_deviation',
      'vehicle_issue',
      'accident',
      'other'
    )
  ) NOT VALID,
  ADD CONSTRAINT safety_incidents_severity_check CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ) NOT VALID,
  ADD CONSTRAINT safety_incidents_status_check CHECK (
    status IN ('reported', 'investigating', 'resolved', 'dismissed')
  ) NOT VALID,
  ADD CONSTRAINT safety_incidents_description_contract CHECK (
    char_length(btrim(description)) BETWEEN 10 AND 2000
    AND description !~ '[<>]'
  ) NOT VALID,
  ADD CONSTRAINT safety_incidents_location_check CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (
      latitude BETWEEN -90 AND 90
      AND longitude BETWEEN -180 AND 180
    )
  ) NOT VALID,
  ADD CONSTRAINT safety_incidents_metadata_contract CHECK (
    metadata IS NULL
    OR (
      jsonb_typeof(metadata) = 'object'
      AND pg_column_size(metadata) <= 32768
    )
  ) NOT VALID;

ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS safety_incidents_select_authorized ON public.safety_incidents;
DROP POLICY IF EXISTS safety_incidents_insert_own ON public.safety_incidents;

CREATE POLICY safety_incidents_select_authorized
  ON public.safety_incidents
  FOR SELECT
  TO authenticated
  USING (private.auth_can_access_profile(safety_incidents.reported_by));

CREATE POLICY safety_incidents_insert_own
  ON public.safety_incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = safety_incidents.reported_by
        AND profile.user_id = auth.uid()
    )
    AND (
      safety_incidents.ride_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.ride_requests ride
        WHERE ride.id = safety_incidents.ride_id
          AND safety_incidents.reported_by IN (
            ride.passenger_profile_id,
            ride.driver_profile_id
          )
      )
    )
  );

REVOKE ALL ON TABLE public.safety_incidents FROM anon;
REVOKE ALL ON TABLE public.safety_incidents FROM authenticated;
GRANT SELECT, INSERT ON TABLE public.safety_incidents TO authenticated;
GRANT ALL ON TABLE public.safety_incidents TO service_role;

DROP TRIGGER IF EXISTS trg_guard_safety_incident_rate_limit
  ON public.safety_incidents;
CREATE TRIGGER trg_guard_safety_incident_rate_limit
  BEFORE INSERT ON public.safety_incidents
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_safety_rate_limit();

ALTER TABLE public.safety_evidence
  DROP CONSTRAINT IF EXISTS safety_evidence_type_contract,
  DROP CONSTRAINT IF EXISTS safety_evidence_url_contract,
  DROP CONSTRAINT IF EXISTS safety_evidence_name_contract,
  DROP CONSTRAINT IF EXISTS safety_evidence_size_contract,
  DROP CONSTRAINT IF EXISTS safety_evidence_mime_contract,
  DROP CONSTRAINT IF EXISTS safety_evidence_metadata_contract;

ALTER TABLE public.safety_evidence
  ADD CONSTRAINT safety_evidence_type_contract CHECK (
    evidence_type IN ('photo', 'video', 'audio', 'screenshot', 'document')
  ) NOT VALID,
  ADD CONSTRAINT safety_evidence_url_contract CHECK (
    char_length(file_url) BETWEEN 1 AND 2048
    AND file_url !~ '[<>[:space:]]'
  ) NOT VALID,
  ADD CONSTRAINT safety_evidence_name_contract CHECK (
    char_length(btrim(file_name)) BETWEEN 1 AND 255
    AND file_name !~ '[<>[:cntrl:]]'
  ) NOT VALID,
  ADD CONSTRAINT safety_evidence_size_contract CHECK (
    file_size BETWEEN 1 AND 10485760
  ) NOT VALID,
  ADD CONSTRAINT safety_evidence_mime_contract CHECK (
    mime_type ~ '^(image|video|audio)/[A-Za-z0-9.+-]+$'
    OR mime_type = 'application/pdf'
  ) NOT VALID,
  ADD CONSTRAINT safety_evidence_metadata_contract CHECK (
    metadata IS NULL
    OR (
      jsonb_typeof(metadata) = 'object'
      AND pg_column_size(metadata) <= 16384
    )
  ) NOT VALID;

CREATE POLICY safety_evidence_select_authorized
  ON public.safety_evidence
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.safety_incidents incident
      WHERE incident.id = safety_evidence.incident_id
        AND private.auth_can_access_profile(incident.reported_by)
    )
  );

CREATE POLICY safety_evidence_insert_own
  ON public.safety_evidence
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = safety_evidence.uploaded_by
        AND profile.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.safety_incidents incident
      WHERE incident.id = safety_evidence.incident_id
        AND incident.reported_by = safety_evidence.uploaded_by
    )
  );

REVOKE ALL ON TABLE public.safety_evidence FROM anon;
REVOKE ALL ON TABLE public.safety_evidence FROM authenticated;
GRANT SELECT, INSERT ON TABLE public.safety_evidence TO authenticated;
GRANT ALL ON TABLE public.safety_evidence TO service_role;

ALTER TABLE public.ride_shares
  DROP CONSTRAINT IF EXISTS ride_shares_token_contract,
  DROP CONSTRAINT IF EXISTS ride_shares_status_check,
  DROP CONSTRAINT IF EXISTS ride_shares_expiration_contract;

ALTER TABLE public.ride_shares
  ADD CONSTRAINT ride_shares_token_contract CHECK (
    share_token ~ '^[A-Za-z0-9]{32}$'
  ) NOT VALID,
  ADD CONSTRAINT ride_shares_status_check CHECK (
    status IN ('active', 'expired', 'revoked')
  ) NOT VALID,
  ADD CONSTRAINT ride_shares_expiration_contract CHECK (
    expires_at > created_at
    AND expires_at <= created_at + INTERVAL '7 days'
  ) NOT VALID;

ALTER TABLE public.ride_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY ride_shares_select_own
  ON public.ride_shares
  FOR SELECT
  TO authenticated
  USING (private.auth_can_access_profile(ride_shares.created_by));

CREATE POLICY ride_shares_insert_own
  ON public.ride_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ride_shares.expires_at > now()
    AND ride_shares.expires_at <= now() + INTERVAL '7 days'
    AND EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = ride_shares.created_by
        AND profile.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.ride_requests ride
      WHERE ride.id = ride_shares.ride_id
        AND ride_shares.created_by IN (
          ride.passenger_profile_id,
          ride.driver_profile_id
        )
    )
  );

REVOKE ALL ON TABLE public.ride_shares FROM anon;
REVOKE ALL ON TABLE public.ride_shares FROM authenticated;
GRANT SELECT, INSERT ON TABLE public.ride_shares TO authenticated;
GRANT ALL ON TABLE public.ride_shares TO service_role;

ALTER TABLE public.safety_audit_log
  DROP CONSTRAINT IF EXISTS safety_audit_action_contract,
  DROP CONSTRAINT IF EXISTS safety_audit_entity_contract,
  DROP CONSTRAINT IF EXISTS safety_audit_metadata_contract;

ALTER TABLE public.safety_audit_log
  ADD CONSTRAINT safety_audit_action_contract CHECK (
    action ~ '^[a-z0-9_:-]{1,80}$'
  ) NOT VALID,
  ADD CONSTRAINT safety_audit_entity_contract CHECK (
    entity_type IN ('alert', 'incident', 'share', 'evidence')
  ) NOT VALID,
  ADD CONSTRAINT safety_audit_metadata_contract CHECK (
    metadata IS NULL
    OR (
      jsonb_typeof(metadata) = 'object'
      AND pg_column_size(metadata) <= 32768
    )
  ) NOT VALID;

ALTER TABLE public.safety_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY safety_audit_log_select_authorized
  ON public.safety_audit_log
  FOR SELECT
  TO authenticated
  USING (private.auth_can_access_profile(performed_by));

REVOKE ALL ON TABLE public.safety_audit_log FROM anon, authenticated;
GRANT SELECT ON TABLE public.safety_audit_log TO authenticated;
GRANT ALL ON TABLE public.safety_audit_log TO service_role;

-- security-authority: internal-function private.audit_safety_insert
CREATE OR REPLACE FUNCTION private.audit_safety_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_profile_id UUID;
  v_action TEXT;
  v_entity_type TEXT;
  v_metadata JSONB;
BEGIN
  IF TG_TABLE_NAME = 'emergency_alerts' THEN
    v_profile_id := NEW.profile_id;
    v_action := 'alert_created';
    v_entity_type := 'alert';
    v_metadata := jsonb_build_object(
      'alert_type', NEW.alert_type,
      'ride_id', NEW.ride_id
    );
  ELSIF TG_TABLE_NAME = 'safety_incidents' THEN
    v_profile_id := NEW.reported_by;
    v_action := 'incident_reported';
    v_entity_type := 'incident';
    v_metadata := jsonb_build_object(
      'incident_type', NEW.incident_type,
      'severity', NEW.severity,
      'ride_id', NEW.ride_id
    );
  ELSIF TG_TABLE_NAME = 'ride_shares' THEN
    v_profile_id := NEW.created_by;
    v_action := 'share_created';
    v_entity_type := 'share';
    v_metadata := jsonb_build_object(
      'ride_id', NEW.ride_id,
      'expires_at', NEW.expires_at
    );
  ELSIF TG_TABLE_NAME = 'safety_evidence' THEN
    v_profile_id := NEW.uploaded_by;
    v_action := 'evidence_uploaded';
    v_entity_type := 'evidence';
    v_metadata := jsonb_build_object(
      'incident_id', NEW.incident_id,
      'evidence_type', NEW.evidence_type,
      'mime_type', NEW.mime_type,
      'file_size', NEW.file_size
    );
  ELSE
    RAISE EXCEPTION 'unsupported_safety_audit_source'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.safety_audit_log (
    action,
    entity_type,
    entity_id,
    performed_by,
    metadata
  ) VALUES (
    v_action,
    v_entity_type,
    NEW.id,
    v_profile_id,
    jsonb_strip_nulls(v_metadata)
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.audit_safety_insert()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_audit_emergency_alert_insert
  ON public.emergency_alerts;
CREATE TRIGGER trg_audit_emergency_alert_insert
  AFTER INSERT ON public.emergency_alerts
  FOR EACH ROW
  EXECUTE FUNCTION private.audit_safety_insert();

DROP TRIGGER IF EXISTS trg_audit_safety_incident_insert
  ON public.safety_incidents;
CREATE TRIGGER trg_audit_safety_incident_insert
  AFTER INSERT ON public.safety_incidents
  FOR EACH ROW
  EXECUTE FUNCTION private.audit_safety_insert();

DROP TRIGGER IF EXISTS trg_audit_ride_share_insert
  ON public.ride_shares;
CREATE TRIGGER trg_audit_ride_share_insert
  AFTER INSERT ON public.ride_shares
  FOR EACH ROW
  EXECUTE FUNCTION private.audit_safety_insert();

DROP TRIGGER IF EXISTS trg_audit_safety_evidence_insert
  ON public.safety_evidence;
CREATE TRIGGER trg_audit_safety_evidence_insert
  AFTER INSERT ON public.safety_evidence
  FOR EACH ROW
  EXECUTE FUNCTION private.audit_safety_insert();

-- security-authority: internal-function private.enqueue_safety_notification
CREATE OR REPLACE FUNCTION private.enqueue_safety_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_profile_id UUID;
  v_recipient_user_id UUID;
  v_event_type TEXT;
  v_aggregate_type TEXT;
  v_notification_type TEXT;
  v_priority TEXT;
  v_title TEXT;
  v_message TEXT;
  v_metadata JSONB;
BEGIN
  IF TG_TABLE_NAME = 'emergency_alerts' THEN
    v_profile_id := NEW.profile_id;
    v_event_type := 'safety_emergency_alert_created';
    v_aggregate_type := 'emergency_alert';
    v_notification_type := 'error';
    v_priority := 'urgent';
    v_title := 'Alerta de emergencia acionado';
    v_message := 'Seu alerta foi registrado e a trilha de seguranca foi iniciada.';
    v_metadata := jsonb_build_object(
      'domain', 'safety',
      'event', v_event_type,
      'alert_id', NEW.id,
      'alert_type', NEW.alert_type,
      'ride_id', NEW.ride_id
    );
  ELSIF TG_TABLE_NAME = 'safety_incidents' THEN
    v_profile_id := NEW.reported_by;
    v_event_type := 'safety_incident_reported';
    v_aggregate_type := 'safety_incident';
    v_notification_type := 'warning';
    v_priority := CASE
      WHEN NEW.severity IN ('high', 'critical') THEN 'high'
      ELSE 'medium'
    END;
    v_title := 'Incidente de seguranca registrado';
    v_message := 'Seu relato foi registrado para analise.';
    v_metadata := jsonb_build_object(
      'domain', 'safety',
      'event', v_event_type,
      'incident_id', NEW.id,
      'incident_type', NEW.incident_type,
      'severity', NEW.severity,
      'ride_id', NEW.ride_id
    );
  ELSIF TG_TABLE_NAME = 'ride_shares' THEN
    v_profile_id := NEW.created_by;
    v_event_type := 'safety_ride_share_created';
    v_aggregate_type := 'ride_share';
    v_notification_type := 'info';
    v_priority := 'medium';
    v_title := 'Compartilhamento de viagem criado';
    v_message := 'O link de acompanhamento foi criado com sucesso.';
    v_metadata := jsonb_build_object(
      'domain', 'safety',
      'event', v_event_type,
      'share_id', NEW.id,
      'ride_id', NEW.ride_id,
      'expires_at', NEW.expires_at
    );
  ELSE
    RAISE EXCEPTION 'unsupported_safety_notification_source'
      USING ERRCODE = '22023';
  END IF;

  SELECT profile.user_id
  INTO v_recipient_user_id
  FROM public.profiles profile
  WHERE profile.id = v_profile_id;

  IF v_recipient_user_id IS NOT NULL THEN
    PERFORM private.enqueue_notification(
      v_recipient_user_id,
      v_event_type,
      v_aggregate_type,
      NEW.id::TEXT,
      v_notification_type,
      'system',
      v_priority,
      v_title,
      v_message,
      NULL,
      NULL,
      jsonb_strip_nulls(v_metadata),
      'safety:' || v_aggregate_type || ':' || NEW.id::TEXT || ':created',
      now(),
      5::SMALLINT
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enqueue_safety_notification()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enqueue_emergency_alert_notification
  ON public.emergency_alerts;
CREATE TRIGGER trg_enqueue_emergency_alert_notification
  AFTER INSERT ON public.emergency_alerts
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_safety_notification();

DROP TRIGGER IF EXISTS trg_enqueue_safety_incident_notification
  ON public.safety_incidents;
CREATE TRIGGER trg_enqueue_safety_incident_notification
  AFTER INSERT ON public.safety_incidents
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_safety_notification();

DROP TRIGGER IF EXISTS trg_enqueue_ride_share_notification
  ON public.ride_shares;
CREATE TRIGGER trg_enqueue_ride_share_notification
  AFTER INSERT ON public.ride_shares
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_safety_notification();

-- security-authority: privileged-function update_safety_emergency_alert_status
CREATE OR REPLACE FUNCTION public.update_safety_emergency_alert_status(
  p_alert_id UUID,
  p_status TEXT,
  p_actor_profile_id UUID
)
RETURNS public.emergency_alerts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_alert public.emergency_alerts%ROWTYPE;
  v_is_owner BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  IF auth.uid() IS NULL
     OR p_actor_profile_id IS NULL
     OR p_status NOT IN ('acknowledged', 'resolved', 'false_alarm') THEN
    RAISE EXCEPTION 'invalid_safety_alert_status_request'
      USING ERRCODE = '22023';
  END IF;

  SELECT alert.*
  INTO v_alert
  FROM public.emergency_alerts alert
  WHERE alert.id = p_alert_id
  FOR UPDATE;

  IF v_alert.id IS NULL THEN
    RAISE EXCEPTION 'safety_alert_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles actor
    WHERE actor.id = p_actor_profile_id
      AND actor.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'invalid_safety_actor_profile'
      USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = v_alert.profile_id
      AND profile.user_id = auth.uid()
  ) INTO v_is_owner;
  v_is_admin := COALESCE(private.is_admin_from_roles(auth.uid()), false);

  IF NOT v_is_admin AND NOT (v_is_owner AND p_status = 'false_alarm') THEN
    RAISE EXCEPTION 'forbidden_safety_alert_transition'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.emergency_alerts
  SET status = p_status,
      resolved_at = CASE
        WHEN p_status IN ('resolved', 'false_alarm') THEN now()
        ELSE NULL
      END,
      updated_at = now()
  WHERE id = p_alert_id
  RETURNING * INTO v_alert;

  INSERT INTO public.safety_audit_log (
    action,
    entity_type,
    entity_id,
    performed_by,
    metadata
  ) VALUES (
    CASE
      WHEN p_status = 'acknowledged' THEN 'alert_acknowledged'
      ELSE 'alert_resolved'
    END,
    'alert',
    p_alert_id,
    p_actor_profile_id,
    jsonb_build_object(
      'new_status', p_status,
      'actor_user_id', auth.uid()
    )
  );

  RETURN v_alert;
END;
$$;

REVOKE ALL ON FUNCTION public.update_safety_emergency_alert_status(UUID, TEXT, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_safety_emergency_alert_status(UUID, TEXT, UUID)
  TO authenticated, service_role;

-- security-authority: privileged-function update_safety_incident_status
CREATE OR REPLACE FUNCTION public.update_safety_incident_status(
  p_incident_id UUID,
  p_status TEXT,
  p_actor_profile_id UUID
)
RETURNS public.safety_incidents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_incident public.safety_incidents%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL
     OR p_actor_profile_id IS NULL
     OR p_status NOT IN ('investigating', 'resolved', 'dismissed') THEN
    RAISE EXCEPTION 'invalid_safety_incident_status_request'
      USING ERRCODE = '22023';
  END IF;

  IF NOT COALESCE(private.is_admin_from_roles(auth.uid()), false) THEN
    RAISE EXCEPTION 'forbidden_safety_incident_transition'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles actor
    WHERE actor.id = p_actor_profile_id
      AND actor.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'invalid_safety_actor_profile'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.safety_incidents
  SET status = p_status,
      resolved_at = CASE
        WHEN p_status IN ('resolved', 'dismissed') THEN now()
        ELSE NULL
      END,
      updated_at = now()
  WHERE id = p_incident_id
  RETURNING * INTO v_incident;

  IF v_incident.id IS NULL THEN
    RAISE EXCEPTION 'safety_incident_not_found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.safety_audit_log (
    action,
    entity_type,
    entity_id,
    performed_by,
    metadata
  ) VALUES (
    'incident_status_updated',
    'incident',
    p_incident_id,
    p_actor_profile_id,
    jsonb_build_object(
      'new_status', p_status,
      'actor_user_id', auth.uid()
    )
  );

  RETURN v_incident;
END;
$$;

REVOKE ALL ON FUNCTION public.update_safety_incident_status(UUID, TEXT, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_safety_incident_status(UUID, TEXT, UUID)
  TO authenticated, service_role;

-- security-authority: privileged-function revoke_safety_ride_share
CREATE OR REPLACE FUNCTION public.revoke_safety_ride_share(
  p_share_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_share public.ride_shares%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '28000';
  END IF;

  SELECT share.*
  INTO v_share
  FROM public.ride_shares share
  WHERE share.id = p_share_id
  FOR UPDATE;

  IF v_share.id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = v_share.created_by
      AND profile.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'forbidden_ride_share_revoke' USING ERRCODE = '42501';
  END IF;

  UPDATE public.ride_shares
  SET status = 'revoked',
      revoked_at = now()
  WHERE id = p_share_id
    AND status = 'active';

  INSERT INTO public.safety_audit_log (
    action,
    entity_type,
    entity_id,
    performed_by,
    metadata
  ) VALUES (
    'share_revoked',
    'share',
    p_share_id,
    v_share.created_by,
    jsonb_build_object('actor_user_id', auth.uid())
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_safety_ride_share(UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_safety_ride_share(UUID)
  TO authenticated, service_role;

-- security-authority: public-rpc public.get_shared_ride_safety_data
CREATE OR REPLACE FUNCTION public.get_shared_ride_safety_data(
  p_share_token TEXT
)
RETURNS TABLE (
  ride_id UUID,
  ride_status TEXT,
  origin TEXT,
  destination TEXT,
  driver_name TEXT,
  vehicle_model TEXT,
  vehicle_plate TEXT,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  location_updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT
    ride.id,
    ride.status,
    COALESCE(ride.origin, ''),
    COALESCE(ride.destination, ''),
    driver_profile.name,
    driver.vehicle_model,
    driver.vehicle_plate,
    latest_location.lat::DOUBLE PRECISION,
    latest_location.lng::DOUBLE PRECISION,
    latest_location.updated_at
  FROM public.ride_shares share
  JOIN public.ride_requests ride
    ON ride.id = share.ride_id
  LEFT JOIN public.profiles driver_profile
    ON driver_profile.id = ride.driver_profile_id
  LEFT JOIN public.driver_data driver
    ON driver.profile_id = ride.driver_profile_id
  LEFT JOIN LATERAL (
    SELECT location.lat, location.lng, location.updated_at
    FROM public.driver_locations location
    WHERE location.driver_profile_id = ride.driver_profile_id
    ORDER BY location.updated_at DESC
    LIMIT 1
  ) latest_location ON TRUE
  WHERE p_share_token ~ '^[A-Za-z0-9]{32}$'
    AND share.share_token = p_share_token
    AND share.status = 'active'
    AND share.expires_at > now()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_ride_safety_data(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_ride_safety_data(TEXT)
  TO anon, authenticated, service_role;

COMMENT ON TABLE public.emergency_alerts IS
  'Canonical Safety emergency alerts. Identity is profile-owned and notification delivery is server-owned.';
COMMENT ON FUNCTION private.enqueue_safety_notification() IS
  'Safety adapter for the Core Platform notification outbox; recipients are derived from canonical profile ownership.';
