# ETAPA 12B — INSTRUÇÕES DE APLICAÇÃO MANUAL

## Problema Identificado

As migrations da ETAPA 12 dependem de migrations anteriores que têm erros:
- `20260328000017_create_governance_tables.sql` - referencia `user_profiles` inexistente
- `20260328000018_enable_postgis_and_geometry.sql` - parâmetro `location_type` duplicado

## Solução: Aplicação Manual via SQL Editor

### Passo 1: Acessar SQL Editor do Supabase

1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql
2. Faça login se necessário

### Passo 2: Aplicar Migrations da ETAPA 12 (em ordem)

Execute cada migration abaixo no SQL Editor:

#### Migration 1: user_residences
```sql
-- Arquivo: supabase/migrations/20260328000028_harden_and_cleanup_user_residences.sql
-- Copie o conteúdo completo do arquivo e execute
```

#### Migration 2: ride_requests
```sql
-- Arquivo: supabase/migrations/20260328000029_harden_and_cleanup_ride_requests.sql
-- Copie o conteúdo completo do arquivo e execute
```

#### Migration 3: business_data
```sql
-- Arquivo: supabase/migrations/20260328000030_harden_and_cleanup_business_data.sql
-- Copie o conteúdo completo do arquivo e execute
```

#### Migration 4: professional_data
```sql
-- Arquivo: supabase/migrations/20260328000031_harden_and_cleanup_professional_data.sql
-- Copie o conteúdo completo do arquivo e execute
```

### Passo 3: Validar Aplicação

Após aplicar as 4 migrations, execute o script de validação:

```bash
npx tsx scripts/validate-etapa12-remote.ts
```

## Alternativa: Corrigir Migrations Anteriores

Se preferir usar `supabase db push`, primeiro corrija:

1. `20260328000017_create_governance_tables.sql` - substituir `user_profiles` por `admin_users`
2. `20260328000018_enable_postgis_and_geometry.sql` - renomear parâmetro `location_type` para `target_location_type`

Depois execute:
```bash
supabase db push --include-all
```

## Status Atual

- ✅ ETAPA 12A: Implementação local completa
- ⏳ ETAPA 12B: Aguardando aplicação no banco remoto
- ⏳ Validação real com dados pendente
