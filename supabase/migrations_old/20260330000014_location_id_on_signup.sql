-- ============================================================================
-- LOCATION_ID NO CADASTRO
--
-- Problema: o trigger handle_new_user salvava apenas strings (city, neighborhood,
-- state) no perfil. O location_id (UUID canônico da tabela locations) ficava NULL.
-- Isso tornava o vínculo territorial frágil — qualquer mudança de nome quebrava.
--
-- Solução:
--   1. O frontend passa neighborhood_id (UUID) no raw_user_meta_data
--   2. O trigger lê esse UUID e cria automaticamente um registro em user_residences
--      com location_id = neighborhood_id
--   3. useUserTerritory resolve por UUID, nunca por string
--
-- Resultado: integridade referencial real. Renomear bairro/cidade/estado no banco
-- não afeta nenhum usuário existente.
-- ============================================================================

-- Recriar handle_new_user com suporte a neighborhood_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name              TEXT;
  v_display_name      TEXT;
  v_handle_base       TEXT;
  v_handle            TEXT;
  v_username          TEXT;
  v_city              TEXT;
  v_neighborhood      TEXT;
  v_state             TEXT;
  v_neighborhood_id   UUID;
  v_profile_id        UUID;
BEGIN
  -- ── Dados pessoais ────────────────────────────────────────────────
  v_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1)
  );

  v_display_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''),
    v_name
  );

  v_handle_base := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'handle'), ''),
    v_name
  );
  v_handle   := public.generate_unique_handle(v_handle_base);
  v_username := v_handle;

  -- ── Localização (strings legíveis — mantidas para exibição) ───────
  v_city         := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'city'), ''), '');
  v_neighborhood := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'neighborhood', '')), '');
  v_state        := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'state'), ''), 'BA');

  -- ── UUID canônico do bairro (SSOT) ────────────────────────────────
  BEGIN
    v_neighborhood_id := (NEW.raw_user_meta_data->>'neighborhood_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_neighborhood_id := NULL;
  END;

  -- ── Criar perfil ──────────────────────────────────────────────────
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
  )
  RETURNING id INTO v_profile_id;

  -- ── Criar residência canônica se neighborhood_id foi fornecido ────
  -- Valida que o location_id existe e é um district ativo antes de inserir.
  IF v_neighborhood_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.locations
      WHERE id = v_neighborhood_id
        AND type = 'district'
        AND status = 'active'
    ) THEN
      INSERT INTO public.user_residences (
        user_id,
        location_id,
        country,
        is_primary,
        is_verified
      ) VALUES (
        NEW.id,
        v_neighborhood_id,
        'BR',
        true,
        false
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS
  'Trigger canônico: cria perfil personal + user_residence ao inserir em auth.users. '
  'Lê neighborhood_id (UUID) do raw_user_meta_data para criar vínculo territorial '
  'com integridade referencial real na tabela user_residences.';
