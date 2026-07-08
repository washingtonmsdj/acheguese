-- Route privacy and session activity calls through authenticated Edge brokers.
-- The browser keeps using domain services; direct database helper execution is
-- limited to service_role.

ALTER TABLE public.user_consents
  DROP CONSTRAINT IF EXISTS unique_active_consent;
DROP INDEX IF EXISTS public.unique_active_consent;

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_consent
  ON public.user_consents (user_id, consent_type)
  WHERE revoked_at IS NULL;

REVOKE ALL ON FUNCTION public.record_consent(uuid, character varying, boolean, inet, text, character varying, character varying)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_consent(uuid, character varying, boolean, inet, text, character varying, character varying)
  TO service_role;

REVOKE ALL ON FUNCTION public.update_session_activity(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_session_activity(text)
  TO service_role;

COMMENT ON INDEX public.unique_active_consent
  IS 'Allows consent history while keeping one active consent row per user and type.';

COMMENT ON FUNCTION public.record_consent(uuid, character varying, boolean, inet, text, character varying, character varying)
  IS 'Legacy consent helper. Browser access is routed through privacy-rpc and scoped to the authenticated user.';

COMMENT ON FUNCTION public.update_session_activity(text)
  IS 'Legacy session activity helper. Browser access is routed through session-rpc and scoped to the authenticated user.';
