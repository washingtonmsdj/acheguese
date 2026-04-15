-- ============================================================================
-- FASE 1: MULTI-PERFIL REAL - TRIGGERS
-- ============================================================================
-- Criar triggers de validação e enforcement
-- ============================================================================

-- Trigger: validar que profile_links vincula perfis da mesma conta
CREATE OR REPLACE FUNCTION validate_profile_link_same_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.user_id = p2.user_id
    WHERE p1.id = NEW.from_profile_id
    AND p2.id = NEW.to_profile_id
  ) THEN
    RAISE EXCEPTION 'Profile links must be between profiles of the same account';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_profile_link_same_account
  BEFORE INSERT OR UPDATE ON profile_links
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_link_same_account();

-- Trigger: impedir membros em perfis personal e driver
CREATE OR REPLACE FUNCTION enforce_no_members_for_personal_driver()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_type TEXT;
BEGIN
  SELECT profile_type INTO v_profile_type
  FROM profiles
  WHERE id = NEW.profile_id;
  
  IF v_profile_type IN ('personal', 'driver') THEN
    RAISE EXCEPTION 'Personal and driver profiles cannot have members';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_members_personal_driver ON profile_members;
CREATE TRIGGER prevent_members_personal_driver
  BEFORE INSERT OR UPDATE ON profile_members
  FOR EACH ROW
  EXECUTE FUNCTION enforce_no_members_for_personal_driver();

-- Comentários de auditoria
COMMENT ON FUNCTION validate_profile_link_same_account IS 'Multi-perfil: garante que links são entre perfis da mesma conta';
COMMENT ON FUNCTION enforce_no_members_for_personal_driver IS 'Multi-perfil: impede membros em perfis personal e driver';
