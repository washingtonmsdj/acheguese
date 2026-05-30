-- Event engagement persistence: reviews and reminder preferences.

CREATE TABLE IF NOT EXISTS public.event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  reviewer_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (char_length(trim(comment)) BETWEEN 10 AND 600),
  helpful_count INTEGER NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_event_review_per_profile UNIQUE (event_id, reviewer_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_event_reviews_event_id
  ON public.event_reviews(event_id, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_event_reviews_reviewer_profile_id
  ON public.event_reviews(reviewer_profile_id, created_at DESC);

DROP TRIGGER IF EXISTS update_event_reviews_updated_at ON public.event_reviews;
CREATE TRIGGER update_event_reviews_updated_at
  BEFORE UPDATE ON public.event_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.guard_event_review_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    IF NEW.event_id <> OLD.event_id
      OR NEW.reviewer_profile_id <> OLD.reviewer_profile_id
      OR NEW.helpful_count <> OLD.helpful_count
      OR NEW.status <> OLD.status
    THEN
      RAISE EXCEPTION 'event_review_protected_columns';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_event_review_user_update ON public.event_reviews;
CREATE TRIGGER guard_event_review_user_update
  BEFORE UPDATE ON public.event_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_event_review_user_update();

ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active event reviews are public" ON public.event_reviews;
CREATE POLICY "Active event reviews are public"
  ON public.event_reviews
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_reviews.event_id
    )
  );

DROP POLICY IF EXISTS "Participants create own event reviews" ON public.event_reviews;
CREATE POLICY "Participants create own event reviews"
  ON public.event_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_reviews.event_id
        AND e.date < now()
    )
    AND EXISTS (
      SELECT 1
      FROM public.event_participants ep
      WHERE ep.event_id = event_reviews.event_id
        AND ep.profile_id = event_reviews.reviewer_profile_id
    )
  );

DROP POLICY IF EXISTS "Participants update own event reviews" ON public.event_reviews;
CREATE POLICY "Participants update own event reviews"
  ON public.event_reviews
  FOR UPDATE
  TO authenticated
  USING (
    reviewer_profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    reviewer_profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
    AND status = 'active'
    AND EXISTS (
      SELECT 1
      FROM public.event_participants ep
      WHERE ep.event_id = event_reviews.event_id
        AND ep.profile_id = event_reviews.reviewer_profile_id
    )
  );

DROP POLICY IF EXISTS "Participants delete own event reviews" ON public.event_reviews;
CREATE POLICY "Participants delete own event reviews"
  ON public.event_reviews
  FOR DELETE
  TO authenticated
  USING (
    reviewer_profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.event_review_helpfulness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.event_reviews(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_event_review_helpfulness UNIQUE (review_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_event_review_helpfulness_review_id
  ON public.event_review_helpfulness(review_id);

ALTER TABLE public.event_review_helpfulness ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Event review helpfulness is visible to authenticated users" ON public.event_review_helpfulness;
CREATE POLICY "Event review helpfulness is visible to authenticated users"
  ON public.event_review_helpfulness
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Profiles manage own event review helpfulness" ON public.event_review_helpfulness;
CREATE POLICY "Profiles manage own event review helpfulness"
  ON public.event_review_helpfulness
  FOR ALL
  TO authenticated
  USING (
    profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.event_reviews er
      WHERE er.id = event_review_helpfulness.review_id
        AND er.status = 'active'
    )
  );

CREATE OR REPLACE FUNCTION public.sync_event_review_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.event_reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE public.event_reviews
    SET helpful_count = GREATEST(helpful_count - 1, 0)
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_event_review_helpful_count_insert ON public.event_review_helpfulness;
CREATE TRIGGER sync_event_review_helpful_count_insert
  AFTER INSERT ON public.event_review_helpfulness
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_event_review_helpful_count();

DROP TRIGGER IF EXISTS sync_event_review_helpful_count_delete ON public.event_review_helpfulness;
CREATE TRIGGER sync_event_review_helpful_count_delete
  AFTER DELETE ON public.event_review_helpfulness
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_event_review_helpful_count();

CREATE TABLE IF NOT EXISTS public.event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_time TEXT NOT NULL CHECK (reminder_time IN ('1hour', '1day', '1week')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_event_reminder_time UNIQUE (event_id, profile_id, reminder_time)
);

CREATE INDEX IF NOT EXISTS idx_event_reminders_profile_event
  ON public.event_reminders(profile_id, event_id);

ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles manage own event reminders" ON public.event_reminders;
CREATE POLICY "Profiles manage own event reminders"
  ON public.event_reminders
  FOR ALL
  TO authenticated
  USING (
    profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_reminders.event_id
        AND e.status IN ('upcoming', 'ongoing')
    )
  );

COMMENT ON TABLE public.event_reviews IS 'Avaliacoes verificaveis de eventos, vinculadas ao perfil participante.';
COMMENT ON TABLE public.event_review_helpfulness IS 'Votos de utilidade para avaliacoes de eventos, com unicidade por perfil.';
COMMENT ON TABLE public.event_reminders IS 'Preferencias de lembrete de eventos por perfil.';

CREATE TABLE IF NOT EXISTS public.event_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_event_favorite UNIQUE (event_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_event_favorites_profile_id
  ON public.event_favorites(profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_favorites_event_id
  ON public.event_favorites(event_id);

ALTER TABLE public.event_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles manage own event favorites" ON public.event_favorites;
CREATE POLICY "Profiles manage own event favorites"
  ON public.event_favorites
  FOR ALL
  TO authenticated
  USING (
    profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_favorites.event_id
        AND e.status IN ('upcoming', 'ongoing')
    )
  );

COMMENT ON TABLE public.event_favorites IS 'Favoritos de eventos por perfil.';
