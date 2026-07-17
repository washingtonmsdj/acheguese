-- Production hardening for territorial community questions and answers.
-- Actor identity, counters, best-answer state and audit are server-owned.

CREATE INDEX IF NOT EXISTS idx_community_questions_location_created_id
  ON public.community_questions (location_id, created_at DESC, id DESC)
  WHERE type = 'question';

CREATE INDEX IF NOT EXISTS idx_question_answers_question_created_id
  ON public.question_answers (question_id, created_at ASC, id ASC);

ALTER TABLE public.community_questions
  ALTER COLUMN author_profile_id
  SET DEFAULT private.current_active_profile_id();

ALTER TABLE public.question_answers
  ALTER COLUMN author_profile_id
  SET DEFAULT private.current_active_profile_id();

CREATE TABLE IF NOT EXISTS private.question_answer_like_rate_limits (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_id UUID NOT NULL REFERENCES public.question_answers(id) ON DELETE CASCADE,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  toggle_count INTEGER NOT NULL DEFAULT 0 CHECK (toggle_count >= 0),
  last_toggled_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, answer_id)
);

REVOKE ALL ON TABLE private.question_answer_like_rate_limits
  FROM PUBLIC, anon, authenticated;

-- security-authority: internal-function private.guard_community_question_write
CREATE OR REPLACE FUNCTION private.guard_community_question_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID;
  v_is_admin BOOLEAN := COALESCE(private.is_admin_user(auth.uid()), FALSE);
  v_recent_count INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role'
     OR COALESCE(current_setting('acheguese.internal_qa_write', TRUE), '') = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  v_actor_profile_id := private.current_active_profile_id();

  IF TG_OP = 'INSERT' THEN
    IF v_actor_profile_id IS NULL THEN
      RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
    END IF;

    NEW.author_profile_id := v_actor_profile_id;
    NEW.type := 'question';
    NEW.answers_count := 0;
    NEW.confirmations_count := 0;
    NEW.resolved := FALSE;
    NEW.is_verified := FALSE;
    NEW.created_at := now();
    NEW.updated_at := NEW.created_at;

    IF NOT private.auth_has_verified_residence(
      v_actor_profile_id,
      NEW.location_id
    ) THEN
      RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtextextended('community-question:' || v_actor_profile_id::TEXT, 0)
    );

    SELECT count(*)::INTEGER
    INTO v_recent_count
    FROM public.community_social_audit_log audit
    WHERE audit.actor_profile_id = v_actor_profile_id
      AND audit.target_type = 'community_question'
      AND audit.action = 'insert'
      AND audit.created_at >= now() - interval '1 day';

    IF v_recent_count >= 10 THEN
      RAISE EXCEPTION 'community_question_rate_limit_exceeded'
        USING ERRCODE = 'P0001';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.author_profile_id IS DISTINCT FROM OLD.author_profile_id
       OR NEW.location_id IS DISTINCT FROM OLD.location_id
       OR NEW.type IS DISTINCT FROM OLD.type
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'community_question_identity_is_immutable'
        USING ERRCODE = '42501';
    END IF;

    IF NOT v_is_admin THEN
      IF NOT private.auth_owns_active_profile(OLD.author_profile_id) THEN
        RAISE EXCEPTION 'community_question_update_not_authorized'
          USING ERRCODE = '42501';
      END IF;
      IF NOT private.auth_has_verified_residence(
        OLD.author_profile_id,
        OLD.location_id
      ) THEN
        RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
      END IF;
      IF NEW.answers_count IS DISTINCT FROM OLD.answers_count
         OR NEW.confirmations_count IS DISTINCT FROM OLD.confirmations_count
         OR NEW.resolved IS DISTINCT FROM OLD.resolved
         OR NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
        RAISE EXCEPTION 'protected_community_question_fields_are_server_owned'
          USING ERRCODE = '42501';
      END IF;
    END IF;

    NEW.updated_at := now();
  ELSE
    IF NOT v_is_admin
       AND NOT private.auth_owns_active_profile(OLD.author_profile_id) THEN
      RAISE EXCEPTION 'community_question_delete_not_authorized'
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF char_length(btrim(COALESCE(NEW.title, ''))) NOT BETWEEN 5 AND 200 THEN
    RAISE EXCEPTION 'invalid_community_question_title'
      USING ERRCODE = '22023';
  END IF;

  IF char_length(btrim(COALESCE(NEW.description, ''))) > 5000 THEN
    RAISE EXCEPTION 'invalid_community_question_description'
      USING ERRCODE = '22023';
  END IF;

  IF char_length(btrim(COALESCE(NEW.category, ''))) NOT BETWEEN 2 AND 50
     OR NEW.category !~ '^[a-z0-9_-]+$' THEN
    RAISE EXCEPTION 'invalid_community_question_category'
      USING ERRCODE = '22023';
  END IF;

  NEW.title := btrim(NEW.title);
  NEW.description := btrim(COALESCE(NEW.description, ''));
  NEW.content := NEW.description;
  NEW.category := lower(btrim(NEW.category));
  RETURN NEW;
