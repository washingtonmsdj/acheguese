-- ══════════════════════════════════════════════════════════════════════════
-- BUSINESS HOURS — Horário de funcionamento
-- ══════════════════════════════════════════════════════════════════════════
-- Sistema de horários para empresas (gastronomia, serviços, etc)

-- ── HORÁRIOS PADRÃO ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo, 6=sábado
  opens_at TIME NOT NULL,
  closes_at TIME NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE, -- Fechado neste dia
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_id, day_of_week)
);

-- ── EXCEÇÕES (FERIADOS, EVENTOS) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_hours_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  opens_at TIME,
  closes_at TIME,
  is_closed BOOLEAN DEFAULT FALSE,
  reason TEXT, -- Ex: "Feriado", "Evento especial"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_id, date)
);

-- ── CONFIGURAÇÕES OPERACIONAIS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_operation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  
  -- Modos de operação
  accepts_pickup BOOLEAN DEFAULT TRUE,
  accepts_delivery BOOLEAN DEFAULT FALSE,
  accepts_dine_in BOOLEAN DEFAULT TRUE,
  
  -- Delivery
  uses_own_delivery BOOLEAN DEFAULT FALSE,
  uses_platform_delivery BOOLEAN DEFAULT FALSE,
  
  -- Configurações
  preparation_time_min INTEGER DEFAULT 30, -- Tempo médio de preparo
  advance_order_hours INTEGER, -- Pedidos com antecedência (null = não aceita)
  
  -- Status
  is_temporarily_closed BOOLEAN DEFAULT FALSE,
  temporarily_closed_reason TEXT,
  temporarily_closed_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_id)
);

-- ── ÍNDICES ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_business_hours_business ON business_hours(business_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_day ON business_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_business_hours_exceptions_business ON business_hours_exceptions(business_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_exceptions_date ON business_hours_exceptions(date);
CREATE INDEX IF NOT EXISTS idx_business_operation_config_business ON business_operation_config(business_id);

-- ── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_operation_config ENABLE ROW LEVEL SECURITY;

-- Público pode ver horários
DROP POLICY IF EXISTS "Public can view business hours" ON business_hours;
DROP POLICY IF EXISTS "Public can view business hours" ON business_hours;
CREATE POLICY "Public can view business hours" ON business_hours FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Public can view hours exceptions" ON business_hours_exceptions;
DROP POLICY IF EXISTS "Public can view hours exceptions" ON business_hours_exceptions;
CREATE POLICY "Public can view hours exceptions" ON business_hours_exceptions FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Public can view operation config" ON business_operation_config;
DROP POLICY IF EXISTS "Public can view operation config" ON business_operation_config;
CREATE POLICY "Public can view operation config" ON business_operation_config FOR SELECT
  USING (TRUE);

-- Donos de empresas podem gerenciar seus horários
DROP POLICY IF EXISTS "Business owners can manage hours" ON business_hours;
DROP POLICY IF EXISTS "Business owners can manage hours" ON business_hours;
CREATE POLICY "Business owners can manage hours" ON business_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_data bd
      WHERE bd.id = business_id
        AND bd.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Business owners can manage exceptions" ON business_hours_exceptions;
DROP POLICY IF EXISTS "Business owners can manage exceptions" ON business_hours_exceptions;
CREATE POLICY "Business owners can manage exceptions" ON business_hours_exceptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_data bd
      WHERE bd.id = business_id
        AND bd.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Business owners can manage operation config" ON business_operation_config;
DROP POLICY IF EXISTS "Business owners can manage operation config" ON business_operation_config;
CREATE POLICY "Business owners can manage operation config" ON business_operation_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_data bd
      WHERE bd.id = business_id
        AND bd.profile_id = auth.uid()
    )
  );

-- ── TRIGGERS ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_business_hours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_business_hours_timestamp ON business_hours;
CREATE TRIGGER update_business_hours_timestamp
  BEFORE UPDATE ON business_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_business_hours_updated_at();

DROP TRIGGER IF EXISTS update_business_operation_config_timestamp ON business_operation_config;
CREATE TRIGGER update_business_operation_config_timestamp
  BEFORE UPDATE ON business_operation_config
  FOR EACH ROW
  EXECUTE FUNCTION update_business_hours_updated_at();

-- ── FUNÇÕES AUXILIARES ────────────────────────────────────────────────────

/**
 * Verifica se uma empresa está aberta agora
 */
