# Instruções para Aplicar Migration no Supabase

## PASSO 1: Aplicar Migration Manualmente

A migration precisa ser aplicada manualmente no Supabase Dashboard:

1. Acesse: https://xhdowzacfujckjelqhtd.supabase.co
2. Vá em: **SQL Editor**
3. Clique em: **New Query**
4. Copie todo o conteúdo do arquivo: `supabase/migrations/20260329000011_business_slug_history.sql`
5. Cole no editor SQL
6. Clique em: **Run**

## PASSO 2: Validar Estrutura Criada

Após aplicar, execute estas queries no SQL Editor para confirmar:

```sql
-- Verificar tabela
SELECT * FROM business_slug_history LIMIT 1;

-- Verificar índices
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'business_slug_history'
ORDER BY indexname;

-- Verificar trigger
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'trg_business_slug_history';

-- Verificar função
SELECT proname 
FROM pg_proc 
WHERE proname = 'fn_record_business_slug_history';

-- Verificar FK
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'business_slug_history'::regclass 
AND contype = 'f';
```

## PASSO 3: Testar Fluxo Ponta a Ponta

Execute o script de validação:

```bash
npx tsx scripts/validate-slug-history-real.ts
```

Este script irá:
- Buscar uma empresa existente
- Alterar o slug
- Verificar se o histórico foi registrado
- Testar resolução de URL antiga
- Validar redirect 308
- Confirmar 404 para URLs inexistentes
