-- APLICAR RPC SEGURO: invite_profile_member_by_email
-- Execute este SQL no Supabase SQL Editor
-- Tempo: 5 minutos
--
-- NOTA: Este arquivo é referenciado em docs históricas (LEIA_ISTO_CORRECAO_SEGURA.md,
-- INSTRUCOES_APLICAR_RPC.md, ENTREGA_FINAL_FRONT_END_SEGURO.md).
-- Mantido no lugar por compatibilidade com essas referências.
-- Verificar se o RPC já foi aplicado antes de executar novamente.
-- Migration canônica equivalente: supabase/migrations/20260328000002_rpc_invite_member_secure.sql

-- ============================================
-- RPC SEGURO PARA ADICIONAR MEMBRO POR EMAIL
-- ============================================

CREATE OR REPLACE FUNCTION invite_profile_member_by_email(
  p_profile_id uuid,
  p_email text,
  p_role text DEFAULT 'member'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user_id uuid;
  v_caller_user_id uuid;
  v_caller_role text;
  v_profile_type text;
  v_result jsonb;
BEGIN
  -- 1. Identificar quem está chamando
  v_caller_user_id := auth.uid();
  
  IF v_caller_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Não autenticado'
    );
  END IF;

  -- 2. Validar se perfil existe e pegar tipo
  SELECT profile_type INTO v_profile_type
  FROM profiles
  WHERE id = p_profile_id;

  IF v_profile_type IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Perfil não encontrado'
    );
  END IF;

  -- 3. Validar se perfil aceita membros
  IF v_profile_type NOT IN ('business', 'professional') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas perfis business e professional podem ter membros'
    );
  END IF;

  -- 4. Validar se caller é owner ou admin do perfil
  SELECT role INTO v_caller_role
  FROM profile_members
  WHERE profile_id = p_profile_id
    AND user_id = v_caller_user_id;

  IF v_caller_role IS NULL THEN
    -- Verificar se é owner estrutural (profiles.user_id)
    SELECT user_id INTO v_caller_role
    FROM profiles
    WHERE id = p_profile_id
      AND user_id = v_caller_user_id;
    
    IF v_caller_role IS NOT NULL THEN
      v_caller_role := 'owner';
    END IF;
  END IF;

  IF v_caller_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas owner ou admin podem adicionar membros'
    );
  END IF;

  -- 5. Validar role solicitada
  IF p_role NOT IN ('member', 'admin', 'owner') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Role inválida. Use: member, admin ou owner'
    );
  END IF;

  -- 6. Buscar user_id por email (lookup interno, não exposto)
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(TRIM(p_email));

  IF v_target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado com este email'
    );
  END IF;

  -- 7. Validar se usuário já é membro
  IF EXISTS (
    SELECT 1 FROM profile_members
    WHERE profile_id = p_profile_id
      AND user_id = v_target_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário já é membro deste perfil'
    );
  END IF;

  -- 8. Adicionar membro (RLS vai validar novamente)
  INSERT INTO profile_members (profile_id, user_id, role)
  VALUES (p_profile_id, v_target_user_id, p_role::profile_role);

  -- 9. Retornar sucesso SEM expor user_id
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Membro adicionado com sucesso'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Permissões: apenas authenticated pode executar
REVOKE ALL ON FUNCTION invite_profile_member_by_email(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION invite_profile_member_by_email(uuid, text, text) TO authenticated;

-- Comentário
COMMENT ON FUNCTION invite_profile_member_by_email(uuid, text, text) IS 
'Adiciona membro a perfil por email de forma segura. Valida permissões, busca usuário internamente, não expõe user_id.';

-- ============================================
-- TESTE DA RPC
-- ============================================

-- Teste 1: Sem autenticação (deve falhar)
-- SELECT invite_profile_member_by_email('profile-id', 'email@teste.com', 'member');
-- Esperado: { "success": false, "error": "Não autenticado" }

-- Teste 2: Com autenticação mas sem permissão (deve falhar)
-- SELECT invite_profile_member_by_email('profile-id-de-outro', 'email@teste.com', 'member');
-- Esperado: { "success": false, "error": "Apenas owner ou admin podem adicionar membros" }

-- Teste 3: Com permissão e email válido (deve passar)
-- SELECT invite_profile_member_by_email('seu-profile-id', 'email-valido@teste.com', 'member');
-- Esperado: { "success": true, "message": "Membro adicionado com sucesso" }

-- Teste 4: Email não existe (deve falhar)
-- SELECT invite_profile_member_by_email('seu-profile-id', 'nao-existe@teste.com', 'member');
-- Esperado: { "success": false, "error": "Usuário não encontrado com este email" }

-- Teste 5: Usuário já é membro (deve falhar)
-- SELECT invite_profile_member_by_email('seu-profile-id', 'ja-membro@teste.com', 'member');
-- Esperado: { "success": false, "error": "Usuário já é membro deste perfil" }
