-- Moderation blocklist is control-plane configuration, not public content.
-- No browser runtime caller or database function depends on anonymous reads.

DROP POLICY IF EXISTS "Termos bloqueados são públicos para leitura"
ON public.issue_blocked_terms;

REVOKE SELECT ON TABLE public.issue_blocked_terms FROM anon;

COMMENT ON TABLE public.issue_blocked_terms IS
  'Moderation control-plane blocklist. Anonymous reads are denied; authenticated access remains restricted by canonical admin RLS.';
