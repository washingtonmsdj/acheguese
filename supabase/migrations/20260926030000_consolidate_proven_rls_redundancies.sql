-- Security/performance hardening: remove only RLS policies whose redundancy is
-- proven by the current authorization helpers, table grants, and migration
-- provenance. No authorization capability is added by this migration.
--
-- question_answer_likes:
--   authenticated currently has SELECT only; writes are owned by the
--   toggle_question_answer_like RPC. The broad ALL policy duplicates the
--   canonical own-read predicate for SELECT and is unreachable for DML.
-- application_logs:
--   "Admins can read all logs" is the canonicalized policy. private.is_admin()
--   delegates to the same private.is_admin_from_roles() predicate used by it,
--   making the older "Admins can view all application logs" SELECT policy
--   semantically redundant.
-- tourist_point_media:
--   "Admins manage tourist point media" accepts canonical admin/super_admin via
--   private.is_admin(); guide_tpm_admin_all accepts only admin and is therefore
--   a strict subset for the same authenticated ALL commands.

BEGIN;

-- Preserve the RPC-only mutation boundary for answer likes.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.question_answer_likes
  FROM authenticated;

DROP POLICY IF EXISTS "Users manage own answer likes"
  ON public.question_answer_likes;

DROP POLICY IF EXISTS "Admins can view all application logs"
  ON public.application_logs;

DROP POLICY IF EXISTS guide_tpm_admin_all
  ON public.tourist_point_media;

COMMIT;
