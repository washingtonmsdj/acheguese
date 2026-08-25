-- question_answer_likes stores user identity for each answer like. Public answer
-- counts are already materialized on question_answers.likes_count, while the
-- client only needs to read the current user's own like rows.

DROP POLICY IF EXISTS "Answer likes viewable by authenticated"
  ON public.question_answer_likes;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'question_answer_likes'
       AND cmd IN ('SELECT', 'ALL')
       AND 'authenticated' = ANY(roles)
       AND regexp_replace(coalesce(qual, ''), '\s+', '', 'g') IN ('true', '(true)')
  ) THEN
    RAISE EXCEPTION 'question answer likes broad authenticated read still exists';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'question_answer_likes'
       AND policyname = 'question_answer_likes_own_read'
       AND 'authenticated' = ANY(roles)
       AND qual ILIKE '%user_id%auth.uid%'
  ) THEN
    RAISE EXCEPTION 'question answer likes owner read contract missing';
  END IF;
END
$$;
