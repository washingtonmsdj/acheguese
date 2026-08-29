-- community_questions is the canonical Q&A question table. Public reads are
-- intentionally limited to type='question'. Remove the legacy SELECT true
-- policy that OR-shadowed that contract.

DROP POLICY IF EXISTS "Community questions viewable"
ON public.community_questions;

DO $verify$
DECLARE
  v_broad_public integer;
  v_question_policy integer;
BEGIN
  SELECT count(*)
  INTO v_broad_public
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'community_questions'
    AND p.cmd = 'SELECT'
    AND p.roles && ARRAY['public', 'anon', 'authenticated']::name[]
    AND lower(regexp_replace(COALESCE(p.qual, ''), '[()[:space:]]', '', 'g')) = 'true';

  IF v_broad_public <> 0 THEN
    RAISE EXCEPTION 'broad community_questions SELECT true policy remains';
  END IF;

  SELECT count(*)
  INTO v_question_policy
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'community_questions'
    AND p.cmd = 'SELECT'
    AND p.policyname = 'community_questions_public_read'
    AND COALESCE(p.qual, '') ILIKE '%type%question%';

  IF v_question_policy <> 1 THEN
    RAISE EXCEPTION 'question-only public policy missing';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
