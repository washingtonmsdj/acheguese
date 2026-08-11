-- ADDITIVE compatibility window for Community Poll.
--
-- This migration does not claim the historical creation of
-- public.community_poll_votes. It establishes a reproducible transitional
-- schema from either of the two supported starting states:
--   1. the current remote legacy table; or
--   2. a future replay where that untracked legacy table is absent.
--
-- Canonical data is normalized in:
--   community_polls -> community_poll_options -> community_poll_votes
-- Legacy community_polls.options and community_poll_options.votes are
-- database-maintained compatibility projections until a later CLEANUP.

DO $poll_additive_schema_preflight$
DECLARE
  v_votes_exists BOOLEAN := to_regclass('public.community_poll_votes') IS NOT NULL;
BEGIN
  IF to_regclass('public.posts') IS NULL
     OR to_regclass('public.profiles') IS NULL
     OR to_regclass('public.community_polls') IS NULL
     OR to_regclass('public.community_poll_options') IS NULL
     OR to_regclass('auth.users') IS NULL THEN
    RAISE EXCEPTION
      'POLL_ADDITIVE_BLOCKED: required Post, Profile, Poll or Auth tables are missing';
  END IF;

  IF v_votes_exists THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_class relation
      JOIN pg_catalog.pg_namespace namespace
        ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname = 'public'
        AND relation.relname = 'community_poll_votes'
        AND relation.relkind IN ('r', 'p')
    ) THEN
      RAISE EXCEPTION
        'POLL_ADDITIVE_BLOCKED: community_poll_votes is not a table';
    END IF;

    IF EXISTS (
      SELECT expected.column_name
      FROM (
        VALUES
          ('id', 'uuid', FALSE),
          ('poll_id', 'uuid', FALSE),
          ('user_id', 'uuid', FALSE),
          ('option_id', 'uuid', FALSE),
          ('created_at', 'timestamp with time zone', FALSE)
      ) AS expected(column_name, data_type, is_nullable)
      LEFT JOIN information_schema.columns actual
        ON actual.table_schema = 'public'
       AND actual.table_name = 'community_poll_votes'
       AND actual.column_name = expected.column_name
      WHERE actual.column_name IS NULL
         OR actual.data_type <> expected.data_type
         OR (actual.is_nullable = 'YES') <> expected.is_nullable
    ) THEN
      RAISE EXCEPTION
        'POLL_ADDITIVE_BLOCKED: legacy community_poll_votes columns differ from the supported contract';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'community_poll_votes'
        AND column_name = 'profile_id'
        AND (data_type <> 'uuid' OR is_nullable <> 'YES')
    ) THEN
      RAISE EXCEPTION
        'POLL_ADDITIVE_BLOCKED: existing profile_id is not nullable UUID';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_constraint constraint_row
      WHERE constraint_row.conrelid = 'public.community_poll_votes'::regclass
        AND constraint_row.conname = 'community_poll_votes_poll_id_fkey'
        AND pg_catalog.pg_get_constraintdef(constraint_row.oid, TRUE) =
          'FOREIGN KEY (poll_id) REFERENCES community_polls(id) ON DELETE CASCADE'
    ) OR NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_constraint constraint_row
      WHERE constraint_row.conrelid = 'public.community_poll_votes'::regclass
        AND constraint_row.conname = 'community_poll_votes_option_id_fkey'
        AND pg_catalog.pg_get_constraintdef(constraint_row.oid, TRUE) =
          'FOREIGN KEY (option_id) REFERENCES community_poll_options(id) ON DELETE CASCADE'
    ) OR NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_constraint constraint_row
      WHERE constraint_row.conrelid = 'public.community_poll_votes'::regclass
        AND constraint_row.conname = 'community_poll_votes_user_id_fkey'
        AND pg_catalog.pg_get_constraintdef(constraint_row.oid, TRUE) =
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE'
    ) THEN
      RAISE EXCEPTION
        'POLL_ADDITIVE_BLOCKED: legacy community_poll_votes foreign keys differ from the supported contract';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_constraint constraint_row
      WHERE constraint_row.conrelid = 'public.community_poll_votes'::regclass
        AND constraint_row.conname = 'unique_poll_vote'
        AND pg_catalog.pg_get_constraintdef(constraint_row.oid, TRUE) =
          'UNIQUE (poll_id, user_id)'
    ) THEN
      RAISE EXCEPTION
        'POLL_ADDITIVE_BLOCKED: expected legacy unique_poll_vote constraint is missing or incompatible';
    END IF;
  END IF;
