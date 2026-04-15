-- ============================================================================
-- ADD location_id TO PROFILE ON SIGNUP
--
-- Problema: O trigger handle_new_user cria user_residence com location_id,
-- mas não preenche o campo location_id no perfil. Isso força joins
-- desnecessários para obter a localização do usuário.
--
-- Solução: Atualizar o trigger para salvar location_id também no perfil.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name            TEXT;
  v_display_name    TEXT;
  v_handle_base     TEXT;
  v_handle          TEXT;
  v_username        TEXT;
  v_city            TEXT;
  v_neighborhood    TEXT;
  v_state           TEXT;
  v_location_id     UUID;
  v_address_id      UUID;
BEGIN
  -- Dados pessoais
  v_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1));
  v_display_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''), v_name);
  v_handle_base  := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'handle'), ''), v_name);
  v_handle       := public.generate_unique_handle(v_handle_base);
  v_username     := v_handle;

  -- Localização (strings para exibição no perfil)
  v_city         := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'city'), ''), '');
  v_neighborhood := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'neighborhood', '')), '');
  v_state        := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'state'), ''), 'BA');

  -- UUID canônico do bairro (pode ser NULL se não fornecido ou inválido)
  BEGIN
    v_location_id := (NEW.raw_user_meta_data->>'neighborhood_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_location_id := NULL;
  END;

  -- Criar perfil com location_id
  INSERT INTO public.profiles (
    user_id, profile_type, handle, username, name, display_name,
    contact_email, city, neighborhood, state, location_id,
    is_active, is_public, verified, country
  ) VALUES (
    NEW.id, 'personal', v_handle, v_username, v_name, v_display_name,
    NEW.email, v_city, v_neighborhood, v_state, v_location_id,
    true, false, false, 'BR'
  );

  -- Criar vínculo territorial canônico se bairro foi fornecido e é válido
  IF v_location_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.locations
    WHERE id = v_location_id AND type = 'district' AND status = 'active'
  ) THEN
    -- address 'approximate': bairro escolhido no cadastro, sem rua/CEP ainda
    INSERT INTO public.addresses (location_id, address_type)
    VALUES (v_location_id, 'approximate')
    RETURNING id INTO v_address_id;

    INSERT INTO public.user_residences (user_id, address_id, location_id, country, is_primary, is_verified)
    VALUES (NEW.id, v_address_id, v_location_id, 'BR', true, false);
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS
  'Cria perfil personal + address approximate + user_residence ao inserir em auth.users. '
  'Lê neighborhood_id (UUID) do raw_user_meta_data e salva como location_id no perfil. '
  'address_type=approximate: bairro escolhido no cadastro, endereço completo preenchido depois.';

-- Backfill: atualizar location_id nos perfis existentes que têm user_residence
UPDATE public.profiles p
SET location_id = ur.location_id
FROM public.user_residences ur
WHERE p.user_id = ur.user_id
  AND ur.is_primary = true
  AND p.location_id IS NULL;