END;
$$;

-- security-authority: internal-function private.guard_question_answer_write
CREATE OR REPLACE FUNCTION private.guard_question_answer_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID;
  v_location_id UUID;
  v_is_admin BOOLEAN := COALESCE(private.is_admin_user(auth.uid()), FALSE);
  v_recent_count INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role'
     OR COALESCE(current_setting('acheguese.internal_qa_write', TRUE), '') = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  v_actor_profile_id := private.current_active_profile_id();

  IF TG_OP = 'INSERT' THEN
    IF v_actor_profile_id IS NULL THEN
      RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
    END IF;

    SELECT question.location_id
    INTO v_location_id
    FROM public.community_questions question
    WHERE question.id = NEW.question_id
      AND question.type = 'question';

    IF v_location_id IS NULL THEN
      RAISE EXCEPTION 'community_question_not_found' USING ERRCODE = 'P0002';
    END IF;

    IF NOT private.auth_has_verified_residence(
      v_actor_profile_id,
      v_location_id
    ) THEN
      RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtextextended('question-answer:' || v_actor_profile_id::TEXT, 0)
    );

    SELECT count(*)::INTEGER
    INTO v_recent_count
    FROM public.community_social_audit_log audit
    WHERE audit.actor_profile_id = v_actor_profile_id
      AND audit.target_type = 'question_answer'
      AND audit.action = 'insert'
      AND audit.created_at >= now() - interval '1 hour';

    IF v_recent_count >= 20 THEN
      RAISE EXCEPTION 'question_answer_rate_limit_exceeded'
        USING ERRCODE = 'P0001';
    END IF;

    NEW.author_profile_id := v_actor_profile_id;
    NEW.likes_count := 0;
    NEW.is_best_answer := FALSE;
    NEW.created_at := now();
    NEW.updated_at := NEW.created_at;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.question_id IS DISTINCT FROM OLD.question_id
       OR NEW.author_profile_id IS DISTINCT FROM OLD.author_profile_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'question_answer_identity_is_immutable'
        USING ERRCODE = '42501';
    END IF;

    IF NOT v_is_admin THEN
      SELECT question.location_id
      INTO v_location_id
      FROM public.community_questions question
      WHERE question.id = OLD.question_id;

      IF NOT private.auth_owns_active_profile(OLD.author_profile_id) THEN
        RAISE EXCEPTION 'question_answer_update_not_authorized'
          USING ERRCODE = '42501';
      END IF;
      IF NOT private.auth_has_verified_residence(
        OLD.author_profile_id,
        v_location_id
      ) THEN
        RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
      END IF;
      IF NEW.likes_count IS DISTINCT FROM OLD.likes_count
         OR NEW.is_best_answer IS DISTINCT FROM OLD.is_best_answer THEN
        RAISE EXCEPTION 'protected_question_answer_fields_are_server_owned'
          USING ERRCODE = '42501';
      END IF;
    END IF;

    NEW.updated_at := now();
  ELSE
    IF NOT v_is_admin
       AND NOT private.auth_owns_active_profile(OLD.author_profile_id) THEN
      RAISE EXCEPTION 'question_answer_delete_not_authorized'
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF char_length(btrim(COALESCE(NEW.content, ''))) NOT BETWEEN 1 AND 3000 THEN
    RAISE EXCEPTION 'invalid_question_answer_content'
      USING ERRCODE = '22023';
  END IF;

  NEW.content := btrim(NEW.content);
  RETURN NEW;
