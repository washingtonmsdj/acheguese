-- Make the browser-deny posture explicit for the canonical DPO ledger/history.
-- service_role is verified BYPASSRLS in the linked production project; grants
-- remain independently minimized (ledger INSERT only, event table none).

DROP POLICY IF EXISTS privacy_subject_requests_deny_direct
  ON public.privacy_subject_requests;
CREATE POLICY privacy_subject_requests_deny_direct
  ON public.privacy_subject_requests
  FOR ALL
  TO PUBLIC
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS privacy_subject_request_events_deny_direct
  ON public.privacy_subject_request_events;
CREATE POLICY privacy_subject_request_events_deny_direct
  ON public.privacy_subject_request_events
  FOR ALL
  TO PUBLIC
  USING (false)
  WITH CHECK (false);

COMMENT ON POLICY privacy_subject_requests_deny_direct
  ON public.privacy_subject_requests IS
  'Explicit default-deny policy. Public intake uses service_role INSERT through submit-dpo-request; admin reads/transitions use protected SECURITY DEFINER RPCs.';

COMMENT ON POLICY privacy_subject_request_events_deny_direct
  ON public.privacy_subject_request_events IS
  'Explicit default-deny policy. Lifecycle history is readable only through protected admin detail authority.';
