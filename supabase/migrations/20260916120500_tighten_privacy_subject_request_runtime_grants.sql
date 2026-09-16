-- Tighten the canonical LGPD request ledger to the exact runtime contract.
-- Public/browser roles have no direct table authority. The service-role broker
-- may only append a new intake request; reads and state changes stay behind
-- the guarded SECURITY DEFINER RPC boundary.

REVOKE ALL ON TABLE public.privacy_subject_requests
  FROM PUBLIC, anon, authenticated, service_role;

GRANT INSERT ON TABLE public.privacy_subject_requests
  TO service_role;

COMMENT ON TABLE public.privacy_subject_requests IS
  'Canonical LGPD/DPO request ledger. Direct runtime access is service_role INSERT-only; privileged reads and transitions are exposed only through guarded admin RPCs.';
