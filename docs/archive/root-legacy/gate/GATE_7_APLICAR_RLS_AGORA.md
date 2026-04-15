# GATE 7: APLICAR RLS AGORA - AÇÃO MANUAL NECESSÁRIA

## SITUAÇÃO

Migration criada em `supabase/migrations/20260408000004_gate7_operational_verifications_rls.sql` mas histórico de migrations está dessincronizado com remoto.

## SOLUÇÃO: APLICAR VIA SQL EDITOR

### PASSO 1: Abrir SQL Editor

1. Acessar Supabase Dashboard
2. Ir em "SQL Editor"
3. Criar nova query

### PASSO 2: Copiar e Executar SQL

Copiar TODO o conteúdo abaixo e executar:

```sql
-- GATE 7: RLS CORRETO - Operational Verifications
-- Policies baseadas em participantes da ride (passenger/driver)
-- Sem liberar tabela para todo authenticated

-- ============================================
-- REMOVER POLICIES PERMISSIVAS (se existirem)
-- ============================================

DROP POLICY IF EXISTS "operational_verifications_insert_policy" ON operational_verifications;
DROP POLICY IF EXISTS "operational_verifications_select_policy" ON operational_verifications;
DROP POLICY IF EXISTS "operational_verifications_update_policy" ON operational_verifications;
DROP POLICY IF EXISTS "operational_verifications_delete_policy" ON operational_verifications;

-- ============================================
-- POLICY: SELECT
-- Permitir leitura apenas para participantes da ride
-- ============================================

CREATE POLICY "operational_verifications_select_by_participant"
ON operational_verifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ride_requests rr
    INNER JOIN profiles p_passenger ON p_passenger.id = rr.passenger_profile_id
    LEFT JOIN profiles p_driver ON p_driver.id = rr.driver_profile_id
    WHERE rr.id = operational_verifications.ride_id
    AND (
      p_passenger.user_id = auth.uid()
      OR p_driver.user_id = auth.uid()
    )
  )
);

-- ============================================
-- POLICY: INSERT
-- Permitir insert apenas para o passageiro/requester da ride
-- Service role tem acesso total via bypass RLS
-- ============================================

CREATE POLICY "operational_verifications_insert_by_requester"
ON operational_verifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ride_requests rr
    INNER JOIN profiles p ON p.id = rr.passenger_profile_id
    WHERE rr.id = operational_verifications.ride_id
    AND p.user_id = auth.uid()
  )
);

-- ============================================
-- POLICY: UPDATE
-- Permitir update apenas para participantes da ride
-- (passageiro pode criar, motorista pode verificar)
-- ============================================

CREATE POLICY "operational_verifications_update_by_participant"
ON operational_verifications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ride_requests rr
    INNER JOIN profiles p_passenger ON p_passenger.id = rr.passenger_profile_id
    LEFT JOIN profiles p_driver ON p_driver.id = rr.driver_profile_id
    WHERE rr.id = operational_verifications.ride_id
    AND (
      p_passenger.user_id = auth.uid()
      OR p_driver.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ride_requests rr
    INNER JOIN profiles p_passenger ON p_passenger.id = rr.passenger_profile_id
    LEFT JOIN profiles p_driver ON p_driver.id = rr.driver_profile_id
    WHERE rr.id = operational_verifications.ride_id
    AND (
      p_passenger.user_id = auth.uid()
      OR p_driver.user_id = auth.uid()
    )
  )
);

-- ============================================
-- GARANTIR QUE RLS ESTÁ HABILITADO
-- ============================================

ALTER TABLE operational_verifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COMENTÁRIOS PARA AUDITORIA
-- ============================================

COMMENT ON POLICY "operational_verifications_select_by_participant" ON operational_verifications IS 
'GATE 7: Permite leitura apenas para passageiro ou motorista da ride associada';

COMMENT ON POLICY "operational_verifications_insert_by_requester" ON operational_verifications IS 
'GATE 7: Permite insert apenas para o passageiro/requester da ride. Service role bypassa RLS.';

COMMENT ON POLICY "operational_verifications_update_by_participant" ON operational_verifications IS 
'GATE 7: Permite update apenas para passageiro ou motorista da ride (ex: motorista verifica PIN)';
```

### PASSO 3: Verificar Policies Criadas

Executar query de validação:

```sql
SELECT 
  policyname,
  cmd,
  roles,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'operational_verifications'
ORDER BY policyname;
```

**Resultado esperado:**
```
policyname                                          | cmd    | roles          | has_using | has_with_check
----------------------------------------------------|--------|----------------|-----------|---------------
operational_verifications_insert_by_requester       | INSERT | {authenticated}| false     | true
operational_verifications_select_by_participant     | SELECT | {authenticated}| true      | false
operational_verifications_update_by_participant     | UPDATE | {authenticated}| true      | true
```

### PASSO 4: Executar Testes

Após aplicar RLS, executar:

```bash
npm test -- tests/operational/gate7-pin-ride-runtime.test.ts
npm test -- tests/operational/gate7-pin-delivery-runtime.test.ts
```

**Resultado esperado:** 8/8 testes passando

### PASSO 5: Regressão Gate 6

```bash
npm test -- tests/operational/gate6-runtime-with-drivers.test.ts
npm test -- tests/operational/gate6-runtime-no-drivers.test.ts
npm test -- tests/operational/gate6-motoboy-runtime.test.ts
```

**Resultado esperado:** 9/9 testes passando

## DIFERENÇA DO FIX ANTERIOR

### ❌ REJEITADO (Permissivo)
```sql
WITH CHECK (true) -- Libera para TODO authenticated
```

### ✅ CORRETO (Restritivo)
```sql
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ride_requests rr
    INNER JOIN profiles p ON p.id = rr.passenger_profile_id
    WHERE rr.id = operational_verifications.ride_id
    AND p.user_id = auth.uid()
  )
) -- Apenas passageiro da ride
```

## SEGURANÇA

- ✅ Passageiro só acessa verificações das próprias rides
- ✅ Motorista só acessa verificações das rides atribuídas
- ✅ Usuário sem relação com ride NÃO acessa
- ✅ Service role bypassa RLS (fluxo automático)
- ✅ Sem DELETE para authenticated (apenas service role)
