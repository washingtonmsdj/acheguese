-- ============================================================================
-- BUSINESS RECOMMENDATIONS - Sistema de Recomendacoes de Empresas (SSOT)
-- ============================================================================

-- 1) Tabela de recomendacoes user -> business
CREATE TABLE IF NOT EXISTS user_recommended_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  source_module TEXT NOT NULL DEFAULT 'company',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_business_recommendation UNIQUE (user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_user_recommended_businesses_user_id
  ON user_recommended_businesses(user_id);

CREATE INDEX IF NOT EXISTS idx_user_recommended_businesses_business_id
  ON user_recommended_businesses(business_id);

CREATE INDEX IF NOT EXISTS idx_user_recommended_businesses_created_at
  ON user_recommended_businesses(user_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_user_recommended_businesses_updated_at'
  ) THEN
    CREATE TRIGGER update_user_recommended_businesses_updated_at
      BEFORE UPDATE ON user_recommended_businesses
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

ALTER TABLE user_recommended_businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own business recommendations" ON user_recommended_businesses;
CREATE POLICY "Users manage own business recommendations"
  ON user_recommended_businesses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2) Contador de recomendacoes em business_data
ALTER TABLE business_data
  ADD COLUMN IF NOT EXISTS recommendations_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_business_data_recommendations_count
  ON business_data(recommendations_count DESC)
  WHERE recommendations_count > 0;

CREATE OR REPLACE FUNCTION update_business_recommendations_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE business_data
    SET recommendations_count = recommendations_count + 1
    WHERE id = NEW.business_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE business_data
    SET recommendations_count = GREATEST(0, recommendations_count - 1)
    WHERE id = OLD.business_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_business_recommendations_count ON user_recommended_businesses;
CREATE TRIGGER trigger_update_business_recommendations_count
  AFTER INSERT OR DELETE ON user_recommended_businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_business_recommendations_count();

-- 3) RPCs auxiliares
DROP FUNCTION IF EXISTS is_business_recommended(UUID, UUID);

CREATE OR REPLACE FUNCTION is_business_recommended(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  v_auth_user_id := auth.uid();

  IF v_auth_user_id IS NULL OR p_user_id IS DISTINCT FROM v_auth_user_id THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM user_recommended_businesses
    WHERE user_id = v_auth_user_id
      AND business_id = p_business_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS toggle_business_recommendation(UUID, UUID);

CREATE OR REPLACE FUNCTION toggle_business_recommendation(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_auth_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  v_auth_user_id := auth.uid();

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  IF p_user_id IS DISTINCT FROM v_auth_user_id THEN
    RAISE EXCEPTION 'Acesso negado para alterar recomendacoes de outro usuario';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM user_recommended_businesses
    WHERE user_id = v_auth_user_id
      AND business_id = p_business_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM user_recommended_businesses
    WHERE user_id = v_auth_user_id
      AND business_id = p_business_id;
    RETURN FALSE;
  ELSE
    INSERT INTO user_recommended_businesses (user_id, business_id)
    VALUES (v_auth_user_id, p_business_id);
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_business_recommendations_count(UUID);

CREATE OR REPLACE FUNCTION get_business_recommendations_count(
  p_business_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM user_recommended_businesses
  WHERE business_id = p_business_id;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE user_recommended_businesses IS 'Recomendacoes de usuarios para estabelecimentos.';
COMMENT ON FUNCTION is_business_recommended IS 'Verifica se usuario autenticado recomendou um negocio.';
COMMENT ON FUNCTION toggle_business_recommendation IS 'Alterna recomendacao do usuario autenticado para um negocio.';
COMMENT ON FUNCTION get_business_recommendations_count IS 'Retorna total de recomendacoes para um negocio.';
