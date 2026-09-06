-- G6 server-owned public Education lead intake.
-- Public visitors must never receive direct INSERT authority on the PII table.

REVOKE INSERT ON public.education_leads FROM anon;

CREATE INDEX IF NOT EXISTS idx_education_leads_public_dedupe
  ON public.education_leads(education_profile_id, email, created_at DESC);

COMMENT ON TABLE public.education_leads IS
  'Private Education lead aggregate. Public intake must use the education-lead-rpc server broker; anon direct INSERT remains forbidden.';

COMMENT ON INDEX public.idx_education_leads_public_dedupe IS
  'Supports server-owned public lead deduplication by Education profile and normalized email.';