END;
$$;

-- Counter functions recompute the canonical relation count to repair drift.
CREATE OR REPLACE FUNCTION public.sync_question_answer_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_answer_id UUID := CASE WHEN TG_OP = 'DELETE' THEN OLD.answer_id ELSE NEW.answer_id END;
  v_previous_setting TEXT := COALESCE(
    current_setting('acheguese.internal_qa_write', TRUE),
    ''
  );
BEGIN
  PERFORM set_config('acheguese.internal_qa_write', 'on', TRUE);
  UPDATE public.question_answers answer
  SET likes_count = (
    SELECT count(*)::INTEGER
    FROM public.question_answer_likes answer_like
    WHERE answer_like.answer_id = v_answer_id
  )
  WHERE answer.id = v_answer_id;
  PERFORM set_config('acheguese.internal_qa_write', v_previous_setting, TRUE);

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_question_answers_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_question_id UUID := CASE WHEN TG_OP = 'DELETE' THEN OLD.question_id ELSE NEW.question_id END;
  v_previous_setting TEXT := COALESCE(
    current_setting('acheguese.internal_qa_write', TRUE),
    ''
  );
BEGIN
  PERFORM set_config('acheguese.internal_qa_write', 'on', TRUE);
  UPDATE public.community_questions question
  SET answers_count = (
    SELECT count(*)::INTEGER
    FROM public.question_answers answer
    WHERE answer.question_id = v_question_id
  )
  WHERE question.id = v_question_id;
  PERFORM set_config('acheguese.internal_qa_write', v_previous_setting, TRUE);

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- security-authority: internal-function private.audit_community_qa_change
CREATE OR REPLACE FUNCTION private.audit_community_qa_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_new JSONB := CASE WHEN TG_OP = 'DELETE' THEN '{}'::JSONB ELSE to_jsonb(NEW) END;
  v_old JSONB := CASE WHEN TG_OP = 'INSERT' THEN '{}'::JSONB ELSE to_jsonb(OLD) END;
  v_target_id UUID := COALESCE(v_new->>'id', v_old->>'id')::UUID;
  v_question_id UUID;
  v_location_id UUID;