END;
$poll_additive_schema_preflight$;

DO $poll_additive_data_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.posts post
    WHERE pg_catalog.jsonb_typeof(post.content_payload) = 'object'
      AND pg_catalog.jsonb_typeof(post.content_payload->'poll') = 'object'
      AND (
        post.content_payload->'poll' ? 'question'
        OR post.content_payload->'poll' ? 'options'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.community_polls poll
        WHERE poll.post_id = post.id
      )
  ) THEN
    RAISE EXCEPTION
      'POLL_ADDITIVE_BLOCKED: legacy content_payload Polls require an explicit backfill';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_polls
    GROUP BY post_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'POLL_ADDITIVE_BLOCKED: duplicate community_polls.post_id rows';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_poll_options
    GROUP BY poll_id, position
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'POLL_ADDITIVE_BLOCKED: duplicate Poll option positions';
  END IF;

  IF to_regclass('public.community_poll_votes') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.community_poll_votes vote
      JOIN public.community_poll_options option
        ON option.id = vote.option_id
      WHERE option.poll_id <> vote.poll_id
    ) THEN
      RAISE EXCEPTION
        'POLL_ADDITIVE_BLOCKED: a Vote references an Option from another Poll';
    END IF;
  END IF;
END;
$poll_additive_data_preflight$;

ALTER TABLE public.community_polls
  ADD COLUMN IF NOT EXISTS allow_multiple_choice BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $poll_additive_poll_column_contract$
BEGIN
  IF EXISTS (
    SELECT expected.column_name
    FROM (
      VALUES
        ('allow_multiple_choice', 'boolean', 'NO'),
        ('allow_comments', 'boolean', 'NO'),
        ('updated_at', 'timestamp with time zone', 'NO')
    ) AS expected(column_name, data_type, is_nullable)
    LEFT JOIN information_schema.columns actual
      ON actual.table_schema = 'public'
     AND actual.table_name = 'community_polls'
     AND actual.column_name = expected.column_name
    WHERE actual.column_name IS NULL
       OR actual.data_type <> expected.data_type
       OR actual.is_nullable <> expected.is_nullable
  ) THEN
    RAISE EXCEPTION
      'POLL_ADDITIVE_BLOCKED: additive community_polls columns have an incompatible definition';
  END IF;
END;
$poll_additive_poll_column_contract$;

