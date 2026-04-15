-- ============================================================================
-- CONSOLIDAÇÃO DO TRIGGER DE CRIAÇÃO DE PERFIL
--
-- Problema: dois triggers conflitantes criavam perfis incompletos:
--   - handle_new_user_profile: populava handle/contact_email, mas não city/neighborhood/state/username
--   - handle_new_user: populava city/neighborhood/state/username, mas não handle/contact_email
--
-- Solução: uma única função canônica que popula todos os campos relevantes,
-- lendo corretamente o raw_user_meta_data enviado pelo AuthService.signUp.
-- ============================================================================

-- 1. Garantir extensão unaccent disponível (necessária para generate_unique_handle)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Recriar generate_unique_handle de forma idempotente
CREATE OR REPLACE FUNCTION public.generate_unique_handle(base_handle TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate TEXT;
  counter   INTEGER := 0;
  clean     TEXT;
BEGIN
  clean := lower(regexp_replace(
    unaccent(base_handle),
    '[^a-z0-9_]', '_', 'g'
  ));
  clean := regexp_replace(clean, '_+', '_', 'g');
  clean := trim(both '_' from clean);
  IF length(clean) < 3 THEN
    clean := clean || '_user';
  END IF;
  clean := left(clean, 27);
  candidate := clean;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE handle = candidate) THEN
      RETURN candidate;
    END IF;
    counter := counter + 1;
    candidate := left(clean, 24) || '_' || lpad(counter::TEXT, 3, '0');
  END LOOP;
END;
$$;

-- 3. Função canônica única — substitui handle_new_user E handle_new_user_profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name         TEXT;
  v_display_name TEXT;
  v_handle_base  TEXT;
  v_handle       TEXT;
  v_username     TEXT;
  v_city         TEXT;
  v_neighborhood TEXT;
  v_state        TEXT;
BEGIN
  -- Nome: preferir metadata, fallback para parte local do email
  v_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1)
  );

  v_display_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''),
    v_name
  );

  -- Handle: preferir handle explícito do metadata, senão derivar do nome
  v_handle_base := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'handle'), ''),
    v_name
  );
  v_handle := public.generate_unique_handle(v_handle_base);

  -- Username: mesmo valor do handle (são sinônimos neste sistema)
  v_username := v_handle;

  -- Localização
  v_city         := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'city'), ''), '');
  v_neighborhood := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'neighborhood', '')), '');
  v_state        := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'state'), ''), 'BA');

  INSERT INTO public.profiles (
    user_id,
    profile_type,
    handle,
    username,
    name,
    display_name,
    contact_email,
    city,
    neighborhood,
    state,
    is_active,
    is_public,
    verified,
    country
  ) VALUES (
    NEW.id,
    'personal',
    v_handle,
    v_username,
    v_name,
    v_display_name,
    NEW.email,
    v_city,
    v_neighborhood,
    v_state,
    true,
    false,
    false,
    'BR'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. Garantir que existe apenas UM trigger em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Permissões
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_unique_handle(TEXT) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.handle_new_user IS
  'Trigger canônico: cria perfil personal completo ao inserir em auth.users. '
  'Popula handle, username, contact_email, city, neighborhood, state a partir do raw_user_meta_data.';
