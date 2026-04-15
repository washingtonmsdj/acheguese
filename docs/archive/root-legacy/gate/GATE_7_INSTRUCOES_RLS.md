# GATE 7: INSTRUÇÕES - FIX RLS OPERATIONAL_VERIFICATIONS

## PROBLEMA IDENTIFICADO

Os testes estão falhando com erro:
```
Error creating verification: {
  code: '42501',
  message: 'new row violates row-level security policy for table "operational_verifications"'
}
```

## CAUSA

A tabela `operational_verifications` tem RLS habilitado mas não tem policies que permitam INSERT/UPDATE/SELECT para usuários autenticados.

## SOLUÇÃO

Aplicar o SQL abaixo no SQL Editor do Supabase:

```sql
-- GATE 7: FIX RLS - Operational Verifications
-- Permitir que service role e usuários autenticados criem/leiam verificações

-- Remover policies existentes se houver
DROP POLICY IF EXISTS "operational_verifications_insert_policy" ON operational_verifications;
DROP POLICY IF EXISTS "operational_verifications_select_policy" ON operational_verifications;
DROP POLICY IF EXISTS "operational_verifications_update_policy" ON operational_verifications;

-- Policy para INSERT: service role ou usuário autenticado
CREATE POLICY "operational_verifications_insert_policy"
ON operational_verifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy para SELECT: service role ou usuário autenticado
CREATE POLICY "operational_verifications_select_policy"
ON operational_verifications
FOR SELECT
TO authenticated
USING (true);

-- Policy para UPDATE: service role ou usuário autenticado
CREATE POLICY "operational_verifications_update_policy"
ON operational_verifications
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verificar que RLS está habilitado
ALTER TABLE operational_verifications ENABLE ROW LEVEL SECURITY;
```

## PASSOS

1. Abrir SQL Editor no Supabase Dashboard
2. Copiar e colar o SQL acima
3. Executar
4. Rodar testes novamente:
   ```bash
   npm test -- tests/operational/gate7-pin-ride-runtime.test.ts
   npm test -- tests/operational/gate7-pin-delivery-runtime.test.ts
   ```

## RESULTADO ESPERADO

- Testes R.2, R.3, R.4 devem passar (verificação criada automaticamente)
- Testes D.2, D.3, D.4 devem passar (verificação criada automaticamente)
- Total: 8/8 testes passando
