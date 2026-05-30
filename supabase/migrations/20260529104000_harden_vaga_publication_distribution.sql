-- Persist distribution state for approved job listings.

ALTER TABLE public.vagas
  ADD COLUMN IF NOT EXISTS feed_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;

ALTER TABLE public.vagas
  ADD COLUMN IF NOT EXISTS matching_notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_vagas_feed_post_id
  ON public.vagas (feed_post_id)
  WHERE feed_post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vagas_matching_notified_at
  ON public.vagas (matching_notified_at)
  WHERE matching_notified_at IS NOT NULL;
