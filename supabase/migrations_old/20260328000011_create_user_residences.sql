-- ============================================================================
-- CREATE user_residences
-- Tabela de endereços residenciais dos usuários
-- Referenciada por ResidenceService, useProfileLocation, LocationService
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_residences (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  street                      TEXT NOT NULL DEFAULT '',
  number                      TEXT NOT NULL DEFAULT '',
  complement                  TEXT,
  neighborhood                TEXT NOT NULL DEFAULT '',
  city                        TEXT NOT NULL DEFAULT '',
  state                       TEXT NOT NULL DEFAULT '',
  postal_code                 TEXT NOT NULL DEFAULT '',
  country                     TEXT NOT NULL DEFAULT 'BR',
  is_primary                  BOOLEAN NOT NULL DEFAULT false,
  is_verified                 BOOLEAN NOT NULL DEFAULT false,
  verification_requested_at   TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_residences_user_id  ON user_residences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_residences_primary  ON user_residences(user_id) WHERE is_primary = true;

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS update_user_residences_updated_at ON user_residences;

CREATE TRIGGER update_user_residences_updated_at
  BEFORE UPDATE ON user_residences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE user_residences ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists before creating
DROP POLICY IF EXISTS "Users manage own residences" ON user_residences;

CREATE POLICY "Users manage own residences"
  ON user_residences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE user_residences IS 'Endereços residenciais dos usuários — usado por ResidenceService e useProfileLocation';