BEGIN
  IF COALESCE(current_setting('acheguese.internal_qa_write', TRUE), '') = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_ARGV[0] = 'community_question' THEN
    v_question_id := v_target_id;
    v_location_id := COALESCE(v_new->>'location_id', v_old->>'location_id')::UUID;
  ELSE
    v_question_id := COALESCE(v_new->>'question_id', v_old->>'question_id')::UUID;
    SELECT question.location_id
    INTO v_location_id
    FROM public.community_questions question
    WHERE question.id = v_question_id;
  END IF;

  INSERT INTO public.community_social_audit_log (
    actor_user_id,
    actor_profile_id,
    action,
    target_type,
    target_id,
    location_id,
    metadata
  ) VALUES (
    auth.uid(),
    private.current_active_profile_id(),
    lower(TG_OP),
    TG_ARGV[0],
    v_target_id,
    v_location_id,
    jsonb_strip_nulls(jsonb_build_object(
      'question_id', v_question_id,
      'category', COALESCE(v_new->>'category', v_old->>'category'),
      'resolved', v_new->>'resolved',
      'previous_resolved', v_old->>'resolved',
      'is_best_answer', v_new->>'is_best_answer',
      'previous_is_best_answer', v_old->>'is_best_answer'
    ))
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- security-authority: internal-function private.toggle_question_answer_like
CREATE OR REPLACE FUNCTION private.toggle_question_answer_like(p_answer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_location_id UUID;
  v_like_id UUID;
  v_rate private.question_answer_like_rate_limits%ROWTYPE;
  v_liked BOOLEAN;
  v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  SELECT question.location_id
  INTO v_location_id
  FROM public.question_answers answer
  JOIN public.community_questions question ON question.id = answer.question_id
  WHERE answer.id = p_answer_id
    AND question.type = 'question';

  IF v_location_id IS NULL THEN
    RAISE EXCEPTION 'question_answer_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT private.auth_has_verified_residence(
    v_actor_profile_id,
    v_location_id
  ) THEN
    RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      'question-answer-like:' || auth.uid()::TEXT || ':' || p_answer_id::TEXT,
      0
    )
  );

  SELECT *
  INTO v_rate
  FROM private.question_answer_like_rate_limits rate_limit
  WHERE rate_limit.user_id = auth.uid()
    AND rate_limit.answer_id = p_answer_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_rate.last_toggled_at IS NOT NULL
       AND v_rate.last_toggled_at > now() - interval '500 milliseconds' THEN
      RAISE EXCEPTION 'question_answer_like_too_fast' USING ERRCODE = 'P0001';
    END IF;
    IF v_rate.window_started_at > now() - interval '1 minute'
       AND v_rate.toggle_count >= 20 THEN
      RAISE EXCEPTION 'question_answer_like_rate_limit_exceeded'
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE private.question_answer_like_rate_limits
    SET window_started_at = CASE
          WHEN window_started_at <= now() - interval '1 minute' THEN now()
          ELSE window_started_at
        END,
        toggle_count = CASE
          WHEN window_started_at <= now() - interval '1 minute' THEN 1
          ELSE toggle_count + 1
        END,
        last_toggled_at = now()
    WHERE user_id = auth.uid()
      AND answer_id = p_answer_id;
  ELSE
    INSERT INTO private.question_answer_like_rate_limits (
      user_id,
      answer_id,
      window_started_at,
      toggle_count,
      last_toggled_at
    ) VALUES (auth.uid(), p_answer_id, now(), 1, now());
  END IF;

  SELECT answer_like.id
  INTO v_like_id
  FROM public.question_answer_likes answer_like
  WHERE answer_like.answer_id = p_answer_id
    AND answer_like.user_id = auth.uid()
  FOR UPDATE;

  IF v_like_id IS NULL THEN
    INSERT INTO public.question_answer_likes (answer_id, user_id)
    VALUES (p_answer_id, auth.uid());
    v_liked := TRUE;
  ELSE
    DELETE FROM public.question_answer_likes
    WHERE id = v_like_id;
    v_liked := FALSE;
  END IF;

  SELECT answer.likes_count
  INTO v_count
  FROM public.question_answers answer
  WHERE answer.id = p_answer_id;

  RETURN jsonb_build_object(
    'liked', v_liked,
    'new_count', COALESCE(v_count, 0)
  );
END;
$$;

