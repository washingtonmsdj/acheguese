-- Defense in depth for private relationship/vote tables. None of these tables
-- has an anonymous RLS policy or dependent public view, so retaining anon SELECT
-- grants only increases the chance of accidental future exposure.

REVOKE SELECT ON TABLE public.question_answer_likes FROM anon;
REVOKE SELECT ON TABLE public.event_review_helpfulness FROM anon;
REVOKE SELECT ON TABLE public.user_follows FROM anon;

DO $$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'question_answer_likes',
    'event_review_helpfulness',
    'user_follows'
  ]
  LOOP
    IF has_table_privilege('anon', format('public.%I', v_table), 'SELECT') THEN
      RAISE EXCEPTION 'anonymous SELECT grant still exists on %', v_table;
    END IF;
  END LOOP;
END
$$;
