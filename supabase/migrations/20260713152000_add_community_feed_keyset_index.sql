-- Deterministic keyset pagination for the high-volume public community feed.
CREATE INDEX IF NOT EXISTS idx_posts_community_feed_location_visible_created_id
  ON public.posts (location_id, created_at DESC, id DESC)
  WHERE is_published = TRUE
    AND is_hidden = FALSE
    AND is_removed = FALSE;