DO $poll_votes_reconciliation$
BEGIN
  IF to_regclass('public.community_poll_votes') IS NULL THEN
    -- Reconciliation boundary, not a claim of historical provenance.
    CREATE TABLE public.community_poll_votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      poll_id UUID NOT NULL
        REFERENCES public.community_polls(id) ON DELETE CASCADE,
      user_id UUID NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,
      option_id UUID NOT NULL
        REFERENCES public.community_poll_options(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Poll votes viewable by authenticated"
      ON public.community_poll_votes FOR SELECT TO authenticated
      USING (user_id = (SELECT auth.uid()));

    CREATE POLICY "Users manage own poll votes"
      ON public.community_poll_votes FOR ALL TO authenticated
      USING (user_id = (SELECT auth.uid()))
      WITH CHECK (user_id = (SELECT auth.uid()));

    GRANT SELECT, INSERT, UPDATE, DELETE
      ON TABLE public.community_poll_votes TO authenticated, service_role;
  END IF;
END;
$poll_votes_reconciliation$;

ALTER TABLE public.community_poll_votes
  ADD COLUMN IF NOT EXISTS profile_id UUID;

DO $poll_profile_column_contract$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_poll_votes'
      AND column_name = 'profile_id'
      AND data_type = 'uuid'
      AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION
      'POLL_ADDITIVE_BLOCKED: profile_id must be a nullable UUID during compatibility';
  END IF;
END;
$poll_profile_column_contract$;

ALTER TABLE public.community_poll_votes
  ADD CONSTRAINT community_poll_votes_profile_id_fkey
  FOREIGN KEY (profile_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE
  NOT VALID;

CREATE UNIQUE INDEX uq_community_polls_post_id
  ON public.community_polls (post_id);
CREATE UNIQUE INDEX uq_community_poll_options_poll_position
  ON public.community_poll_options (poll_id, position);
CREATE UNIQUE INDEX uq_community_poll_options_poll_id_id
  ON public.community_poll_options (poll_id, id);

ALTER TABLE public.community_poll_votes
  ADD CONSTRAINT community_poll_votes_poll_option_fkey
  FOREIGN KEY (poll_id, option_id)
  REFERENCES public.community_poll_options(poll_id, id)
  ON DELETE CASCADE
  NOT VALID;

CREATE INDEX idx_community_poll_votes_option_id
  ON public.community_poll_votes (option_id);
CREATE INDEX idx_community_poll_votes_profile_id
  ON public.community_poll_votes (profile_id)
  WHERE profile_id IS NOT NULL;

-- Compatibility uniqueness for browser clients that omit profile_id.
CREATE UNIQUE INDEX uq_community_poll_votes_legacy_user
  ON public.community_poll_votes (poll_id, user_id)
  WHERE profile_id IS NULL;

-- Canonical retry identity for profile-scoped and multiple-choice Votes.
CREATE UNIQUE INDEX uq_community_poll_votes_profile_option
  ON public.community_poll_votes (poll_id, profile_id, option_id)
  WHERE profile_id IS NOT NULL;

ALTER TABLE public.community_poll_votes
  DROP CONSTRAINT IF EXISTS unique_poll_vote;

COMMENT ON TABLE public.community_poll_votes IS
  'Canonical Poll Vote table established by a reconciliation migration; original remote provenance remains unresolved.';
COMMENT ON COLUMN public.community_polls.options IS
  'LEGACY compatibility projection maintained from community_poll_options until CLEANUP.';
COMMENT ON COLUMN public.community_poll_options.votes IS
  'LEGACY compatibility projection derived from community_poll_votes until CLEANUP.';
COMMENT ON COLUMN public.community_poll_votes.user_id IS
  'Authentication/audit identity. Canonical product ownership is profile_id after CUTOVER.';
COMMENT ON COLUMN public.community_poll_votes.profile_id IS
  'Nullable active-profile identity during the ADDITIVE compatibility window.';

-- Internal projection writer. Browser-supplied counters are never authoritative.
CREATE OR REPLACE FUNCTION private.refresh_community_poll_legacy_snapshot(
  p_poll_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_legacy_options JSONB;
BEGIN
  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'id', option.id,
        'text', option.text,
        'votes', option.votes,
        'position', option.position
      )
      ORDER BY option.position, option.id
    ),
    '[]'::jsonb
  )
  INTO v_legacy_options
  FROM public.community_poll_options option
  WHERE option.poll_id = p_poll_id;

  UPDATE public.community_polls poll
  SET
    options = v_legacy_options,
    updated_at = CASE
      WHEN poll.options IS DISTINCT FROM v_legacy_options THEN now()
      ELSE poll.updated_at
    END
  WHERE poll.id = p_poll_id;
END;
$function$;

REVOKE ALL ON FUNCTION private.refresh_community_poll_legacy_snapshot(UUID)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.enforce_community_poll_legacy_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'id', option.id,
        'text', option.text,
        'votes', option.votes,
        'position', option.position
      )
      ORDER BY option.position, option.id
    ),
    '[]'::jsonb
  )
  INTO NEW.options
  FROM public.community_poll_options option
  WHERE option.poll_id = NEW.id;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.enforce_community_poll_legacy_snapshot()
  FROM PUBLIC, anon, authenticated, service_role;

-- The old browser may still submit this UPDATE, but the database replaces the
-- supplied value with the projection derived from normalized Options.
CREATE TRIGGER community_polls_derive_legacy_snapshot_on_update
BEFORE UPDATE OF options ON public.community_polls
FOR EACH ROW
EXECUTE FUNCTION private.enforce_community_poll_legacy_snapshot();

CREATE OR REPLACE FUNCTION private.enforce_community_poll_option_vote_projection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.votes := (
    SELECT count(*)::INTEGER
    FROM public.community_poll_votes vote
    WHERE vote.option_id = NEW.id
  );
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.enforce_community_poll_option_vote_projection()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER community_poll_options_derive_votes_on_insert
BEFORE INSERT ON public.community_poll_options
FOR EACH ROW
EXECUTE FUNCTION private.enforce_community_poll_option_vote_projection();

