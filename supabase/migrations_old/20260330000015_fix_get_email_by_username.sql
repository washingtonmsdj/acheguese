-- ============================================================================
-- FIX: get_email_by_username — busca por username OU handle
--
-- Problema: a RPC buscava apenas por `username`, mas o trigger salva o mesmo
-- valor em `handle` e `username`. Em alguns casos (handle gerado com sufixo
-- por colisão) o usuário pode tentar logar com o handle exibido no perfil.
-- A RPC agora cobre ambos os campos, garantindo que qualquer um funcione.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_email   TEXT;
  v_clean   TEXT;
BEGIN
  -- Remove @ inicial se presente (usuário pode digitar @joao ou joao)
  v_clean := LOWER(TRIM(LEADING '@' FROM TRIM(p_username)));

  -- Busca por username OU handle (case-insensitive)
  SELECT user_id INTO v_user_id
  FROM public.profiles
  WHERE (LOWER(username) = v_clean OR LOWER(handle) = v_clean)
    AND profile_type = 'personal'
    AND is_active = true
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Busca o email em auth.users (requer SECURITY DEFINER)
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.get_email_by_username IS
  'Retorna o email de auth.users pelo username ou handle do perfil. '
  'Remove @ inicial automaticamente. SECURITY DEFINER.';
