# 📊 Schema de Autenticação - SSOT (Single Source of Truth)

## 🎯 Fonte de Verdade

Este documento define a estrutura REAL do banco de dados para autenticação.

## 📋 Schema: auth.users

Tabela gerenciada pelo Supabase Auth. **NÃO modifique diretamente via migrations.**

```sql
-- Estrutura da tabela auth.users (somente leitura para aplicação)
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  encrypted_password VARCHAR(255),
  email_confirmed_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  confirmation_token VARCHAR(255),
  confirmation_sent_at TIMESTAMPTZ,
  recovery_token VARCHAR(255),
  recovery_sent_at TIMESTAMPTZ,
  email_change_token_new VARCHAR(255),
  email_change VARCHAR(255),
  email_change_sent_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB,
  is_super_admin BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  phone VARCHAR(15),
  phone_confirmed_at TIMESTAMPTZ,
  phone_change VARCHAR(15),
  phone_change_token VARCHAR(255),
  phone_change_sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  email_change_token_current VARCHAR(255),
  email_change_confirm_status SMALLINT,
  banned_until TIMESTAMPTZ,
  reauthentication_token VARCHAR(255),
  reauthentication_sent_at TIMESTAMPTZ,
  is_sso_user BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);
```

### Campos Importantes

| Campo | Tipo | Descrição | Uso |
|-------|------|-----------|-----|
| `id` | UUID | ID único do usuário | Chave primária, usado em `profiles.user_id` |
| `email` | VARCHAR | Email do usuário | Usado para login |
| `email_confirmed_at` | TIMESTAMPTZ | Data de confirmação do email | **NULL = não confirmado** |
| `last_sign_in_at` | TIMESTAMPTZ | Último login | Auditoria |
| `banned_until` | TIMESTAMPTZ | Data até quando está banido | **NULL = não banido** |
| `deleted_at` | TIMESTAMPTZ | Data de deleção (soft delete) | **NULL = ativo** |
| `created_at` | TIMESTAMPTZ | Data de criação | Auditoria |

### Estados Válidos

```sql
-- ✅ Usuário OK (pode fazer login)
email_confirmed_at IS NOT NULL
AND banned_until IS NULL
AND deleted_at IS NULL

-- ❌ Email não confirmado (não pode fazer login se confirmação obrigatória)
email_confirmed_at IS NULL

-- 🚫 Usuário banido (não pode fazer login)
banned_until IS NOT NULL AND banned_until > NOW()

-- 🗑️ Usuário deletado (não pode fazer login)
deleted_at IS NOT NULL
```

## 📋 Schema: public.profiles

Tabela gerenciada pela aplicação. **Modificável via migrations.**

```sql
-- Estrutura da tabela public.profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  username VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  profile_type VARCHAR(50) NOT NULL, -- 'user', 'driver', 'restaurant', etc.
  city VARCHAR(100),
  neighborhood VARCHAR(100),
  state VARCHAR(2),
  telefone VARCHAR(20),
  whatsapp VARCHAR(20),
  location_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices importantes
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
```

### Relacionamento

```
auth.users (1) ----< (N) public.profiles
    id                    user_id
```

Um usuário pode ter múltiplos perfis (ex: usuário + motorista).

### Campos Importantes

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `user_id` | UUID | FK para auth.users | ✅ Sim |
| `name` | VARCHAR | Nome completo | ✅ Sim |
| `profile_type` | VARCHAR | Tipo de perfil | ✅ Sim |
| `is_active` | BOOLEAN | Perfil ativo | ✅ Sim (default: true) |
| `verified` | BOOLEAN | Perfil verificado | ❌ Não (default: false) |

## 🔐 RLS (Row Level Security)

### Políticas em public.profiles

```sql
-- Usuários podem ver seus próprios perfis
CREATE POLICY "Users can view own profiles"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios perfis
CREATE POLICY "Users can update own profiles"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem inserir seus próprios perfis
CREATE POLICY "Users can insert own profiles"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Todos podem ver perfis ativos (para listagens públicas)
CREATE POLICY "Anyone can view active profiles"
ON public.profiles FOR SELECT
USING (is_active = true);
```

## 🔄 Fluxo de Autenticação

### 1. Cadastro (Sign Up)
```
1. Supabase cria registro em auth.users
2. Se "Auto Confirm" = false, email_confirmed_at = NULL
3. Supabase envia email de confirmação
4. Usuário clica no link
5. email_confirmed_at = NOW()
6. Trigger cria perfil padrão em public.profiles
```

### 2. Login (Sign In)
```
1. Cliente envia email + senha
2. Supabase valida em auth.users
3. Verifica email_confirmed_at (se confirmação obrigatória)
4. Verifica banned_until
5. Verifica deleted_at
6. Se OK, retorna JWT token
7. Atualiza last_sign_in_at
```

### 3. Sessão
```
1. Cliente armazena JWT no localStorage
2. JWT contém: user_id, email, role
3. JWT expira em 1 hora (padrão)
4. Supabase auto-refresh antes de expirar
5. SessionService carrega perfis do usuário
```

## 📊 Queries de Verificação SSOT

### Verificar estrutura de auth.users
```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth'
  AND table_name = 'users'
ORDER BY ordinal_position;
```

### Verificar estrutura de public.profiles
```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

### Verificar foreign keys
```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'profiles';
```

## ⚠️ Regras Importantes

1. **NUNCA modifique auth.users diretamente via migrations**
   - Use o painel do Supabase ou Auth API

2. **SEMPRE verifique a estrutura antes de criar migrations**
   ```bash
   npx supabase db query --linked "SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';"
   ```

3. **SEMPRE use foreign keys com ON DELETE CASCADE**
   ```sql
   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
   ```

4. **SEMPRE habilite RLS em tabelas públicas**
   ```sql
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   ```

5. **SEMPRE teste políticas RLS**
   ```sql
   -- Como usuário específico
   SET LOCAL role TO authenticated;
   SET LOCAL request.jwt.claims TO '{"sub": "user-uuid-here"}';
   SELECT * FROM profiles; -- Deve retornar apenas perfis do usuário
   ```

## 🔗 Referências

- [Supabase Auth Schema](https://supabase.com/docs/guides/auth/managing-user-data)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)
