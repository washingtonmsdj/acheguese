-- Restore event save/favorite persistence under the canonical saved-items naming.
-- The retired public.event_favorites table was proven empty before removal, so
-- this creates a clean authority instead of resurrecting the legacy table.

CREATE TABLE IF NOT EXISTS public.event_saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_saved_items_event_profile_key UNIQUE (event_id, profile_id)
);

CREATE INDEX IF NOT EXISTS event_saved_items_profile_created_idx
  ON public.event_saved_items(profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS event_saved_items_event_idx
  ON public.event_saved_items(event_id);

ALTER TABLE public.event_saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_saved_items FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.event_saved_items
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.event_saved_items
  TO authenticated;

DROP POLICY IF EXISTS event_saved_items_select_own
  ON public.event_saved_items;
CREATE POLICY event_saved_items_select_own
  ON public.event_saved_items
  FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS event_saved_items_insert_own
  ON public.event_saved_items;
CREATE POLICY event_saved_items_insert_own
  ON public.event_saved_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_saved_items.event_id
    )
  );

DROP POLICY IF EXISTS event_saved_items_delete_own
  ON public.event_saved_items;
CREATE POLICY event_saved_items_delete_own
  ON public.event_saved_items
  FOR DELETE
  TO authenticated
  USING (
    profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = (SELECT auth.uid())
    )
  );

COMMENT ON TABLE public.event_saved_items IS
  'Eventos salvos por perfil. Autoridade canônica que substitui o event_favorites aposentado.';