CREATE TRIGGER community_poll_options_derive_votes_on_update
BEFORE UPDATE OF votes ON public.community_poll_options
FOR EACH ROW
EXECUTE FUNCTION private.enforce_community_poll_option_vote_projection();

CREATE OR REPLACE FUNCTION private.sync_community_poll_option_legacy_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM private.refresh_community_poll_legacy_snapshot(OLD.poll_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.poll_id IS DISTINCT FROM NEW.poll_id THEN
    PERFORM private.refresh_community_poll_legacy_snapshot(OLD.poll_id);
  END IF;

  PERFORM private.refresh_community_poll_legacy_snapshot(NEW.poll_id);
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.sync_community_poll_option_legacy_snapshot()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER community_poll_options_sync_snapshot_on_insert_delete
AFTER INSERT OR DELETE ON public.community_poll_options
FOR EACH ROW
EXECUTE FUNCTION private.sync_community_poll_option_legacy_snapshot();

CREATE TRIGGER community_poll_options_sync_snapshot_on_content_update
AFTER UPDATE OF poll_id, text, position ON public.community_poll_options
FOR EACH ROW
EXECUTE FUNCTION private.sync_community_poll_option_legacy_snapshot();

CREATE OR REPLACE FUNCTION private.sync_community_poll_vote_legacy_projection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_poll_ids UUID[];
  v_poll_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_poll_ids := ARRAY[NEW.poll_id];
  ELSIF TG_OP = 'DELETE' THEN
    v_poll_ids := ARRAY[OLD.poll_id];
  ELSE
    v_poll_ids := ARRAY[OLD.poll_id, NEW.poll_id];
  END IF;

  PERFORM 1
  FROM public.community_polls poll
  WHERE poll.id = ANY(v_poll_ids)
  ORDER BY poll.id
  FOR UPDATE;

  FOR v_poll_id IN
    SELECT DISTINCT affected_poll_id
    FROM pg_catalog.unnest(v_poll_ids) AS affected_poll_id
    WHERE affected_poll_id IS NOT NULL
    ORDER BY affected_poll_id
  LOOP
    UPDATE public.community_poll_options option
    SET votes = (
      SELECT count(*)::INTEGER
      FROM public.community_poll_votes vote
      WHERE vote.option_id = option.id
    )
    WHERE option.poll_id = v_poll_id
      AND option.votes IS DISTINCT FROM (
        SELECT count(*)::INTEGER
        FROM public.community_poll_votes vote
        WHERE vote.option_id = option.id
      );

    PERFORM private.refresh_community_poll_legacy_snapshot(v_poll_id);
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.sync_community_poll_vote_legacy_projection()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER community_poll_votes_sync_legacy_on_insert_delete
AFTER INSERT OR DELETE ON public.community_poll_votes
FOR EACH ROW
EXECUTE FUNCTION private.sync_community_poll_vote_legacy_projection();

CREATE TRIGGER community_poll_votes_sync_legacy_on_target_update
AFTER UPDATE OF poll_id, option_id ON public.community_poll_votes
FOR EACH ROW
EXECUTE FUNCTION private.sync_community_poll_vote_legacy_projection();

-- Rebuild compatibility projections from normalized data already present.
DO $poll_legacy_projection_backfill$
DECLARE
  v_poll_id UUID;
BEGIN
  FOR v_poll_id IN
    SELECT poll.id
    FROM public.community_polls poll
    ORDER BY poll.id
  LOOP
    UPDATE public.community_poll_options option
    SET votes = (
      SELECT count(*)::INTEGER
      FROM public.community_poll_votes vote
      WHERE vote.option_id = option.id
    )
    WHERE option.poll_id = v_poll_id;

    PERFORM private.refresh_community_poll_legacy_snapshot(v_poll_id);
  END LOOP;
END;
$poll_legacy_projection_backfill$;

CREATE OR REPLACE FUNCTION private.build_community_poll_dto(
  p_poll_id UUID,
  p_profile_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT pg_catalog.jsonb_build_object(
    'id', poll.id,
    'post_id', poll.post_id,
    'question', poll.question,
    'allow_multiple_choice', poll.allow_multiple_choice,
    'allow_comments', poll.allow_comments,
    'expires_at', poll.expires_at,
    'created_at', poll.created_at,
    'updated_at', poll.updated_at,
    'options', COALESCE((
      SELECT pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', option.id,
          'poll_id', option.poll_id,
          'text', option.text,
          'position', option.position,
          'votes', (
            SELECT count(*)
            FROM public.community_poll_votes vote_count
            WHERE vote_count.option_id = option.id
          ),
          'created_at', poll.created_at
        )
        ORDER BY option.position, option.id
      )
      FROM public.community_poll_options option
      WHERE option.poll_id = poll.id
    ), '[]'::jsonb),
    'total_votes', (
      SELECT count(*)
      FROM public.community_poll_votes vote_count
      WHERE vote_count.poll_id = poll.id
    ),
    'user_voted', EXISTS (
      SELECT 1
      FROM public.community_poll_votes own_vote
      WHERE own_vote.poll_id = poll.id
        AND (
          own_vote.profile_id = p_profile_id
          OR (
            own_vote.profile_id IS NULL
            AND own_vote.user_id = p_user_id
          )
        )
    ),
    'user_vote_option_id', (
      SELECT own_vote.option_id
      FROM public.community_poll_votes own_vote
      WHERE own_vote.poll_id = poll.id
        AND (
          own_vote.profile_id = p_profile_id
          OR (
            own_vote.profile_id IS NULL
            AND own_vote.user_id = p_user_id
          )
        )
      ORDER BY (own_vote.profile_id IS NOT NULL) DESC,
               own_vote.created_at,
               own_vote.id
      LIMIT 1
    )
  )
  FROM public.community_polls poll
  WHERE poll.id = p_poll_id;
