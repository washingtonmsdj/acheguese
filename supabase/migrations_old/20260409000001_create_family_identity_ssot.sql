-- ============================================================================
-- FAMILY IDENTITY SSOT
-- Contrato canonico local para vinculos familiares, compartilhamento de
-- localizacao, geofences e alertas do dominio family.
-- Consumido por core/family/FamilyService e AdminProfileGovernanceService.
-- ============================================================================

CREATE OR REPLACE FUNCTION family_normalize_email(p_email TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(lower(trim(p_email)), '');
$$;

CREATE OR REPLACE FUNCTION family_current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT family_normalize_email(auth.jwt() ->> 'email');
$$;

CREATE OR REPLACE FUNCTION family_resolve_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id
  FROM auth.users u
  WHERE family_normalize_email(u.email) = family_normalize_email(p_email)
  ORDER BY u.created_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION family_resolve_personal_profile_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM profiles p
  WHERE p.user_id = p_user_id
    AND p.is_active = true
  ORDER BY CASE WHEN p.profile_type = 'personal' THEN 0 ELSE 1 END, p.created_at ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION family_resolve_user_id_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION family_resolve_personal_profile_id(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION family_assign_connection_refs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  NEW.child_email := family_normalize_email(NEW.child_email);
  NEW.parent_profile_id := family_resolve_personal_profile_id(NEW.parent_id);

  IF NEW.child_id IS NULL AND NEW.child_email IS NOT NULL THEN
    NEW.child_id := family_resolve_user_id_by_email(NEW.child_email);
  END IF;

  IF NEW.child_id IS NOT NULL THEN
    NEW.child_profile_id := family_resolve_personal_profile_id(NEW.child_id);
  ELSE
    NEW.child_profile_id := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION family_assign_user_profile_ref()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.profile_id := family_resolve_personal_profile_id(NEW.user_id);
  RETURN NEW;
END;
$$;

-- ============================================================================
-- FAMILY_CONNECTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS family_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  child_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  child_email TEXT,
  relationship_type TEXT NOT NULL
    CHECK (relationship_type IN ('pai', 'mae', 'responsavel', 'tutor')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'rejected')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT family_connections_target_check CHECK (
    (status = 'pending' AND (child_id IS NOT NULL OR family_normalize_email(child_email) IS NOT NULL))
    OR (status IN ('active', 'rejected') AND child_id IS NOT NULL)
  ),
  CONSTRAINT family_connections_self_reference_check CHECK (
    child_id IS NULL OR parent_id <> child_id
  )
);

CREATE INDEX IF NOT EXISTS idx_family_connections_parent_id
  ON family_connections(parent_id);
CREATE INDEX IF NOT EXISTS idx_family_connections_child_id
  ON family_connections(child_id);
CREATE INDEX IF NOT EXISTS idx_family_connections_status_created_at
  ON family_connections(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_connections_child_email
  ON family_connections(child_email)
  WHERE child_email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_family_connections_parent_child_unique
  ON family_connections(parent_id, child_id)
  WHERE child_id IS NOT NULL AND status IN ('pending', 'active');
CREATE UNIQUE INDEX IF NOT EXISTS idx_family_connections_pending_email_unique
  ON family_connections(parent_id, family_normalize_email(child_email))
  WHERE child_id IS NULL AND child_email IS NOT NULL AND status = 'pending';

DROP TRIGGER IF EXISTS update_family_connections_updated_at ON family_connections;
CREATE TRIGGER update_family_connections_updated_at
  BEFORE UPDATE ON family_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS assign_family_connection_refs ON family_connections;
CREATE TRIGGER assign_family_connection_refs
  BEFORE INSERT OR UPDATE ON family_connections
  FOR EACH ROW EXECUTE FUNCTION family_assign_connection_refs();

ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "family_connections_participants_select" ON family_connections;
CREATE POLICY "family_connections_participants_select"
  ON family_connections FOR SELECT TO authenticated
  USING (
    parent_id = auth.uid()
    OR child_id = auth.uid()
    OR family_current_user_email() = family_normalize_email(child_email)
  );

DROP POLICY IF EXISTS "family_connections_parents_insert" ON family_connections;
CREATE POLICY "family_connections_parents_insert"
  ON family_connections FOR INSERT TO authenticated
  WITH CHECK (
    parent_id = auth.uid()
    AND (parent_profile_id IS NULL OR is_profile_manager(parent_profile_id, auth.uid()))
    AND (child_id IS NULL OR child_id <> auth.uid())
  );

DROP POLICY IF EXISTS "family_connections_participants_update" ON family_connections;
CREATE POLICY "family_connections_participants_update"
  ON family_connections FOR UPDATE TO authenticated
  USING (
    parent_id = auth.uid()
    OR child_id = auth.uid()
    OR family_current_user_email() = family_normalize_email(child_email)
  )
  WITH CHECK (
    parent_id = auth.uid()
    OR child_id = auth.uid()
    OR family_current_user_email() = family_normalize_email(child_email)
  );

DROP POLICY IF EXISTS "family_connections_participants_delete" ON family_connections;
CREATE POLICY "family_connections_participants_delete"
  ON family_connections FOR DELETE TO authenticated
  USING (parent_id = auth.uid() OR child_id = auth.uid());

COMMENT ON TABLE family_connections IS
  'SSOT de vinculos familiares entre contas, incluindo convites pendentes por email e resolucao para perfis pessoais.';

-- ============================================================================
-- FAMILY_LOCATION_SHARING_SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS family_location_sharing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  update_frequency INTEGER NOT NULL DEFAULT 300
    CHECK (update_frequency BETWEEN 60 AND 86400),
  battery_saver_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_location_sharing_settings_user_id
  ON family_location_sharing_settings(user_id);

DROP TRIGGER IF EXISTS update_family_location_sharing_settings_updated_at ON family_location_sharing_settings;
CREATE TRIGGER update_family_location_sharing_settings_updated_at
  BEFORE UPDATE ON family_location_sharing_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS assign_family_location_sharing_settings_profile ON family_location_sharing_settings;
CREATE TRIGGER assign_family_location_sharing_settings_profile
  BEFORE INSERT OR UPDATE ON family_location_sharing_settings
  FOR EACH ROW EXECUTE FUNCTION family_assign_user_profile_ref();

ALTER TABLE family_location_sharing_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "family_location_sharing_settings_owner_manage" ON family_location_sharing_settings;
CREATE POLICY "family_location_sharing_settings_owner_manage"
  ON family_location_sharing_settings FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE family_location_sharing_settings IS
  'Configuracao canonica de compartilhamento de localizacao do dominio family.';

-- ============================================================================
-- FAMILY_LOCATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS family_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  accuracy DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (accuracy >= 0),
  battery_level INTEGER CHECK (battery_level BETWEEN 0 AND 100),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_locations_user_id
  ON family_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_family_locations_updated_at_desc
  ON family_locations(updated_at DESC);

DROP TRIGGER IF EXISTS update_family_locations_updated_at ON family_locations;
CREATE TRIGGER update_family_locations_updated_at
  BEFORE UPDATE ON family_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS assign_family_locations_profile ON family_locations;
CREATE TRIGGER assign_family_locations_profile
  BEFORE INSERT OR UPDATE ON family_locations
  FOR EACH ROW EXECUTE FUNCTION family_assign_user_profile_ref();

ALTER TABLE family_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "family_locations_owner_manage" ON family_locations;
CREATE POLICY "family_locations_owner_manage"
  ON family_locations FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "family_locations_parents_select" ON family_locations;
CREATE POLICY "family_locations_parents_select"
  ON family_locations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM family_connections fc
      JOIN family_location_sharing_settings flss
        ON flss.user_id = family_locations.user_id
      WHERE fc.status = 'active'
        AND fc.child_id = family_locations.user_id
        AND fc.parent_id = auth.uid()
        AND flss.enabled = true
    )
  );

