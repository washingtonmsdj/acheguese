CREATE TABLE IF NOT EXISTS public.tourist_point_saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_point_id UUID NOT NULL REFERENCES public.tourist_points(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_tourist_point_saved_item UNIQUE (tourist_point_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_tourist_point_saved_items_profile_id
  ON public.tourist_point_saved_items(profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tourist_point_saved_items_tourist_point_id
  ON public.tourist_point_saved_items(tourist_point_id);

ALTER TABLE public.tourist_point_saved_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles read own saved tourist points" ON public.tourist_point_saved_items;
CREATE POLICY "Profiles read own saved tourist points"
  ON public.tourist_point_saved_items
  FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Profiles insert own saved published tourist points" ON public.tourist_point_saved_items;
CREATE POLICY "Profiles insert own saved published tourist points"
  ON public.tourist_point_saved_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.tourist_points tp
      WHERE tp.id = tourist_point_saved_items.tourist_point_id
        AND tp.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Profiles delete own saved tourist points" ON public.tourist_point_saved_items;
CREATE POLICY "Profiles delete own saved tourist points"
  ON public.tourist_point_saved_items
  FOR DELETE
  TO authenticated
  USING (
    profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.tourist_point_saved_items IS 'Pontos turisticos salvos por perfil.';
