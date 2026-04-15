-- ============================================================================
-- RPC: get_email_by_username
-- Retorna o email de auth.users a partir do username do perfil.
-- Usado para login por username — o email nunca é exposto diretamente ao cliente,
-- apenas utilizado internamente pelo SDK do Supabase para autenticação.
--
-- SECURITY DEFINER: executa com permissões do owner (postgres),
-- permitindo acesso a auth.users sem expor a tabela ao anon role.
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
BEGIN
  -- Busca o user_id pelo username (case-insensitive)
  SELECT user_id INTO v_user_id
  FROM public.profiles
  WHERE LOWER(username) = LOWER(TRIM(p_username))
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

-- Permite que usuários anônimos e autenticados chamem a função
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.get_email_by_username IS
  'Retorna o email de auth.users pelo username do perfil. Usado para login por username. SECURITY DEFINER.';
