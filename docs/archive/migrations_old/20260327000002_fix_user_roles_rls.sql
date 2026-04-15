-- Fix: RLS policy em user_roles causava recursão infinita
-- A policy "Admins manage roles" fazia SELECT em user_roles para verificar admin,
-- o que disparava a própria policy recursivamente.
-- Solução: usar security definer function para quebrar a recursão.

-- Função auxiliar sem RLS para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
      AND role = 'admin'
      AND is_active = true
  );
$$;

-- Remove policies antigas
DROP POLICY IF EXISTS "Admins manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users read own roles" ON user_roles;

-- Recria com função auxiliar (sem recursão)
CREATE POLICY "Admins manage roles"
  ON user_roles FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users read own roles"
  ON user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
