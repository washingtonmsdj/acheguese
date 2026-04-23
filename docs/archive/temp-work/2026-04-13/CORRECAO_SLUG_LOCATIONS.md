# 🔧 Correção: Campo slug em locations

## Problema Identificado

```
Error: Failed to run sql query: ERROR: 23502: 
null value in column "slug" of relation "locations" 
violates not-null constraint
```

## Causa

A tabela `locations` tem uma constraint `NOT NULL` no campo `slug`, mas os INSERTs não estavam incluindo esse campo.

## Solução Aplicada ✅

Adicionado campo `slug` em todos os INSERTs de localizações:

```sql
-- ANTES (❌ Erro)
INSERT INTO locations (id, name, type, geographic_path, ...)

-- DEPOIS (✅ Correto)
INSERT INTO locations (id, name, slug, type, geographic_path, ...)
VALUES (..., 'bahia', ...)
```

## Slugs Definidos

| Location | Slug |
|----------|------|
| Bahia | `bahia` |
| Salvador | `salvador` |
| Itaigara | `itaigara` |
| Pelourinho | `pelourinho` |
| Barra | `barra` |
| Rio Vermelho | `rio-vermelho` |

## Arquivos Corrigidos ✅

1. ✅ `supabase/migrations/20260413000002_seed_locations.sql`
2. ✅ `APLICAR_NO_SUPABASE_SQL_EDITOR.sql`

## Como Aplicar Agora

O SQL está corrigido. Você pode aplicar normalmente:

1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql
2. Copie o conteúdo de `APLICAR_NO_SUPABASE_SQL_EDITOR.sql`
3. Cole no SQL Editor
4. Execute (Ctrl+Enter)

Agora deve funcionar sem erros! 🎉

## Verificação

Após aplicar, verifique:

```sql
SELECT geographic_path, name, slug, type
FROM locations
WHERE geographic_path LIKE 'ba%'
ORDER BY geographic_path;
```

Resultado esperado:
```
ba                      | Bahia        | bahia        | state
ba/salvador             | Salvador     | salvador     | city
ba/salvador/barra       | Barra        | barra        | district
ba/salvador/itaigara    | Itaigara     | itaigara     | district
ba/salvador/pelourinho  | Pelourinho   | pelourinho   | district
ba/salvador/rio-vermelho| Rio Vermelho | rio-vermelho | district
```

---

**Data**: 2026-04-13
**Status**: ✅ Corrigido
