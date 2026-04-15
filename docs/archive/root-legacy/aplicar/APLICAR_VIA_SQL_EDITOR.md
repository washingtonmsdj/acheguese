# APLICAR VIA SQL EDITOR DO SUPABASE

## PROBLEMA
O usuário authenticated consegue criar regras de pricing quando deveria apenas ler.

## SOLUÇÃO
Aplicar o SQL abaixo via SQL Editor do Supabase Dashboard:

```sql
-- Remover TODAS as policies de authenticated para pricing_rules
DROP POLICY IF EXISTS "users_read_active_pricing" ON pricing_rules;
DROP POLICY IF EXISTS "authenticated_read_pricing" ON pricing_rules;
DROP POLICY IF EXISTS "authenticated_insert_pricing" ON pricing_rules;
DROP POLICY IF EXISTS "authenticated_update_pricing" ON pricing_rules;
DROP POLICY IF EXISTS "authenticated_delete_pricing" ON pricing_rules;
DROP POLICY IF EXISTS "Enable read access for all users" ON pricing_rules;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON pricing_rules;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON pricing_rules;

-- Recriar apenas SELECT para authenticated
CREATE POLICY "users_read_active_pricing"
  ON pricing_rules FOR SELECT TO authenticated
  USING (is_active = true);

-- Verificar resultado
SELECT 
  policyname,
  cmd,
  roles::text[]
FROM pg_policies
WHERE tablename = 'pricing_rules'
ORDER BY policyname;
```

## PASSOS
1. Abrir https://supabase.com/dashboard
2. Selecionar projeto
3. SQL Editor
4. Colar SQL acima
5. Run
6. Verificar resultado: apenas 2 policies devem existir
   - service_role_all_pricing_rules (ALL)
   - users_read_active_pricing (SELECT)

## VALIDAR
Após aplicar, executar:
```bash
node validar_rls_auth_real.mjs
```

Resultado esperado: 7/7 (100%)
