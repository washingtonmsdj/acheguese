REVOKE ALL ON TABLE public.privacy_subject_requests FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT ON TABLE public.privacy_subject_requests TO service_role;
COMMENT ON TABLE public.privacy_subject_requests IS 'Canonical LGPD/DPO request ledger. Direct runtime access is service_role INSERT-only; privileged reads and transitions are exposed only through guarded admin RPCs.';
