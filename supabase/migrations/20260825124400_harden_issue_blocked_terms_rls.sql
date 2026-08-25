-- Blocked-term configuration is a moderation control-plane surface.
-- Public read remains unchanged, but writes must require canonical platform
-- admin authority from user_roles.

DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar termos bloqueados"
ON public.issue_blocked_terms;

DROP POLICY IF EXISTS "issue_blocked_terms_admin_manage"
ON public.issue_blocked_terms;

CREATE POLICY "issue_blocked_terms_admin_manage"
ON public.issue_blocked_terms
FOR ALL
TO authenticated
USING (
  COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false)
)
WITH CHECK (
  COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false)
);
