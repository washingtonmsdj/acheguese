-- ============================================================================
-- LIMPEZA DE DADOS DE TESTE
-- Remove todos os perfis e usuários criados durante desenvolvimento/testes.
-- Mantém apenas:
--   - washingtonmsdj (admin)
--   - tonecosloja e seus perfis vinculados (dados reais de produção)
-- ============================================================================

-- Perfis a manter (por handle)
-- washingtonmsdj, tonecosloja, tonecosloja_empresa, tonecosloja_ti, tonecosloja_motorista

-- 1. Captura os user_ids que devem ser DELETADOS
--    (todos exceto os donos dos perfis que queremos manter)
DO $$
DECLARE
  v_user_ids_to_keep UUID[];
  v_user_ids_to_delete UUID[];
BEGIN
  -- Coleta user_ids dos perfis a manter
  SELECT ARRAY_AGG(DISTINCT user_id) INTO v_user_ids_to_keep
  FROM public.profiles
  WHERE handle IN (
    'washingtonmsdj',
    'tonecosloja',
    'tonecosloja_empresa',
    'tonecosloja_ti',
    'tonecosloja_motorista'
  );

  -- Coleta user_ids a deletar (todos os outros)
  SELECT ARRAY_AGG(DISTINCT user_id) INTO v_user_ids_to_delete
  FROM public.profiles
  WHERE user_id <> ALL(v_user_ids_to_keep);

  -- 2. Deleta perfis (CASCADE remove dados filhos automaticamente)
  DELETE FROM public.profiles
  WHERE user_id <> ALL(v_user_ids_to_keep);

  RAISE NOTICE 'Perfis de teste removidos. user_ids a remover de auth.users: %',
    array_length(v_user_ids_to_delete, 1);

  -- 3. Remove os usuários de auth.users
  --    (requer SECURITY DEFINER / acesso a auth schema)
  DELETE FROM auth.users
  WHERE id <> ALL(v_user_ids_to_keep);

  RAISE NOTICE 'Limpeza concluída. Usuários mantidos: %',
    array_length(v_user_ids_to_keep, 1);
END;
$$;
