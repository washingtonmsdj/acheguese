# SOLUÇÃO: PRICING RLS NÃO ESTÁ BLOQUEANDO INSERT

## PROBLEMA IDENTIFICADO
Usuário authenticated consegue criar regras de pricing quando deveria apenas ler.

## CAUSA
Uma das seguintes:
1. RLS não está habilitado na tabela pricing_rules
2. Existe uma policy permitindo INSERT para authenticated
3. A policy de SELECT está sendo interpretada como ALL

## SOLUÇÃO MANUAL VIA SQL EDITOR

Aplicar o SQL abaixo via SQL Editor do Supabase Dashboard:

```sql
-- 1. Verificar estado atual
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'pricing_rules';

SELECT policyname, cmd, roles::text[]
FROM pg_policies
WHERE tablename = 'pricing_rules'
ORDER BY policyname;

-- 2. Garantir que RLS está habilitado
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- 3. Remover TODAS as policies não-service_role
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'pricing_rules' 
    AND policyname NOT LIKE 'service_role%'
  LOOP
    EXECUTE 'DROP POLICY ' || quote_ident(r.policyname) || ' ON pricing_rules';
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- 4. Criar apenas policy de SELECT
CREATE POLICY "users_read_active_pricing"
  ON pricing_rules 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

-- 5. Verificar resultado final
SELECT policyname, cmd, roles::text[]
FROM pg_policies
WHERE tablename = 'pricing_rules'
ORDER BY policyname;

-- Deve mostrar apenas 2 policies:
-- - service_role_all_pricing_rules (ALL, service_role)
-- - users_read_active_pricing (SELECT, authenticated)
```

## VALIDAÇÃO

Após aplicar, executar:
```bash
node testar_insert_pricing.mjs
```

Resultado esperado:
```
✅ BLOQUEADO: new row violates row-level security policy
```

Depois executar:
```bash
node validar_rls_auth_real.mjs
```

Resultado esperado:
```
📈 Score: 7/7 (100%)
🎉 RLS VALIDADO COM AUTH REAL!
```

## PRÓXIMOS PASSOS APÓS CORREÇÃO

1. Re-deploy Edge Function
2. Testar rate limiting
3. Validar fluxos no navegador
4. Gerar relatório final
