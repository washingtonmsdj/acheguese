# GATE 7: APLICAR MIGRATION RLS OFICIAL

## MIGRATION CRIADA

`supabase/migrations/20260408000004_gate7_operational_verifications_rls.sql`

## POLICIES IMPLEMENTADAS

### 1. SELECT - Apenas Participantes da Ride

```sql
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
```

**Regra:** Usuário autenticado só pode ler se for passageiro OU motorista da ride.

### 2. INSERT - Apenas Requester/Passageiro

```sql
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
```

**Regra:** Usuário autenticado só pode inserir se for o passageiro/requester da ride.  
**Nota:** Service role bypassa RLS e pode inserir livremente (usado no fluxo automático).

### 3. UPDATE - Participantes da Ride

```sql
CREATE POLICY "operational_verifications_update_by_participant"
ON operational_verifications
FOR UPDATE
TO authenticated
USING (...)
WITH CHECK (...);
```

**Regra:** Usuário autenticado só pode atualizar se for passageiro OU motorista da ride.  
**Uso:** Motorista atualiza status ao verificar PIN.

### 4. DELETE - Apenas Service Role

**Sem policy para authenticated.**  
Service role bypassa RLS automaticamente e pode deletar.

## PASSOS PARA APLICAR

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# Aplicar migration
npx supabase db push

# Ou aplicar migration específica
npx supabase migration up
```

### Opção 2: Via SQL Editor (Manual)

1. Abrir SQL Editor no Supabase Dashboard
2. Copiar conteúdo de `supabase/migrations/20260408000004_gate7_operational_verifications_rls.sql`
3. Executar
4. Verificar que não há erros

## VALIDAÇÃO

Após aplicar, executar `VALIDAR_GATE7_RLS.sql` para verificar policies:

```sql
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'operational_verifications'
ORDER BY policyname;
```

**Resultado esperado:**
- `operational_verifications_insert_by_requester` (INSERT, authenticated)
- `operational_verifications_select_by_participant` (SELECT, authenticated)
- `operational_verifications_update_by_participant` (UPDATE, authenticated)

## DIFERENÇAS DO FIX ANTERIOR (REJEITADO)

### ❌ ANTES (Permissivo - ERRADO)

```sql
CREATE POLICY "operational_verifications_insert_policy"
ON operational_verifications
FOR INSERT
TO authenticated
WITH CHECK (true); -- LIBERA PARA TODO AUTHENTICATED
```

### ✅ AGORA (Restritivo - CORRETO)

```sql
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
); -- APENAS PASSAGEIRO DA RIDE
```

## PRÓXIMOS PASSOS

1. Aplicar migration
2. Executar testes Gate 7
3. Executar regressão Gate 6
4. Criar relatório final