-- security-authority: internal-function private.mark_best_question_answer
CREATE OR REPLACE FUNCTION private.mark_best_question_answer(
  p_question_id UUID,
  p_answer_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_question public.community_questions%ROWTYPE;
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_is_admin BOOLEAN := COALESCE(private.is_admin_user(auth.uid()), FALSE);
  v_previous_setting TEXT := COALESCE(
    current_setting('acheguese.internal_qa_write', TRUE),
    ''
  );
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_question
  FROM public.community_questions question
  WHERE question.id = p_question_id
    AND question.type = 'question'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'community_question_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_is_admin
     AND v_question.author_profile_id IS DISTINCT FROM v_actor_profile_id THEN
    RAISE EXCEPTION 'mark_best_answer_not_authorized' USING ERRCODE = '42501';
  END IF;

  IF NOT v_is_admin
     AND NOT private.auth_has_verified_residence(
       v_actor_profile_id,
       v_question.location_id
     ) THEN
    RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.question_answers answer
    WHERE answer.id = p_answer_id
      AND answer.question_id = p_question_id
  ) THEN
    RAISE EXCEPTION 'answer_not_found_for_question' USING ERRCODE = 'P0002';
  END IF;

  PERFORM set_config('acheguese.internal_qa_write', 'on', TRUE);
  UPDATE public.question_answers
  SET is_best_answer = (id = p_answer_id),
      updated_at = now()
  WHERE question_id = p_question_id
    AND (is_best_answer OR id = p_answer_id);

  UPDATE public.community_questions
  SET resolved = TRUE,
      updated_at = now()
  WHERE id = p_question_id;
  PERFORM set_config('acheguese.internal_qa_write', v_previous_setting, TRUE);

  INSERT INTO public.community_social_audit_log (
    actor_user_id,
    actor_profile_id,
    action,
    target_type,
    target_id,
    location_id,
    metadata
  ) VALUES (
    auth.uid(),
    v_actor_profile_id,
    'update',
    'community_question',
    p_question_id,
    v_question.location_id,
    jsonb_build_object('best_answer_id', p_answer_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION private.guard_community_question_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.guard_question_answer_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.audit_community_qa_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.toggle_question_answer_like(UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.mark_best_question_answer(UUID, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.toggle_question_answer_like(UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION private.mark_best_question_answer(UUID, UUID)
  TO authenticated;

-- security-authority: public-rpc public.toggle_question_answer_like
CREATE OR REPLACE FUNCTION public.toggle_question_answer_like(p_answer_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$
  SELECT private.toggle_question_answer_like(p_answer_id);
$$;

-- Replaces the former service-role-only implementation with an invoker broker.
CREATE OR REPLACE FUNCTION public.mark_best_answer(
  _question_id UUID,
  _answer_id UUID
)
RETURNS VOID
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$
  SELECT private.mark_best_question_answer(_question_id, _answer_id);
$$;

REVOKE ALL ON FUNCTION public.toggle_question_answer_like(UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_best_answer(UUID, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_question_answer_like(UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_best_answer(UUID, UUID)
  TO authenticated;

DROP TRIGGER IF EXISTS trg_guard_community_question_write
  ON public.community_questions;
CREATE TRIGGER trg_guard_community_question_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.community_questions
  FOR EACH ROW EXECUTE FUNCTION private.guard_community_question_write();

DROP TRIGGER IF EXISTS trg_guard_question_answer_write
  ON public.question_answers;
CREATE TRIGGER trg_guard_question_answer_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.question_answers
  FOR EACH ROW EXECUTE FUNCTION private.guard_question_answer_write();

DROP TRIGGER IF EXISTS trg_audit_community_question_change
  ON public.community_questions;
CREATE TRIGGER trg_audit_community_question_change
  AFTER INSERT OR UPDATE OR DELETE ON public.community_questions
  FOR EACH ROW EXECUTE FUNCTION private.audit_community_qa_change('community_question');

DROP TRIGGER IF EXISTS trg_audit_question_answer_change
  ON public.question_answers;
CREATE TRIGGER trg_audit_question_answer_change
  AFTER INSERT OR UPDATE OR DELETE ON public.question_answers
  FOR EACH ROW EXECUTE FUNCTION private.audit_community_qa_change('question_answer');

ALTER FUNCTION public.sync_question_answer_likes_count()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_question_answers_count()
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.sync_question_answer_likes_count()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_question_answers_count()
  FROM PUBLIC, anon, authenticated;

ALTER TABLE public.community_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_answer_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community posts viewable" ON public.community_questions;
DROP POLICY IF EXISTS "Authors manage own community posts" ON public.community_questions;
DROP POLICY IF EXISTS "Authors manage own community questions" ON public.community_questions;
DROP POLICY IF EXISTS "Admins can view all community posts" ON public.community_questions;
DROP POLICY IF EXISTS "Admins can manage community posts" ON public.community_questions;
DROP POLICY IF EXISTS community_questions_public_read ON public.community_questions;
DROP POLICY IF EXISTS community_questions_verified_insert ON public.community_questions;
DROP POLICY IF EXISTS community_questions_owner_or_admin_update ON public.community_questions;
DROP POLICY IF EXISTS community_questions_owner_or_admin_delete ON public.community_questions;

CREATE POLICY community_questions_public_read
  ON public.community_questions FOR SELECT TO anon, authenticated
  USING (type = 'question');
CREATE POLICY community_questions_verified_insert
  ON public.community_questions FOR INSERT TO authenticated
  WITH CHECK (
    author_profile_id = private.current_active_profile_id()
    AND private.auth_has_verified_residence(author_profile_id, location_id)
  );
CREATE POLICY community_questions_owner_or_admin_update
  ON public.community_questions FOR UPDATE TO authenticated
  USING (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  )
  WITH CHECK (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );
CREATE POLICY community_questions_owner_or_admin_delete
  ON public.community_questions FOR DELETE TO authenticated
  USING (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );

DROP POLICY IF EXISTS "Question answers viewable" ON public.question_answers;
DROP POLICY IF EXISTS "Authors manage own question answers" ON public.question_answers;
DROP POLICY IF EXISTS question_answers_public_read ON public.question_answers;
DROP POLICY IF EXISTS question_answers_verified_insert ON public.question_answers;
DROP POLICY IF EXISTS question_answers_owner_or_admin_update ON public.question_answers;
DROP POLICY IF EXISTS question_answers_owner_or_admin_delete ON public.question_answers;

CREATE POLICY question_answers_public_read
  ON public.question_answers FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.community_questions question
      WHERE question.id = question_answers.question_id
        AND question.type = 'question'
    )
  );
CREATE POLICY question_answers_verified_insert
  ON public.question_answers FOR INSERT TO authenticated
  WITH CHECK (
    author_profile_id = private.current_active_profile_id()
    AND EXISTS (
      SELECT 1
      FROM public.community_questions question
      WHERE question.id = question_answers.question_id
        AND private.auth_has_verified_residence(
          question_answers.author_profile_id,
          question.location_id
        )
    )
  );
CREATE POLICY question_answers_owner_or_admin_update
  ON public.question_answers FOR UPDATE TO authenticated
  USING (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  )
  WITH CHECK (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );
CREATE POLICY question_answers_owner_or_admin_delete
  ON public.question_answers FOR DELETE TO authenticated
  USING (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );

DROP POLICY IF EXISTS "Question answer likes viewable" ON public.question_answer_likes;
DROP POLICY IF EXISTS "Users manage own question answer likes" ON public.question_answer_likes;
DROP POLICY IF EXISTS question_answer_likes_own_read ON public.question_answer_likes;
CREATE POLICY question_answer_likes_own_read
  ON public.question_answer_likes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON TABLE public.community_questions FROM anon, authenticated;
GRANT SELECT ON TABLE public.community_questions TO anon, authenticated;
GRANT INSERT (title, description, category, location_id, tags)
  ON TABLE public.community_questions TO authenticated;
GRANT UPDATE (title, description, category, content, tags)
  ON TABLE public.community_questions TO authenticated;
GRANT DELETE ON TABLE public.community_questions TO authenticated;

REVOKE ALL ON TABLE public.question_answers FROM anon, authenticated;
GRANT SELECT ON TABLE public.question_answers TO anon, authenticated;
GRANT INSERT (question_id, content, professional_id, business_id)
  ON TABLE public.question_answers TO authenticated;
GRANT UPDATE (content, professional_id, business_id)
  ON TABLE public.question_answers TO authenticated;
GRANT DELETE ON TABLE public.question_answers TO authenticated;

REVOKE ALL ON TABLE public.question_answer_likes FROM anon, authenticated;
GRANT SELECT ON TABLE public.question_answer_likes TO authenticated;

COMMENT ON FUNCTION private.guard_community_question_write() IS
  'Derives active profile identity and enforces territorial eligibility, immutable ownership and anti-flood limits.';
COMMENT ON FUNCTION private.guard_question_answer_write() IS
  'Derives answer author identity and enforces territorial eligibility, immutable ownership and anti-flood limits.';
COMMENT ON FUNCTION public.toggle_question_answer_like(UUID) IS
  'Authenticated atomic answer-like toggle with duplicate and flood protection.';
COMMENT ON FUNCTION public.mark_best_answer(UUID, UUID) IS
  'Authenticated question-owner/admin broker for atomic best-answer selection.';
