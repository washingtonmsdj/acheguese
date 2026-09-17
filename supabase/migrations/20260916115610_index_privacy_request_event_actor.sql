-- Support the actor_user_id foreign key and administrative audit maintenance.
-- This does not grant any additional read surface; the table remains direct-access denied.

CREATE INDEX IF NOT EXISTS privacy_subject_request_events_actor_user_idx
  ON public.privacy_subject_request_events(actor_user_id);

COMMENT ON INDEX public.privacy_subject_request_events_actor_user_idx IS
  'Supports the auth.users foreign key used by transactional DPO lifecycle history.';
