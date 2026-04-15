-- ============================================================================
-- AUTO-CREATE PERSONAL PROFILE ON SIGNUP
-- Cria automaticamente um perfil personal quando um novo usuário é criado
-- em auth.users. O handle é derivado do user_metadata ou do email.
-- ============================================================================

-- Função auxiliar: gera handle único a partir de uma string base
CREATE OR REPLACE FUNCTION generate_unique_handle(base_handle TEXT)
RETURNS TEXT AS $$
DECLARE
  candidate TEXT;
  counter   INTEGER := 0;
  clean     TEXT;
BEGIN
  -- Limpar: lowercase, remover acentos, substituir espaços/especiais por _
  clean := lower(regexp_replace(
    unaccent(base_handle),
    '[^a-z0-9_]', '_', 'g'
  ));
  -- Remover underscores duplos e bordas
  clean := regexp_replace(clean, '_+', '_', 'g');
  clean := trim(both '_' from clean);
  -- Garantir mínimo de 3 chars
  IF length(clean) < 3 THEN
    clean := clean || '_user';
  END IF;
  -- Truncar em 30 chars
  clean := left(clean, 30);

  candidate := clean;

  LOOP
    -- Verificar se handle já existe
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE handle = candidate) THEN
      RETURN candidate;
    END IF;
    counter := counter + 1;
    candidate := left(clean, 27) || '_' || counter::TEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função principal: cria perfil personal ao criar usuário
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_display_name TEXT;
  v_handle_base  TEXT;
  v_handle       TEXT;
  v_email_local  TEXT;
BEGIN
  -- Extrair display_name do metadata ou fallback para parte local do email
  v_display_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1)
  );

  -- Base para o handle: preferir handle explícito, senão derivar do display_name
  v_handle_base := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'handle'), ''),
    v_display_name
  );

  -- Gerar handle único
  v_handle := generate_unique_handle(v_handle_base);

  -- Inserir perfil personal
  INSERT INTO profiles (
    user_id,
    profile_type,
    handle,
    display_name,
    name,
    contact_email,
    is_active,
    is_public,
    verified,
    country
  ) VALUES (
    NEW.id,
    'personal',
    v_handle,
    v_display_name,
    v_display_name,
    NEW.email,
    true,
    false,   -- privado por padrão, usuário decide tornar público
    false,
    'BR'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Nunca bloquear o signup por falha no perfil
    RAISE WARNING 'handle_new_user_profile failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: dispara após inserção em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();

-- Permissões
GRANT EXECUTE ON FUNCTION handle_new_user_profile() TO service_role;
GRANT EXECUTE ON FUNCTION generate_unique_handle(TEXT) TO service_role;

COMMENT ON FUNCTION handle_new_user_profile IS
  'Cria automaticamente um perfil personal ao criar auth.users. Nunca bloqueia o signup.';
COMMENT ON FUNCTION generate_unique_handle IS
  'Gera handle único derivado de uma string base, com sufixo numérico se necessário.';
