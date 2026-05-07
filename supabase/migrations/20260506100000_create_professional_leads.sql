-- ============================================================================
-- MIGRATION: Create professional leads funnel
-- ============================================================================
-- Canonical quote/request pipeline for local professionals.
-- Public pages capture requests without exposing private phone/email by default.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'professional_lead_status') THEN
    CREATE TYPE professional_lead_status AS ENUM (
      'new',
      'contacted',
      'quoted',
      'scheduled',
      'completed',
      'cancelled',
      'archived'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS professional_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professional_data(id) ON DELETE CASCADE,
  requester_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  requester_phone TEXT,
  requester_email TEXT,
  service_needed TEXT NOT NULL,
  description TEXT NOT NULL,
  preferred_date DATE,
  preferred_time_window TEXT,
  neighborhood TEXT,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  source_channel TEXT NOT NULL DEFAULT 'public_profile',
  status professional_lead_status NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'normal',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT professional_leads_contact_required
    CHECK (requester_phone IS NOT NULL OR requester_email IS NOT NULL),
  CONSTRAINT professional_leads_priority_check
    CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE TABLE IF NOT EXISTS professional_lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES professional_leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professional_lead_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES professional_leads(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_role TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT professional_lead_messages_sender_role_check
    CHECK (sender_role IN ('requester', 'professional', 'system')),
  CONSTRAINT professional_lead_messages_message_check
    CHECK (char_length(trim(message)) BETWEEN 1 AND 2000)
);

CREATE TABLE IF NOT EXISTS professional_lead_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES professional_leads(id) ON DELETE CASCADE,
  professional_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  description TEXT NOT NULL,
  estimated_start_date DATE,
  estimated_duration TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT professional_lead_quotes_status_check
    CHECK (status IN ('sent', 'accepted', 'declined', 'expired', 'cancelled')),
  CONSTRAINT professional_lead_quotes_description_check
    CHECK (char_length(trim(description)) BETWEEN 1 AND 2000)
);

