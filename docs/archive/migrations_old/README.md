# migrations_old — ARQUIVO HISTÓRICO

**NÃO APLICAR. NÃO SÃO MIGRATIONS ATIVAS.**

Estas migrations foram descartadas e substituídas pelas migrations canônicas em `supabase/migrations/`.

O CLI do Supabase (`supabase db push`, `supabase migration up`) **não lê esta pasta**.
Apenas `supabase/migrations/` é processada pelo CLI.

## Por que estão aqui

Foram movidas de `supabase/migrations_old/` em 2026-03-30 para evitar confusão com migrations ativas.
Mantidas como referência histórica do que foi substituído.

## Conteúdo

| Arquivo | O que fazia | Substituído por |
|---|---|---|
| `20260327000001_create_missing_tables.sql` | Criação de tabelas iniciais | Migrations canônicas em `supabase/migrations/` |
| `20260327000002_fix_user_roles_rls.sql` | RLS de user_roles | `supabase/migrations/20260327120009_fix_rls_no_recursion.sql` e seguintes |
| `20260327000003_add_verified_alias.sql` | Alias de verified | Consolidado |
| `20260327000004_consolidate_verified.sql` | Consolidação de verified | Consolidado |
| `20260327000005_fix_notifications_schema.sql` | Schema de notifications | Consolidado |
| `20260327000007_create_reviews_reports.sql` | Tabela reviews_reports | Consolidado |
| `20260327000008_create_mobility_tables.sql` | Tabelas de mobilidade | `supabase/migrations/20260327100009_multi_perfil_create_driver_data.sql` e seguintes |
| `20260327000009_fix_banners_priority.sql` | Prioridade de banners | Consolidado |
| `20260327000010_create_coupons.sql` | Tabela coupons | Consolidado |
| `20260327000011_create_business_claims.sql` | Tabela business_claims | Consolidado |
| `20260327000012_create_user_notification_settings.sql` | Configurações de notificação | Consolidado |
| `20260327000013_create_user_blocks.sql` | Tabela user_blocks | Consolidado |
| `20260327000014_add_privacy_fields_to_profiles.sql` | Campos de privacidade | `supabase/migrations/20260327100002_multi_perfil_alter_profiles.sql` |
