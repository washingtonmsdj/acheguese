-- ============================================================================
-- FIX: Trigger correto + backfill de user_residences ausentes
--
-- O modelo canônico exige:
--   addresses.location_id  NOT NULL  (bairro onde o endereço está)
--   user_residences.address_id NOT NULL  (FK → addresses)
--   user_residences.location_id NOT NULL (FK → locations, redundante para queries rápidas)
--
-- No cadastro o usuário escolhe apenas o bairro. O tipo correto de address
-- para esse caso é 'approximate' — previsto no schema, sem rua/CEP.
-- Isso não é gambiarra: o usuário pode completar o endereço depois no perfil.
--
-- Este script:
--   1. Corrige o trigger handle_new_user para criar address + user_residence
--   2. Faz backfill de todos os usuários que ficaram sem user_residence
-- ============================================================================

-- ── 1. Trigger correto ────────────────────────────────────────────────────

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

  -- Criar perfil
  INSERT INTO public.profiles (
    user_id, profile_type, handle, username, name, display_name,
    contact_email, city, neighborhood, state,
    is_active, is_public, verified, country
  ) VALUES (
    NEW.id, 'personal', v_handle, v_username, v_name, v_display_name,
    NEW.email, v_city, v_neighborhood, v_state,
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
  'Lê neighborhood_id (UUID) do raw_user_meta_data. '
  'address_type=approximate: bairro escolhido no cadastro, endereço completo preenchido depois.';

-- ── 2. Backfill: usuários sem user_residence ──────────────────────────────
--
-- Para cada perfil personal com neighborhood preenchido mas sem user_residence:
--   - Busca o location pelo nome do bairro (case-insensitive, sem acentos)
--   - Cria address approximate + user_residence

DO $$
DECLARE
  r         RECORD;
  v_addr_id UUID;
  v_count   INT := 0;
BEGIN
  FOR r IN
    SELECT p.user_id, l.id AS location_id
    FROM   public.profiles   p
    JOIN   public.locations  l
           ON  l.type   = 'district'
           AND l.status = 'active'
           AND lower(unaccent(l.name)) = lower(unaccent(p.neighborhood))
    WHERE  p.profile_type = 'personal'
    AND    p.is_active    = true
    AND    p.neighborhood IS NOT NULL
    AND    p.neighborhood <> ''
    AND    NOT EXISTS (
             SELECT 1 FROM public.user_residences ur
             WHERE  ur.user_id = p.user_id
           )
  LOOP
    INSERT INTO public.addresses (location_id, address_type)
    VALUES (r.location_id, 'approximate')
    RETURNING id INTO v_addr_id;

    INSERT INTO public.user_residences (user_id, address_id, location_id, country, is_primary, is_verified)
    VALUES (r.user_id, v_addr_id, r.location_id, 'BR', true, false);

    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Backfill concluído: % user_residence(s) criada(s)', v_count;
END;
$$;