CREATE TABLE IF NOT EXISTS professional_service_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL UNIQUE REFERENCES professional_leads(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL UNIQUE REFERENCES professional_lead_quotes(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professional_data(id) ON DELETE CASCADE,
  professional_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  service_description TEXT NOT NULL,
  scheduled_date DATE,
  estimated_duration TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT professional_service_engagements_status_check
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT professional_service_engagements_description_check
    CHECK (char_length(trim(service_description)) BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS idx_professional_leads_professional_status_created
  ON professional_leads(professional_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_professional_leads_requester_created
  ON professional_leads(requester_user_id, created_at DESC)
  WHERE requester_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_professional_leads_location
  ON professional_leads(location_id)
  WHERE location_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_professional_lead_events_lead_created
  ON professional_lead_events(lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_professional_lead_messages_lead_created
  ON professional_lead_messages(lead_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_professional_lead_quotes_lead_created
  ON professional_lead_quotes(lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_professional_service_engagements_professional_status
  ON professional_service_engagements(professional_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_professional_service_engagements_requester_created
  ON professional_service_engagements(requester_user_id, created_at DESC)
  WHERE requester_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION create_professional_lead_created_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO professional_lead_events (
    lead_id,
    event_type,
    actor_user_id,
    payload
  ) VALUES (
    NEW.id,
    'lead_created',
    NEW.requester_user_id,
    jsonb_build_object(
      'source_channel', NEW.source_channel,
      'service_needed', NEW.service_needed
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_professional_leads_created_event ON professional_leads;
CREATE TRIGGER trg_professional_leads_created_event
  AFTER INSERT ON professional_leads
  FOR EACH ROW
  EXECUTE FUNCTION create_professional_lead_created_event();

CREATE OR REPLACE FUNCTION update_professional_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION guard_professional_lead_quote_update()
RETURNS TRIGGER AS $$
DECLARE
  lead_requester_user_id UUID;
  lead_professional_user_id UUID;
BEGIN
  SELECT
    pl.requester_user_id,
    p.user_id
  INTO
    lead_requester_user_id,
    lead_professional_user_id
  FROM professional_leads pl
  JOIN professional_data pd ON pd.id = pl.professional_id
  JOIN profiles p ON p.id = pd.profile_id
  WHERE pl.id = OLD.lead_id;

  IF OLD.lead_id IS DISTINCT FROM NEW.lead_id
    OR OLD.professional_user_id IS DISTINCT FROM NEW.professional_user_id
    OR OLD.amount_cents IS DISTINCT FROM NEW.amount_cents
    OR OLD.currency IS DISTINCT FROM NEW.currency
    OR OLD.description IS DISTINCT FROM NEW.description
    OR OLD.estimated_start_date IS DISTINCT FROM NEW.estimated_start_date
    OR OLD.estimated_duration IS DISTINCT FROM NEW.estimated_duration
    OR OLD.metadata IS DISTINCT FROM NEW.metadata
    OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'professional lead quote immutable fields cannot be changed';
  END IF;

  IF OLD.status <> 'sent' THEN
    RAISE EXCEPTION 'professional lead quote status is already finalized';
  END IF;

  IF NEW.status IN ('accepted', 'declined') THEN
    IF lead_requester_user_id IS NULL OR lead_requester_user_id <> auth.uid() THEN
      RAISE EXCEPTION 'only the requester can accept or decline a professional quote';
    END IF;
  ELSIF NEW.status = 'cancelled' THEN
    IF lead_professional_user_id IS NULL OR lead_professional_user_id <> auth.uid() THEN
      RAISE EXCEPTION 'only the professional can cancel a professional quote';
    END IF;
  ELSIF NEW.status = OLD.status THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'invalid professional quote status transition';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_professional_service_engagement_from_quote()
RETURNS TRIGGER AS $$
DECLARE
  lead_record professional_leads%ROWTYPE;
BEGIN
  IF NEW.status <> 'accepted' OR OLD.status = 'accepted' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO lead_record
  FROM professional_leads
  WHERE id = NEW.lead_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  INSERT INTO professional_service_engagements (
    lead_id,
    quote_id,
    professional_id,
    professional_user_id,
    requester_user_id,
    requester_profile_id,
    amount_cents,
    currency,
    service_description,
    scheduled_date,
    estimated_duration,
    metadata
  ) VALUES (
    NEW.lead_id,
    NEW.id,
    lead_record.professional_id,
    NEW.professional_user_id,
    lead_record.requester_user_id,
    lead_record.requester_profile_id,
    NEW.amount_cents,
    NEW.currency,
    NEW.description,
    NEW.estimated_start_date,
    NEW.estimated_duration,
    jsonb_build_object(
      'source', 'accepted_professional_quote',
      'service_needed', lead_record.service_needed
    )
  )
  ON CONFLICT (quote_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_professional_leads_updated_at ON professional_leads;
CREATE TRIGGER trg_professional_leads_updated_at
  BEFORE UPDATE ON professional_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_leads_updated_at();

DROP TRIGGER IF EXISTS trg_professional_lead_quotes_updated_at ON professional_lead_quotes;
CREATE TRIGGER trg_professional_lead_quotes_updated_at
  BEFORE UPDATE ON professional_lead_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_leads_updated_at();

DROP TRIGGER IF EXISTS trg_professional_lead_quotes_guard_update ON professional_lead_quotes;
CREATE TRIGGER trg_professional_lead_quotes_guard_update
  BEFORE UPDATE ON professional_lead_quotes
  FOR EACH ROW
  EXECUTE FUNCTION guard_professional_lead_quote_update();

DROP TRIGGER IF EXISTS trg_professional_service_engagement_from_quote ON professional_lead_quotes;
CREATE TRIGGER trg_professional_service_engagement_from_quote
  AFTER UPDATE OF status ON professional_lead_quotes
  FOR EACH ROW
  EXECUTE FUNCTION create_professional_service_engagement_from_quote();

DROP TRIGGER IF EXISTS trg_professional_service_engagements_updated_at ON professional_service_engagements;
CREATE TRIGGER trg_professional_service_engagements_updated_at
  BEFORE UPDATE ON professional_service_engagements
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_leads_updated_at();

ALTER TABLE professional_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_lead_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_lead_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_service_engagements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS professional_leads_public_insert ON professional_leads;
CREATE POLICY professional_leads_public_insert
  ON professional_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM professional_data pd
      WHERE pd.id = professional_leads.professional_id
        AND pd.is_accepting_clients = true
    )
  );

DROP POLICY IF EXISTS professional_leads_owner_select ON professional_leads;
CREATE POLICY professional_leads_owner_select
  ON professional_leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM professional_data pd
      JOIN profiles p ON p.id = pd.profile_id
      WHERE pd.id = professional_leads.professional_id
        AND p.user_id = auth.uid()
    )
    OR requester_user_id = auth.uid()
  );

DROP POLICY IF EXISTS professional_leads_owner_update ON professional_leads;
CREATE POLICY professional_leads_owner_update
  ON professional_leads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM professional_data pd
      JOIN profiles p ON p.id = pd.profile_id
      WHERE pd.id = professional_leads.professional_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM professional_data pd
      JOIN profiles p ON p.id = pd.profile_id
      WHERE pd.id = professional_leads.professional_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS professional_lead_events_participant_select ON professional_lead_events;
CREATE POLICY professional_lead_events_participant_select
  ON professional_lead_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM professional_leads pl
      LEFT JOIN professional_data pd ON pd.id = pl.professional_id
      LEFT JOIN profiles p ON p.id = pd.profile_id
      WHERE pl.id = professional_lead_events.lead_id
        AND (p.user_id = auth.uid() OR pl.requester_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS professional_lead_events_owner_insert ON professional_lead_events;
CREATE POLICY professional_lead_events_owner_insert
  ON professional_lead_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM professional_leads pl
      JOIN professional_data pd ON pd.id = pl.professional_id
      JOIN profiles p ON p.id = pd.profile_id
      WHERE pl.id = professional_lead_events.lead_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS professional_lead_messages_participant_select ON professional_lead_messages;
CREATE POLICY professional_lead_messages_participant_select
  ON professional_lead_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM professional_leads pl
      LEFT JOIN professional_data pd ON pd.id = pl.professional_id
      LEFT JOIN profiles p ON p.id = pd.profile_id
      WHERE pl.id = professional_lead_messages.lead_id
        AND (p.user_id = auth.uid() OR pl.requester_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS professional_lead_messages_participant_insert ON professional_lead_messages;
CREATE POLICY professional_lead_messages_participant_insert
  ON professional_lead_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM professional_leads pl
      LEFT JOIN professional_data pd ON pd.id = pl.professional_id
      LEFT JOIN profiles p ON p.id = pd.profile_id
      WHERE pl.id = professional_lead_messages.lead_id
        AND (p.user_id = auth.uid() OR pl.requester_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS professional_lead_quotes_participant_select ON professional_lead_quotes;
CREATE POLICY professional_lead_quotes_participant_select
  ON professional_lead_quotes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM professional_leads pl
      LEFT JOIN professional_data pd ON pd.id = pl.professional_id
      LEFT JOIN profiles p ON p.id = pd.profile_id
      WHERE pl.id = professional_lead_quotes.lead_id
        AND (p.user_id = auth.uid() OR pl.requester_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS professional_lead_quotes_professional_insert ON professional_lead_quotes;
CREATE POLICY professional_lead_quotes_professional_insert
  ON professional_lead_quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    professional_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM professional_leads pl
      JOIN professional_data pd ON pd.id = pl.professional_id
      JOIN profiles p ON p.id = pd.profile_id
      WHERE pl.id = professional_lead_quotes.lead_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS professional_lead_quotes_participant_update ON professional_lead_quotes;
DROP POLICY IF EXISTS professional_lead_quotes_requester_response_update ON professional_lead_quotes;
CREATE POLICY professional_lead_quotes_requester_response_update
  ON professional_lead_quotes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM professional_leads pl
      WHERE pl.id = professional_lead_quotes.lead_id
        AND pl.requester_user_id = auth.uid()
        AND professional_lead_quotes.status = 'sent'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM professional_leads pl
      WHERE pl.id = professional_lead_quotes.lead_id
        AND pl.requester_user_id = auth.uid()
        AND professional_lead_quotes.status IN ('accepted', 'declined')
    )
  );

DROP POLICY IF EXISTS professional_lead_quotes_professional_cancel_update ON professional_lead_quotes;
CREATE POLICY professional_lead_quotes_professional_cancel_update
  ON professional_lead_quotes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM professional_leads pl
      JOIN professional_data pd ON pd.id = pl.professional_id
      JOIN profiles p ON p.id = pd.profile_id
      WHERE pl.id = professional_lead_quotes.lead_id
        AND p.user_id = auth.uid()
        AND professional_lead_quotes.status = 'sent'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM professional_leads pl
      JOIN professional_data pd ON pd.id = pl.professional_id
      JOIN profiles p ON p.id = pd.profile_id
      WHERE pl.id = professional_lead_quotes.lead_id
        AND p.user_id = auth.uid()
        AND professional_lead_quotes.status = 'cancelled'
    )
  );

DROP POLICY IF EXISTS professional_service_engagements_participant_select ON professional_service_engagements;
CREATE POLICY professional_service_engagements_participant_select
  ON professional_service_engagements
  FOR SELECT
  TO authenticated
  USING (
    requester_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM professional_data pd
      JOIN profiles p ON p.id = pd.profile_id
      WHERE pd.id = professional_service_engagements.professional_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS professional_service_engagements_professional_update ON professional_service_engagements;
CREATE POLICY professional_service_engagements_professional_update
  ON professional_service_engagements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM professional_data pd
      JOIN profiles p ON p.id = pd.profile_id
      WHERE pd.id = professional_service_engagements.professional_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM professional_data pd
      JOIN profiles p ON p.id = pd.profile_id
      WHERE pd.id = professional_service_engagements.professional_id
        AND p.user_id = auth.uid()
    )
  );

COMMENT ON TABLE professional_leads IS 'Canonical quote and contact requests for local professionals';
COMMENT ON TABLE professional_lead_events IS 'Audit trail and status history for professional leads';
COMMENT ON TABLE professional_lead_messages IS 'Participant messages for professional quote requests';
COMMENT ON TABLE professional_lead_quotes IS 'Structured quotes sent by professionals for lead requests';
COMMENT ON TABLE professional_service_engagements IS 'Contracted professional service engagements created from accepted quotes';
