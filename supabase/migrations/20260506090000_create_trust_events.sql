-- Trust events: private operational reputation SSOT.
-- Public reviews remain in reviews. This table stores auditable, contextual
-- reliability signals between customer, merchant, courier, driver and admin.

DO $$ BEGIN
  CREATE TYPE trust_actor_role AS ENUM (
    'customer',
    'merchant',
    'courier',
    'driver',
    'admin',
    'system'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trust_context_type AS ENUM (
    'order',
    'ride',
    'delivery',
    'classified',
    'service',
    'community'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trust_event_type AS ENUM (
    'review',
    'incident',
    'late_cancellation',
    'no_show',
    'operational_feedback',
    'admin_action'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trust_visibility AS ENUM (
    'public',
    'private',
    'admin_only'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trust_event_status AS ENUM (
    'active',
    'under_review',
    'dismissed',
    'confirmed',
    'penalized'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS trust_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role trust_actor_role NOT NULL,
  subject_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_role trust_actor_role NOT NULL,
  context_type trust_context_type NOT NULL,
  context_id UUID NOT NULL,
  event_type trust_event_type NOT NULL,
  rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  reason_code TEXT NOT NULL,
  severity delivery_occurrence_severity NOT NULL DEFAULT 'low',
  visibility trust_visibility NOT NULL DEFAULT 'private',
  description TEXT,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  status trust_event_status NOT NULL DEFAULT 'active',
  reviewed_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trust_events_actor_subject_distinct CHECK (
    actor_profile_id IS NULL OR actor_profile_id <> subject_profile_id
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trust_events_one_review_per_context
  ON trust_events (
    actor_profile_id,
    subject_profile_id,
    actor_role,
    subject_role,
    context_type,
    context_id,
    event_type
  )
  WHERE event_type IN ('review', 'operational_feedback');

CREATE INDEX IF NOT EXISTS idx_trust_events_subject_status
  ON trust_events (subject_profile_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trust_events_context
  ON trust_events (context_type, context_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trust_events_admin_queue
  ON trust_events (status, severity, created_at DESC)
  WHERE visibility IN ('private', 'admin_only');

CREATE TABLE IF NOT EXISTS trust_admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trust_event_id UUID REFERENCES trust_events(id) ON DELETE SET NULL,
  subject_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_role trust_actor_role NOT NULL,
  action_type TEXT NOT NULL CHECK (
    action_type IN (
      'warning',
      'temporary_restriction',
      'clear_restriction',
      'note_only'
    )
  ),
  applied_by_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  notes TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_admin_actions_subject_created
  ON trust_admin_actions (subject_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trust_admin_actions_event
  ON trust_admin_actions (trust_event_id, created_at DESC);

CREATE OR REPLACE FUNCTION update_trust_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_trust_events_updated_at ON trust_events;
CREATE TRIGGER trigger_update_trust_events_updated_at
  BEFORE UPDATE ON trust_events
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_events_updated_at();

ALTER TABLE trust_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can insert own trust events" ON trust_events;
CREATE POLICY "Participants can insert own trust events"
  ON trust_events
  FOR INSERT
  WITH CHECK (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = actor_profile_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Participants can read related trust events" ON trust_events;
CREATE POLICY "Participants can read related trust events"
  ON trust_events
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR visibility = 'public'
    OR EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.user_id = auth.uid()
        AND (p.id = actor_profile_id OR p.id = subject_profile_id)
    )
  );

DROP POLICY IF EXISTS "Admins can update trust events" ON trust_events;
CREATE POLICY "Admins can update trust events"
  ON trust_events
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete trust events" ON trust_events;
CREATE POLICY "Admins can delete trust events"
  ON trust_events
  FOR DELETE
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage trust admin actions" ON trust_admin_actions;
CREATE POLICY "Admins can manage trust admin actions"
  ON trust_admin_actions
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

COMMENT ON TABLE trust_events IS
  'SSOT de confianca operacional: eventos privados/publicos de reputacao entre cliente, loja, motoboy, motorista e admin.';

COMMENT ON TABLE trust_admin_actions IS
  'Acoes administrativas auditaveis derivadas da confianca operacional: avisos, restricoes e desbloqueios.';
