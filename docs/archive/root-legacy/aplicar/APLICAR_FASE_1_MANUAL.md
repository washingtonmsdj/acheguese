# APLICAÇÃO MANUAL DA FASE 1 - SUPABASE REMOTO

**Situação**: Há migrations antigas com conflitos que impedem `supabase db push`  
**Solução**: Aplicar migrations da Fase 1 manualmente via Supabase Dashboard

---

## PASSO 1: Abrir Supabase Dashboard

```
https://supabase.com/dashboard/project/[SEU_PROJECT_ID]
```

Ou acesse: https://supabase.com/dashboard e selecione seu projeto

---

## PASSO 2: Ir para SQL Editor

No menu lateral: **SQL Editor** → **New Query**

---

## PASSO 3: Aplicar Migrations em Ordem

### Migration 1: Extensões

Copiar e executar: `supabase/migrations/20260327100001_multi_perfil_extensions.sql`

```sql
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Migration 2: ALTER profiles

Copiar e executar: `supabase/migrations/20260327100002_multi_perfil_alter_profiles.sql`

### Migration 3: Índices profiles

Copiar e executar: `supabase/migrations/20260327100003_multi_perfil_indexes_profiles.sql`

### Migration 4: ALTER profile_members

Copiar e executar: `supabase/migrations/20260327100004_multi_perfil_alter_profile_members.sql`

### Migration 5: CREATE profile_links

Copiar e executar: `supabase/migrations/20260327100005_multi_perfil_create_profile_links.sql`

### Migration 6: Triggers

Copiar e executar: `supabase/migrations/20260327100006_multi_perfil_triggers.sql`

### Migration 7: ALTER business_data

Copiar e executar: `supabase/migrations/20260327100007_multi_perfil_alter_business_data.sql`

### Migration 8: ALTER professional_data

Copiar e executar: `supabase/migrations/20260327100008_multi_perfil_alter_professional_data.sql`

### Migration 9: CREATE driver_data

Copiar e executar: `supabase/migrations/20260327100009_multi_perfil_create_driver_data.sql`

### Migration 10: CREATE admin tables

Copiar e executar: `supabase/migrations/20260327100010_multi_perfil_create_admin_tables.sql`

---

## PASSO 4: Verificar Aplicação

Executar no SQL Editor:

```sql
-- Verificar extensões
SELECT * FROM pg_extension WHERE extname IN ('citext', 'postgis');

-- Verificar novos campos em profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('handle', 'show_contact_email', 'is_public');

-- Verificar tabelas novas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profile_links', 'driver_data', 'admin_users', 'profile_audit_log');

-- Verificar triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%profile%';
```

---

## PASSO 5: Verificar se Migrations Foram Aplicadas

Após aplicar todas as migrations, verificar no SQL Editor:

```sql
-- 1. Verificar extensões
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('citext', 'postgis');
-- Resultado esperado: 2 rows

-- 2. Verificar novos campos em profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('handle', 'show_contact_email', 'is_public', 'contact_email');
-- Resultado esperado: 4 rows

-- 3. Verificar tabelas novas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profile_links', 'driver_data', 'admin_users', 'profile_audit_log');
-- Resultado esperado: 4 rows

-- 4. Verificar triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%profile%' 
AND trigger_schema = 'public';
-- Resultado esperado: 6+ rows

-- 5. Verificar índices
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%profile%' 
AND indexname LIKE '%unique%';
-- Resultado esperado: 5+ rows
```

---

## RESULTADO ESPERADO

✅ 2 extensões instaladas (citext, postgis)  
✅ profiles com 13 campos novos  
✅ 4 partial unique indexes em profiles  
✅ profile_members com 2 campos novos + constraint  
✅ profile_links criada  
✅ 6 triggers criados  
✅ business_data com 12 campos novos  
✅ professional_data com 11 campos novos  
✅ driver_data criada  
✅ admin_users e profile_audit_log criadas  

---

## ⚠️ IMPORTANTE: BACKUP

**ANTES de aplicar em produção**:

1. Fazer backup do banco via Dashboard:
   - Database → Backups → Create Backup

2. Ou via CLI:
   ```bash
   supabase db dump -f backup_pre_fase1.sql
   ```

---

## 🔄 ROLLBACK (Se Necessário)

Se algo der errado, restaurar backup:

1. Via Dashboard: Database → Backups → Restore
2. Ou via CLI: `supabase db reset`

---

## PRÓXIMO PASSO

Após aplicação bem-sucedida e verificação OK:

✅ **Fase 1 COMPLETA**  
⏭️ **Iniciar Fase 2**: RLS, Views Públicas, RPCs e Permissões

Ver: `PLANO_EXECUCAO_FASES.md` para detalhes da Fase 2
