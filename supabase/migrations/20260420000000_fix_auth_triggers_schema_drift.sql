-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Corrigir drift de schema nos triggers de auth.users
-- ══════════════════════════════════════════════════════════════════════════
--
-- PROBLEMA:
--   Duas migrations anteriores alteraram o schema mas não atualizaram
--   os triggers correspondentes, causando "Database error creating new user"
--   em qualquer tentativa de criar usuário via Auth API.
--
-- CAUSA RAIZ:
--   1. 20260418000001_migrate_user_roles_to_new_structure.sql
--      → Adicionou coluna `role_enum` NOT NULL em user_roles
--      → Mas handle_new_user() continuou inserindo só em `role_enum`,
--        ignorando a coluna `role` (TEXT NOT NULL) que ainda existe
--
--   2. 20260418150001_alter_user_subscriptions.sql
--      → Recriou initialize_user_free_subscription() usando
--        current_period_start / current_period_end
--      → Mas a tabela user_subscriptions usa started_at / expires_at
--        (colunas originais nunca foram renomeadas)
--      → Também usava ON CONFLICT (user_id) sem unique constraint em user_id
--
--   3. handle_new_user() usava full_name em profiles
--      → Tabela profiles não tem full_name (usa display_name + name)
--      → Também usava ON CONFLICT (user_id) sem unique constraint
--
-- SOLUÇÃO:
--   Recriar ambas as funções alinhadas com o schema real do banco.
--
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Corrigir handle_new_user ───────────────────────────────────────────
--
-- Alinhado com schema real de:
--   - profiles: colunas user_id, username, display_name, name (sem full_name)
--   - user_roles: colunas role (TEXT NOT NULL) + role_enum (app_role NOT NULL)
--   - Sem ON CONFLICT inválido (nenhuma das tabelas tem unique em user_id)
--
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name TEXT;
  v_username     TEXT;
BEGIN
  -- Derivar display_name do metadata ou do email
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Derivar username: lowercase, só alfanumérico/hífen, sufixo do UUID
  v_username := LOWER(REGEXP_REPLACE(
    v_display_name || '-' || SUBSTRING(NEW.id::text, 1, 8),
    '[^a-z0-9_-]', '-', 'g'
  ));

  -- Criar profile (sem ON CONFLICT — não há unique em user_id)
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = NEW.id) THEN
    INSERT INTO profiles (user_id, username, display_name, name)
    VALUES (NEW.id, v_username, v_display_name, v_display_name);
  END IF;

  -- Criar role padrão (role TEXT + role_enum app_role, ambos NOT NULL)
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO user_roles (user_id, role, role_enum, reason)
    VALUES (NEW.id, 'user', 'user', 'Role padrão no signup');
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION handle_new_user() IS
'Cria profile e role padrão ao registrar novo usuário. '
'Alinhado com schema real: profiles(display_name, name) e user_roles(role + role_enum).';

-- ── 2. Corrigir initialize_user_free_subscription ────────────────────────
--
-- Alinhado com schema real de user_subscriptions:
--   - started_at / expires_at  (não current_period_start / current_period_end)
--   - plan_type TEXT NOT NULL  (coluna obrigatória sem default)
--   - Sem ON CONFLICT (user_id) — não há unique constraint em user_id
--
CREATE OR REPLACE FUNCTION initialize_user_free_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_subscriptions WHERE user_id = NEW.id) THEN
    INSERT INTO user_subscriptions (
      user_id,
      plan_type,
      plan_code,
      status,
      started_at,
      expires_at
    ) VALUES (
      NEW.id,
      'free',
      'free',
      'active',
      NOW(),
      NOW() + INTERVAL '100 years'
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION initialize_user_free_subscription() IS
'Cria assinatura free ao registrar novo usuário. '
'Alinhado com schema real: started_at/expires_at/plan_type (não current_period_start).';

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
