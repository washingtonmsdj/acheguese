-- Migration: RPC seguro para adicionar membro por email
-- Criado em: 2026-03-28
-- Revisado em: 2026-03-28 (aprovado pelo usuário)
-- Objetivo: Adicionar membro a perfil por email SEM expor user_id
--
-- Roles aceitas: 'member', 'admin'
-- 'owner' NÃO é aceito neste RPC — transferência de ownership tem fluxo dedicado (transfer_profile_ownership)

CREATE OR REPLACE FUNCTION invite_profile_member_by_email(
  p_profile_id uuid,
  p_email      text,
  p_role       text DEFAULT 'member'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id       uuid;
  v_profile_type    text;
  v_target_user_id  uuid;
  v_is_authorized   boolean := false;
BEGIN
  -- 1. Autenticação
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autenticado');
  END IF;

  -- 2. Validar email não vazio
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email não pode ser vazio');
  END IF;

  -- 3. Role restrita: apenas member ou admin (owner via transfer_profile_ownership)
  IF p_role NOT IN ('member', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Role inválida. Use: member ou admin. Para transferir ownership use transfer_profile_ownership');
  END IF;

  -- 4. Perfil existe e aceita membros
  SELECT profile_type INTO v_profile_type
  FROM profiles
  WHERE id = p_profile_id;

  IF v_profile_type IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Perfil não encontrado');
  END IF;

  IF v_profile_type NOT IN ('business', 'professional') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas perfis business e professional aceitam membros');
  END IF;

  -- 5. Verificar permissão: dono estrutural (profiles.user_id)
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_profile_id
      AND user_id = v_caller_id
  ) THEN
    v_is_authorized := true;
  END IF;

  -- 6. Verificar permissão: owner/admin operacional (profile_members)
  IF NOT v_is_authorized AND EXISTS (
    SELECT 1 FROM profile_members
    WHERE profile_id = p_profile_id
      AND user_id = v_caller_id
      AND role IN ('owner', 'admin')
  ) THEN
    v_is_authorized := true;
  END IF;

  IF NOT v_is_authorized THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para adicionar membros');
  END IF;

  -- 7. Lookup interno por email (não exposto ao caller)
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email));

  IF v_target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado com este email');
  END IF;

  -- 8. Duplicata
  IF EXISTS (
    SELECT 1 FROM profile_members
    WHERE profile_id = p_profile_id
      AND user_id = v_target_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário já é membro deste perfil');
  END IF;

  -- 9. Inserir (role é text no banco, sem cast de enum)
  INSERT INTO profile_members (profile_id, user_id, role)
  VALUES (p_profile_id, v_target_user_id, p_role);

  RETURN jsonb_build_object('success', true, 'message', 'Membro adicionado com sucesso');

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Permissões
REVOKE ALL ON FUNCTION invite_profile_member_by_email(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION invite_profile_member_by_email(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION invite_profile_member_by_email(uuid, text, text) TO authenticated;

COMMENT ON FUNCTION invite_profile_member_by_email(uuid, text, text) IS
'Adiciona membro (member|admin) a perfil por email. Valida permissão antes do lookup. Não expõe user_id. Owner via transfer_profile_ownership.';
