-- Canonical LGPD/data-subject request intake.
-- Public clients never write this table directly; submissions go through the
-- Turnstile/rate-limited submit-dpo-request Edge Function using service_role.

CREATE TABLE IF NOT EXISTS public.privacy_subject_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  request_type text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'received',
  turnstile_verified boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT privacy_subject_requests_requester_name_len
    CHECK (char_length(btrim(requester_name)) BETWEEN 2 AND 120),
  CONSTRAINT privacy_subject_requests_email_len
    CHECK (char_length(btrim(requester_email)) BETWEEN 3 AND 255),
  CONSTRAINT privacy_subject_requests_email_shape
    CHECK (requester_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  CONSTRAINT privacy_subject_requests_type
    CHECK (request_type IN (
      'access',
      'correction',
      'anonymization',
      'portability',
      'deletion',
      'information',
      'consent_revocation',
      'automated_decision',
      'violation_report',
      'other'
    )),
  CONSTRAINT privacy_subject_requests_subject_len
    CHECK (char_length(btrim(subject)) BETWEEN 3 AND 200),
  CONSTRAINT privacy_subject_requests_message_len
    CHECK (char_length(btrim(message)) BETWEEN 10 AND 5000),
  CONSTRAINT privacy_subject_requests_status
    CHECK (status IN (
      'received',
      'in_review',
      'waiting_for_requester',
      'completed',
      'denied',
      'cancelled'
    )),
  CONSTRAINT privacy_subject_requests_resolution_consistency
    CHECK ((status IN ('completed', 'denied', 'cancelled')) OR resolved_at IS NULL)
);

CREATE INDEX IF NOT EXISTS privacy_subject_requests_user_submitted_idx
  ON public.privacy_subject_requests(user_id, submitted_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS privacy_subject_requests_status_submitted_idx
  ON public.privacy_subject_requests(status, submitted_at ASC);

DROP TRIGGER IF EXISTS privacy_subject_requests_updated_at
  ON public.privacy_subject_requests;
CREATE TRIGGER privacy_subject_requests_updated_at
  BEFORE UPDATE ON public.privacy_subject_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.privacy_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_subject_requests FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.privacy_subject_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.privacy_subject_requests TO service_role;

COMMENT ON TABLE public.privacy_subject_requests IS
  'Canonical LGPD/data-subject request ledger. Browser access is denied; intake is brokered by submit-dpo-request.';
COMMENT ON COLUMN public.privacy_subject_requests.user_id IS
  'Authenticated subject when the broker can validate a real user session; NULL for public requests.';
COMMENT ON COLUMN public.privacy_subject_requests.turnstile_verified IS
  'Evidence that public anti-abuse verification passed before brokered insertion.';
