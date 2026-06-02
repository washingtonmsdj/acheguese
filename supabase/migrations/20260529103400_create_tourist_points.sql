CREATE TABLE IF NOT EXISTS public.tourist_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  short_description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  tags TEXT[] NOT NULL DEFAULT '{}',
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  address TEXT,
  address_text TEXT,
  latitude DECIMAL(10,7) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude DECIMAL(10,7) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  point GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
    CASE
      WHEN latitude IS NOT NULL AND longitude IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography
      ELSE NULL
    END
  ) STORED,
  photo_url TEXT,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}',
  visiting_hours TEXT,
  opening_hours TEXT,
  entry_fee TEXT,
  price_type TEXT NOT NULL DEFAULT 'free',
  price_text TEXT,
  website TEXT,
  official_url TEXT,
  phone TEXT,
  accessibility BOOLEAN NOT NULL DEFAULT false,
  accessibility_level TEXT NOT NULL DEFAULT 'unknown',
  accessibility_description TEXT,
  accessibility_notes TEXT,
  has_parking BOOLEAN NOT NULL DEFAULT false,
  has_restaurant BOOLEAN NOT NULL DEFAULT false,
  has_guide BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  observations TEXT,
  nearby_point_ids UUID[] NOT NULL DEFAULT '{}',
  icon_emoji TEXT NOT NULL DEFAULT 'pin',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tourist_points_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT tourist_points_price_type_check CHECK (price_type IN ('free', 'paid', 'range', 'consult')),
  CONSTRAINT tourist_points_slug_location_unique UNIQUE (location_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_tourist_points_status
  ON public.tourist_points(status);
CREATE INDEX IF NOT EXISTS idx_tourist_points_location_status
  ON public.tourist_points(location_id, status)
  WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tourist_points_slug
  ON public.tourist_points(slug);
CREATE INDEX IF NOT EXISTS idx_tourist_points_featured
  ON public.tourist_points(is_featured, display_order)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_tourist_points_point
  ON public.tourist_points
  USING GIST (point)
  WHERE point IS NOT NULL;

DROP TRIGGER IF EXISTS update_tourist_points_updated_at ON public.tourist_points;
CREATE TRIGGER update_tourist_points_updated_at
  BEFORE UPDATE ON public.tourist_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tourist_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published tourist points public read" ON public.tourist_points;
CREATE POLICY "Published tourist points public read"
  ON public.tourist_points
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins manage tourist points" ON public.tourist_points;
CREATE POLICY "Admins manage tourist points"
  ON public.tourist_points
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.tourist_point_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_point_id UUID NOT NULL REFERENCES public.tourist_points(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tourist_point_media_point
  ON public.tourist_point_media(tourist_point_id, display_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tourist_point_media_one_cover
  ON public.tourist_point_media(tourist_point_id)
  WHERE is_cover = true;

ALTER TABLE public.tourist_point_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tourist point media public read" ON public.tourist_point_media;
CREATE POLICY "Tourist point media public read"
  ON public.tourist_point_media
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tourist_points tp
      WHERE tp.id = tourist_point_media.tourist_point_id
        AND tp.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Admins manage tourist point media" ON public.tourist_point_media;
CREATE POLICY "Admins manage tourist point media"
  ON public.tourist_point_media
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

COMMENT ON TABLE public.tourist_points IS 'Canonical tourist attractions and points of interest.';
COMMENT ON TABLE public.tourist_point_media IS 'Media assets attached to tourist points.';
