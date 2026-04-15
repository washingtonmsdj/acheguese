-- ============================================
-- DISPATCH AUTOMÁTICO - SQL COMPLETO
-- ============================================
-- Cria tabela de auditoria + trigger que dispara edge function

BEGIN;

-- ============================================
-- 1. TABELA DE AUDITORIA DE DISPATCH
-- ============================================

CREATE TABLE IF NOT EXISTS ride_dispatch_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  driver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  offered_at TIMESTAMPTZ NOT NULL,
  timeout_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'timeout', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dispatch_audit_ride ON ride_dispatch_audit(ride_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_audit_driver ON ride_dispatch_audit(driver_profile_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_audit_status ON ride_dispatch_audit(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_audit_created ON ride_dispatch_audit(created_at DESC);

-- RLS
ALTER TABLE ride_dispatch_audit ENABLE ROW LEVEL SECURITY;

-- Admin pode ver tudo
DROP POLICY IF EXISTS "Admin can view all dispatch audit" ON ride_dispatch_audit;
CREATE POLICY "Admin can view all dispatch audit"
  ON ride_dispatch_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Motorista pode ver suas próprias tentativas
DROP POLICY IF EXISTS "Driver can view own dispatch attempts" ON ride_dispatch_audit;
CREATE POLICY "Driver can view own dispatch attempts"
  ON ride_dispatch_audit
  FOR SELECT
  TO authenticated
  USING (driver_profile_id = auth.uid());

-- Passageiro pode ver tentativas da sua corrida
DROP POLICY IF EXISTS "Passenger can view dispatch attempts for their rides" ON ride_dispatch_audit;
CREATE POLICY "Passenger can view dispatch attempts for their rides"
  ON ride_dispatch_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ride_requests
      WHERE ride_requests.id = ride_dispatch_audit.ride_id
      AND ride_requests.passenger_profile_id = auth.uid()
    )
  );

-- Sistema pode inserir e atualizar
DROP POLICY IF EXISTS "System can insert dispatch audit" ON ride_dispatch_audit;
CREATE POLICY "System can insert dispatch audit"
  ON ride_dispatch_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update dispatch audit" ON ride_dispatch_audit;
CREATE POLICY "System can update dispatch audit"
  ON ride_dispatch_audit
  FOR UPDATE
  TO authenticated
  USING (true);

COMMENT ON TABLE ride_dispatch_audit IS 'Auditoria de tentativas de dispatch de corridas para motoristas';
COMMENT ON COLUMN ride_dispatch_audit.attempt_number IS 'Número sequencial da tentativa (1, 2, 3...)';
COMMENT ON COLUMN ride_dispatch_audit.offered_at IS 'Quando a corrida foi oferecida ao motorista';
COMMENT ON COLUMN ride_dispatch_audit.timeout_at IS 'Quando a oferta expira';
COMMENT ON COLUMN ride_dispatch_audit.responded_at IS 'Quando o motorista respondeu (aceitou ou timeout)';
COMMENT ON COLUMN ride_dispatch_audit.status IS 'Status da tentativa: pending, accepted, timeout, rejected';

-- ============================================
-- 2. FUNÇÃO QUE DISPARA EDGE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION trigger_auto_dispatch()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  request_id BIGINT;
BEGIN
  -- Só dispara se mudou para searching_driver
  IF NEW.status = 'searching_driver' AND (OLD.status IS NULL OR OLD.status != 'searching_driver') THEN
    
    -- URL da edge function (ajustar conforme ambiente)
    function_url := current_setting('app.supabase_functions_url', true) || '/auto-dispatch-ride';
    
    -- Se não tiver configuração, usar URL padrão do projeto
    IF function_url IS NULL OR function_url = '/auto-dispatch-ride' THEN
      function_url := 'https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/auto-dispatch-ride';
    END IF;
    
    -- Chamar edge function via pg_net (se disponível) ou http extension
    BEGIN
      -- Tentar usar net.http_post (Supabase)
      SELECT net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
        ),
        body := jsonb_build_object('rideId', NEW.id)
      ) INTO request_id;
      
      RAISE NOTICE 'Auto-dispatch triggered for ride %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Se falhar, logar erro mas não bloquear a transação
      RAISE WARNING 'Failed to trigger auto-dispatch for ride %: %', NEW.id, SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. TRIGGER NA TABELA ride_requests
-- ============================================

DROP TRIGGER IF EXISTS trigger_auto_dispatch_on_searching ON ride_requests;

CREATE TRIGGER trigger_auto_dispatch_on_searching
  AFTER INSERT OR UPDATE OF status
  ON ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_dispatch();

COMMENT ON FUNCTION trigger_auto_dispatch IS 'Dispara edge function de auto-dispatch quando corrida entra em searching_driver';

-- ============================================
-- 4. VALIDAÇÃO
-- ============================================

-- Verificar se tabela foi criada
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ride_dispatch_audit') THEN
    RAISE NOTICE '✅ Tabela ride_dispatch_audit criada';
  ELSE
    RAISE EXCEPTION '❌ Falha ao criar tabela ride_dispatch_audit';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_auto_dispatch_on_searching') THEN
    RAISE NOTICE '✅ Trigger trigger_auto_dispatch_on_searching criado';
  ELSE
    RAISE EXCEPTION '❌ Falha ao criar trigger';
  END IF;
END $$;

COMMIT;

-- ============================================
-- 5. TESTES
-- ============================================

-- Ver estrutura da tabela
\d ride_dispatch_audit

-- Ver triggers ativos
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_dispatch_on_searching';

-- Ver policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'ride_dispatch_audit';

SELECT '✅ SQL aplicado com sucesso!' as status;
