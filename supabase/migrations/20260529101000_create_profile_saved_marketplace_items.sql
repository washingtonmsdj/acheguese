-- Persistencia server-side para favoritos/salvos de marketplace.

CREATE TABLE IF NOT EXISTS public.classified_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id UUID NOT NULL REFERENCES public.classifieds(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_classified_favorite UNIQUE (classified_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_classified_favorites_profile_id
  ON public.classified_favorites(profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_classified_favorites_classified_id
  ON public.classified_favorites(classified_id);

ALTER TABLE public.classified_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles manage own classified favorites" ON public.classified_favorites;
CREATE POLICY "Profiles manage own classified favorites"
  ON public.classified_favorites
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
      FROM public.classifieds c
      WHERE c.id = classified_favorites.classified_id
    )
  );

CREATE TABLE IF NOT EXISTS public.vaga_saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id UUID NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_vaga_saved_item UNIQUE (vaga_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_vaga_saved_items_profile_id
  ON public.vaga_saved_items(profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vaga_saved_items_vaga_id
  ON public.vaga_saved_items(vaga_id);

ALTER TABLE public.vaga_saved_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles manage own saved vagas" ON public.vaga_saved_items;
CREATE POLICY "Profiles manage own saved vagas"
  ON public.vaga_saved_items
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
      FROM public.vagas v
      WHERE v.id = vaga_saved_items.vaga_id
    )
  );

COMMENT ON TABLE public.classified_favorites IS 'Favoritos de classificados por perfil.';
COMMENT ON TABLE public.vaga_saved_items IS 'Vagas salvas por perfil.';
