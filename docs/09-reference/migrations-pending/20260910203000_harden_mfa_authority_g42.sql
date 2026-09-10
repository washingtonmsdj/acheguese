-- PENDING G42 — NÃO MOVER PARA supabase/migrations NEM APLICAR SEM PREFLIGHT REMOTO.
--
-- Motivo:
-- - Supabase Auth é a autoridade de fatores MFA/AAL;
-- - `user_mfa_status` é apenas cache/metadata de política;
-- - `admin_mfa_enforcement` define política global;
-- - nenhuma dessas duas autoridades pode aceitar DML direto do browser.
--
-- Estado em 2026-09-10:
-- - `MFAService` já não grava user_mfa_status;
-- - `session-rpc` reconcilia estado a partir dos fatores Auth;
-- - `requireAdmin` exige a política canônica e AAL2 quando aplicável;
-- - o projeto Supabase remoto estava indisponível por timeout, portanto este
--   fechamento de grants/policies permanece deliberadamente PENDING.
--
-- Gate para promoção deste arquivo:
-- 1. banco remoto acessível;
-- 2. confirmar policies/grants atuais das duas tabelas;
-- 3. confirmar zero caller runtime de INSERT/UPDATE/DELETE do browser;
-- 4. aplicar como migration real;
-- 5. validar authenticated SELECT permitido somente pelas policies esperadas;
-- 6. validar authenticated/anon DML negado;
-- 7. smoke de session-rpc + uma Edge requireAdmin com AAL1/AAL2.

BEGIN;

-- O browser pode consultar o próprio estado/política conforme RLS, mas não
-- pode fabricar enrollment, isenção, grace period ou desligar enforcement.
DROP POLICY IF EXISTS user_mfa_status_own_update
  ON public.user_mfa_status;
DROP POLICY IF EXISTS user_mfa_status_super_admin_update
  ON public.user_mfa_status;

REVOKE ALL ON TABLE public.user_mfa_status
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.user_mfa_status
  TO authenticated;
GRANT ALL ON TABLE public.user_mfa_status
  TO service_role;

-- A policy histórica FOR ALL de super_admin permitia editar a própria política
-- que depois seria usada para autorizar o mesmo ator. Retirar essa circularidade
-- é obrigatório; futuras mutações de enforcement devem passar por broker
-- server-side com requireSuperAdmin/requireAdmin + AAL2.
DROP POLICY IF EXISTS admin_mfa_enforcement_super_admin_all
  ON public.admin_mfa_enforcement;

REVOKE ALL ON TABLE public.admin_mfa_enforcement
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.admin_mfa_enforcement
  TO authenticated;
GRANT ALL ON TABLE public.admin_mfa_enforcement
  TO service_role;

COMMIT;

-- PRE/POSTFLIGHT SUGERIDO (executar separadamente no remoto):
--
-- SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('user_mfa_status', 'admin_mfa_enforcement')
-- ORDER BY tablename, policyname;
--
-- SELECT grantee, table_name, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public'
--   AND table_name IN ('user_mfa_status', 'admin_mfa_enforcement')
--   AND grantee IN ('anon', 'authenticated', 'service_role')
-- ORDER BY table_name, grantee, privilege_type;