COMMENT ON TABLE family_locations IS
  'Ultima posicao compartilhada no dominio family, respeitando configuracao de sharing do usuario monitorado.';

-- ============================================================================
-- FAMILY_GEOFENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS family_geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  radius_meters DOUBLE PRECISION NOT NULL CHECK (radius_meters > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_geofences_user_id
  ON family_geofences(user_id);
CREATE INDEX IF NOT EXISTS idx_family_geofences_active
  ON family_geofences(user_id, is_active);

DROP TRIGGER IF EXISTS update_family_geofences_updated_at ON family_geofences;
CREATE TRIGGER update_family_geofences_updated_at
  BEFORE UPDATE ON family_geofences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS assign_family_geofences_profile ON family_geofences;
CREATE TRIGGER assign_family_geofences_profile
  BEFORE INSERT OR UPDATE ON family_geofences
  FOR EACH ROW EXECUTE FUNCTION family_assign_user_profile_ref();

ALTER TABLE family_geofences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "family_geofences_owner_manage" ON family_geofences;
CREATE POLICY "family_geofences_owner_manage"
  ON family_geofences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE family_geofences IS
  'Geofences canonicos do dominio family, isolados de outros usos geoespaciais do sistema.';

-- ============================================================================
-- FAMILY_LOCATION_ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS family_location_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  connection_id UUID REFERENCES family_connections(id) ON DELETE SET NULL,
  geofence_id UUID REFERENCES family_geofences(id) ON DELETE SET NULL,
  type TEXT NOT NULL
    CHECK (type IN ('enter_geofence', 'exit_geofence', 'location_sharing_disabled', 'battery_low', 'offline')),
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT family_location_alerts_read_state_check CHECK (
    (read = false AND read_at IS NULL) OR read_at IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_family_location_alerts_user_id_created_at
  ON family_location_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_location_alerts_unread
  ON family_location_alerts(user_id, read)
  WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_family_location_alerts_connection_id
  ON family_location_alerts(connection_id)
  WHERE connection_id IS NOT NULL;

DROP TRIGGER IF EXISTS assign_family_location_alerts_profile ON family_location_alerts;
CREATE TRIGGER assign_family_location_alerts_profile
  BEFORE INSERT OR UPDATE ON family_location_alerts
  FOR EACH ROW EXECUTE FUNCTION family_assign_user_profile_ref();

ALTER TABLE family_location_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "family_location_alerts_owner_select" ON family_location_alerts;
CREATE POLICY "family_location_alerts_owner_select"
  ON family_location_alerts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "family_location_alerts_owner_update" ON family_location_alerts;
CREATE POLICY "family_location_alerts_owner_update"
  ON family_location_alerts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE family_location_alerts IS
  'Alertas canonicos do dominio family para geofences, offline e mudancas de compartilhamento.';