$function$;

REVOKE ALL ON FUNCTION private.build_community_poll_dto(UUID, UUID, UUID)
  FROM PUBLIC, anon, authenticated, service_role;

-- security-authority: public-rpc public.get_community_poll_for_post
CREATE OR REPLACE FUNCTION public.get_community_poll_for_post(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_poll_id UUID;
  v_profile_id UUID;
  v_user_id UUID := (SELECT auth.uid());
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.posts post
    WHERE post.id = p_post_id
      AND (
        (
          post.is_published = TRUE
          AND post.is_hidden = FALSE
          AND post.is_removed = FALSE
        )
        OR private.auth_owns_active_profile(post.author_profile_id)
        OR COALESCE(private.is_admin_user(v_user_id), FALSE)
      )
  ) THEN
    RETURN NULL;
  END IF;

  SELECT poll.id
  INTO v_poll_id
  FROM public.community_polls poll
  WHERE poll.post_id = p_post_id;

  IF v_poll_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_user_id IS NOT NULL THEN
    v_profile_id := private.current_active_profile_id();
  END IF;

  RETURN private.build_community_poll_dto(
    v_poll_id,
    v_profile_id,
    v_user_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_community_poll_for_post(UUID)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_community_poll_for_post(UUID)
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_post_with_poll(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_profile_id UUID;
  v_location_id UUID;
  v_post_id UUID := gen_random_uuid();
  v_poll_id UUID := gen_random_uuid();
  v_question TEXT;
  v_options JSONB;
  v_option_count INTEGER;
  v_duration_days INTEGER;
  v_allow_multiple_choice BOOLEAN;
  v_allow_comments BOOLEAN;
  v_content_payload JSONB;
  v_post public.posts%ROWTYPE;
  v_recent_post_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF payload IS NULL OR pg_catalog.jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'invalid_poll_post_payload' USING ERRCODE = '22023';
  END IF;

  IF payload ? 'content_payload'
     AND payload->'content_payload' IS NOT NULL
     AND pg_catalog.jsonb_typeof(payload->'content_payload') <> 'object' THEN
    RAISE EXCEPTION 'invalid_poll_post_payload' USING ERRCODE = '22023';
  END IF;

  BEGIN
    v_profile_id := (payload->>'author_profile_id')::UUID;
    v_location_id := (payload->>'location_id')::UUID;
    v_duration_days := (payload->'poll'->>'duration_days')::INTEGER;
    v_allow_multiple_choice := COALESCE(
      (payload->'poll'->>'allow_multiple_choice')::BOOLEAN,
      FALSE
    );
    v_allow_comments := COALESCE(
      (payload->'poll'->>'allow_comments')::BOOLEAN,
      TRUE
    );
  EXCEPTION
    WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'invalid_poll_post_payload' USING ERRCODE = '22023';
  END;

  IF NOT private.auth_owns_active_profile(v_profile_id) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF NOT private.auth_has_verified_residence(v_profile_id, v_location_id) THEN
    RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.locations location
    WHERE location.id = v_location_id
      AND location.status::TEXT = 'active'
      AND location.type::TEXT IN ('city', 'district', 'neighborhood')
  ) THEN
    RAISE EXCEPTION 'invalid_location' USING ERRCODE = '22023';
  END IF;

  v_question := btrim(COALESCE(payload->'poll'->>'question', ''));
  v_options := payload->'poll'->'options';

  IF char_length(v_question) NOT BETWEEN 8 AND 500 THEN
    RAISE EXCEPTION 'invalid_poll_question' USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.jsonb_typeof(v_options) <> 'array' THEN
    RAISE EXCEPTION 'invalid_poll_options' USING ERRCODE = '22023';
  END IF;

  v_option_count := pg_catalog.jsonb_array_length(v_options);
  IF v_option_count NOT BETWEEN 2 AND 6 THEN
    RAISE EXCEPTION 'invalid_poll_option_count' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.jsonb_array_elements(v_options) AS option_entry(value)
    WHERE pg_catalog.jsonb_typeof(option_entry.value) <> 'string'
       OR char_length(btrim(option_entry.value #>> '{}')) NOT BETWEEN 1 AND 200
  ) THEN
    RAISE EXCEPTION 'invalid_poll_option' USING ERRCODE = '22023';
  END IF;

  IF (
    SELECT count(*)
    FROM (
      SELECT lower(btrim(option_entry.value #>> '{}'))
      FROM pg_catalog.jsonb_array_elements(v_options) AS option_entry(value)
      GROUP BY lower(btrim(option_entry.value #>> '{}'))
    ) unique_options
  ) <> v_option_count THEN
    RAISE EXCEPTION 'duplicate_poll_options' USING ERRCODE = '22023';
  END IF;

  IF v_duration_days NOT BETWEEN 1 AND 30 THEN
    RAISE EXCEPTION 'invalid_poll_duration' USING ERRCODE = '22023';
  END IF;

  IF char_length(btrim(COALESCE(payload->>'content', ''))) NOT BETWEEN 10 AND 5000 THEN
    RAISE EXCEPTION 'invalid_poll_post_content' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(payload->>'reach', 'neighborhood') NOT IN (
    'street', 'neighborhood', 'city'
  ) THEN
    RAISE EXCEPTION 'invalid_poll_post_reach' USING ERRCODE = '22023';
  END IF;

  IF char_length(COALESCE(payload->>'content_intent', '')) > 64 THEN
    RAISE EXCEPTION 'invalid_poll_post_intent' USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.jsonb_typeof(COALESCE(payload->'images', '[]'::jsonb)) <> 'array'
     OR pg_catalog.jsonb_array_length(COALESCE(payload->'images', '[]'::jsonb)) > 4
     OR EXISTS (
       SELECT 1
       FROM pg_catalog.jsonb_array_elements(
         COALESCE(payload->'images', '[]'::jsonb)
       ) AS image_entry(value)
       WHERE pg_catalog.jsonb_typeof(image_entry.value) <> 'string'
     ) THEN
    RAISE EXCEPTION 'invalid_poll_post_images' USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.jsonb_typeof(COALESCE(payload->'tags', '[]'::jsonb)) <> 'array'
     OR pg_catalog.jsonb_array_length(COALESCE(payload->'tags', '[]'::jsonb)) > 5
     OR EXISTS (
       SELECT 1
       FROM pg_catalog.jsonb_array_elements(
         COALESCE(payload->'tags', '[]'::jsonb)
       ) AS tag_entry(value)
       WHERE pg_catalog.jsonb_typeof(tag_entry.value) <> 'string'
         OR char_length(btrim(tag_entry.value #>> '{}')) NOT BETWEEN 1 AND 30
     ) THEN
    RAISE EXCEPTION 'invalid_poll_post_tags' USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.jsonb_typeof(
       COALESCE(payload->'distribution_channels', '[]'::jsonb)
     ) <> 'array'
     OR pg_catalog.jsonb_array_length(
       COALESCE(payload->'distribution_channels', '[]'::jsonb)
     ) > 8
     OR EXISTS (
       SELECT 1
       FROM pg_catalog.jsonb_array_elements(
         COALESCE(payload->'distribution_channels', '[]'::jsonb)
       ) AS channel_entry(value)
       WHERE pg_catalog.jsonb_typeof(channel_entry.value) <> 'string'
         OR char_length(btrim(channel_entry.value #>> '{}')) NOT BETWEEN 1 AND 40
     ) THEN
    RAISE EXCEPTION 'invalid_poll_distribution_channels' USING ERRCODE = '22023';
  END IF;

  v_content_payload := COALESCE(payload->'content_payload', '{}'::jsonb) - 'poll';
  v_content_payload := pg_catalog.jsonb_set(
    v_content_payload,
    '{poll}',
    pg_catalog.jsonb_build_object('poll_id', v_poll_id),
    TRUE
  );

  IF pg_catalog.octet_length(
       pg_catalog.convert_to(v_content_payload::TEXT, 'UTF8')
     ) > 16384 THEN
    RAISE EXCEPTION 'poll_content_payload_too_large' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('community_post_rate'),
    pg_catalog.hashtext(v_profile_id::TEXT)
  );

  SELECT count(*)
  INTO v_recent_post_count
  FROM public.posts post
  WHERE post.author_profile_id = v_profile_id
    AND post.created_at >= now() - interval '24 hours';

  IF v_recent_post_count >= 5 THEN
    RAISE EXCEPTION 'post_rate_limit_exceeded' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.posts (
    id,
    author_profile_id,
    content,
    type,
    location_id,
    reach,
    images,
    tags,
    content_intent,
    display_format,
    distribution_channels,
    content_payload,
    is_published
  ) VALUES (
    v_post_id,
    v_profile_id,
    payload->>'content',
    'enquete',
    v_location_id,
    COALESCE(NULLIF(payload->>'reach', ''), 'neighborhood'),
    COALESCE(payload->'images', '[]'::jsonb),
    COALESCE(payload->'tags', '[]'::jsonb),
    payload->>'content_intent',
    'poll_card',
    ARRAY(
      SELECT pg_catalog.jsonb_array_elements_text(
        COALESCE(payload->'distribution_channels', '[]'::jsonb)
      )
    ),
    v_content_payload,
    TRUE
  )
  RETURNING * INTO v_post;

  INSERT INTO public.community_polls (
    id,
    post_id,
    question,
    options,
    allow_multiple_choice,
    allow_comments,
    expires_at
  ) VALUES (
    v_poll_id,
    v_post_id,
    v_question,
    '[]'::jsonb,
    v_allow_multiple_choice,
    v_allow_comments,
    now() + pg_catalog.make_interval(days => v_duration_days)
  );

  INSERT INTO public.community_poll_options (poll_id, text, position)
  SELECT
    v_poll_id,
    btrim(option_entry.value),
    option_entry.ordinality::INTEGER - 1
  FROM pg_catalog.jsonb_array_elements_text(v_options)
    WITH ORDINALITY AS option_entry(value, ordinality);

  PERFORM private.refresh_community_poll_legacy_snapshot(v_poll_id);

  RETURN pg_catalog.to_jsonb(v_post);
END;
$function$;

REVOKE ALL ON FUNCTION public.create_post_with_poll(JSONB)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_post_with_poll(JSONB)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.cast_community_poll_vote(
  p_poll_id UUID,
  p_option_id UUID,
  p_profile_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_poll public.community_polls%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF NOT private.auth_owns_active_profile(p_profile_id) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  SELECT poll.*
  INTO v_poll
  FROM public.community_polls poll
  WHERE poll.id = p_poll_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'poll_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.posts post
    WHERE post.id = v_poll.post_id
      AND post.is_published = TRUE
      AND post.is_hidden = FALSE
      AND post.is_removed = FALSE
  ) THEN
    RAISE EXCEPTION 'poll_not_accessible' USING ERRCODE = '42501';
  END IF;

  IF v_poll.expires_at IS NOT NULL AND v_poll.expires_at <= now() THEN
    RAISE EXCEPTION 'poll_expired' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.community_poll_options option
    WHERE option.id = p_option_id
      AND option.poll_id = p_poll_id
  ) THEN
    RAISE EXCEPTION 'poll_option_not_found' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_poll_votes vote
    WHERE vote.poll_id = p_poll_id
      AND vote.option_id = p_option_id
      AND (
        vote.profile_id = p_profile_id
        OR (vote.profile_id IS NULL AND vote.user_id = v_user_id)
      )
  ) THEN
    RETURN private.build_community_poll_dto(
      p_poll_id,
      p_profile_id,
      v_user_id
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_poll_votes legacy_vote
    WHERE legacy_vote.poll_id = p_poll_id
      AND legacy_vote.user_id = v_user_id
      AND legacy_vote.profile_id IS NULL
  ) THEN
    RAISE EXCEPTION 'legacy_poll_vote_requires_backfill' USING ERRCODE = 'P0001';
  END IF;

  IF NOT v_poll.allow_multiple_choice
     AND EXISTS (
       SELECT 1
       FROM public.community_poll_votes vote
       WHERE vote.poll_id = p_poll_id
         AND vote.profile_id = p_profile_id
     ) THEN
    RAISE EXCEPTION 'poll_already_voted' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.community_poll_votes (
    poll_id,
    option_id,
    user_id,
    profile_id
  ) VALUES (
    p_poll_id,
    p_option_id,
    v_user_id,
    p_profile_id
  )
  ON CONFLICT (poll_id, profile_id, option_id)
    WHERE profile_id IS NOT NULL
  DO NOTHING;

  RETURN private.build_community_poll_dto(
    p_poll_id,
    p_profile_id,
    v_user_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.cast_community_poll_vote(UUID, UUID, UUID)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cast_community_poll_vote(UUID, UUID, UUID)
  TO authenticated;

COMMENT ON FUNCTION public.create_post_with_poll(JSONB) IS
  'Creates Post, Poll, normalized Options and compatibility projections atomically.';
COMMENT ON FUNCTION public.cast_community_poll_vote(UUID, UUID, UUID) IS
  'Casts an active-profile Vote and refreshes legacy projections in the same transaction.';
COMMENT ON FUNCTION public.get_community_poll_for_post(UUID) IS
  'Returns a visible canonical Poll DTO with derived counts and legacy Vote fallback.';

-- Preserve the legacy browser contract during ADDITIVE while preventing direct
-- callers from assigning the new profile_id column.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.community_polls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.community_poll_options TO authenticated;
GRANT SELECT ON TABLE public.community_polls TO anon;
GRANT SELECT ON TABLE public.community_poll_options TO anon;
GRANT ALL ON TABLE public.community_polls TO service_role;
GRANT ALL ON TABLE public.community_poll_options TO service_role;
GRANT ALL ON TABLE public.community_poll_votes TO service_role;

REVOKE ALL ON TABLE public.community_poll_votes FROM anon;
REVOKE INSERT, UPDATE ON TABLE public.community_poll_votes FROM authenticated;
GRANT SELECT, DELETE ON TABLE public.community_poll_votes TO authenticated;
GRANT INSERT (id, poll_id, user_id, option_id, created_at)
  ON public.community_poll_votes TO authenticated;
GRANT UPDATE (poll_id, user_id, option_id, created_at)
  ON public.community_poll_votes TO authenticated;

ALTER POLICY "Poll votes viewable by authenticated"
  ON public.community_poll_votes
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

ALTER POLICY "Users manage own poll votes"
  ON public.community_poll_votes
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND (
      profile_id IS NULL
      OR private.auth_owns_active_profile(profile_id)
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (
      profile_id IS NULL
      OR private.auth_owns_active_profile(profile_id)
    )
  );

CREATE POLICY "Authors manage poll options"
  ON public.community_poll_options FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.community_polls poll
      JOIN public.posts post ON post.id = poll.post_id
      JOIN public.profiles profile ON profile.id = post.author_profile_id
      WHERE poll.id = community_poll_options.poll_id
        AND profile.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.community_polls poll
      JOIN public.posts post ON post.id = poll.post_id
      JOIN public.profiles profile ON profile.id = post.author_profile_id
      WHERE poll.id = community_poll_options.poll_id
        AND profile.user_id = (SELECT auth.uid())
    )
  );

ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;