CREATE OR REPLACE FUNCTION is_business_open_now(p_business_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_config RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_today_dow INTEGER := EXTRACT(DOW FROM v_now);
  v_today_date DATE := v_now::DATE;
  v_current_time TIME := v_now::TIME;
  v_exception RECORD;
  v_hours RECORD;
BEGIN
  -- Buscar configuração operacional
  SELECT * INTO v_config
  FROM business_operation_config
  WHERE business_id = p_business_id;
  
  -- Se não tem config ou está temporariamente fechado
  IF v_config IS NULL OR v_config.is_temporarily_closed THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se há exceção para hoje
  SELECT * INTO v_exception
  FROM business_hours_exceptions
  WHERE business_id = p_business_id
    AND date = v_today_date;
  
  IF FOUND THEN
    -- Se tem exceção e está fechado
    IF v_exception.is_closed THEN
      RETURN FALSE;
    END IF;
    
    -- Se tem exceção com horário específico
    IF v_exception.opens_at IS NOT NULL AND v_exception.closes_at IS NOT NULL THEN
      RETURN v_current_time >= v_exception.opens_at 
         AND v_current_time <= v_exception.closes_at;
    END IF;
  END IF;
  
  -- Verificar horário padrão do dia
  SELECT * INTO v_hours
  FROM business_hours
  WHERE business_id = p_business_id
    AND day_of_week = v_today_dow;
  
  IF NOT FOUND OR v_hours.is_closed THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se está dentro do horário
  RETURN v_current_time >= v_hours.opens_at 
     AND v_current_time <= v_hours.closes_at;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Retorna o próximo horário de abertura
 */
CREATE OR REPLACE FUNCTION get_next_opening_time(p_business_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_result JSONB;
  v_day INTEGER;
  v_hours RECORD;
  v_exception RECORD;
  v_check_date DATE;
  v_max_days INTEGER := 7;
BEGIN
  -- Verificar próximos 7 dias
  FOR i IN 0..v_max_days LOOP
    v_check_date := (v_now + (i || ' days')::INTERVAL)::DATE;
    v_day := EXTRACT(DOW FROM v_check_date);
    
    -- Verificar exceção
    SELECT * INTO v_exception
    FROM business_hours_exceptions
    WHERE business_id = p_business_id
      AND date = v_check_date;
    
    IF FOUND AND NOT v_exception.is_closed AND v_exception.opens_at IS NOT NULL THEN
      RETURN jsonb_build_object(
        'date', v_check_date,
        'opens_at', v_exception.opens_at,
        'closes_at', v_exception.closes_at,
        'is_exception', TRUE,
        'reason', v_exception.reason
      );
    END IF;
    
    -- Verificar horário padrão
    IF NOT FOUND OR v_exception IS NULL THEN
      SELECT * INTO v_hours
      FROM business_hours
      WHERE business_id = p_business_id
        AND day_of_week = v_day
        AND NOT is_closed;
      
      IF FOUND THEN
        RETURN jsonb_build_object(
          'date', v_check_date,
          'opens_at', v_hours.opens_at,
          'closes_at', v_hours.closes_at,
          'is_exception', FALSE
        );
      END IF;
    END IF;
  END LOOP;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── COMENTÁRIOS ───────────────────────────────────────────────────────────

COMMENT ON TABLE business_hours IS 'Horário de funcionamento padrão por dia da semana';
COMMENT ON TABLE business_hours_exceptions IS 'Exceções de horário (feriados, eventos)';
COMMENT ON TABLE business_operation_config IS 'Configurações operacionais da empresa';

COMMENT ON COLUMN business_hours.day_of_week IS '0=domingo, 1=segunda, ..., 6=sábado';
COMMENT ON COLUMN business_hours.is_closed IS 'Fechado neste dia da semana';

COMMENT ON COLUMN business_operation_config.accepts_pickup IS 'Aceita retirada no local';
COMMENT ON COLUMN business_operation_config.accepts_delivery IS 'Aceita entrega';
COMMENT ON COLUMN business_operation_config.accepts_dine_in IS 'Aceita consumo no local';
COMMENT ON COLUMN business_operation_config.uses_own_delivery IS 'Usa entrega própria';
COMMENT ON COLUMN business_operation_config.uses_platform_delivery IS 'Usa entrega da plataforma';

COMMENT ON FUNCTION is_business_open_now IS 'Verifica se empresa está aberta agora';
COMMENT ON FUNCTION get_next_opening_time IS 'Retorna próximo horário de abertura';
