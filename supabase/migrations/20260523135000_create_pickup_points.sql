-- Canonical admin-managed pickup points for mobility operations.
-- Scope is always territorial through locations.location_id; no launch-city defaults.

CREATE TABLE IF NOT EXISTS public.pickup_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) >= 2),
  description text,
  address text NOT NULL CHECK (char_length(trim(address)) >= 3),
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  type text NOT NULL DEFAULT 'bus_stop' CHECK (
    type IN ('bus_stop', 'landmark', 'square', 'school', 'church', 'commercial', 'other')
  ),
  capacity integer NOT NULL DEFAULT 1 CHECK (capacity > 0),
  has_shelter boolean NOT NULL DEFAULT false,
  has_bench boolean NOT NULL DEFAULT false,
  has_lighting boolean NOT NULL DEFAULT false,
  accessibility boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  photo_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pickup_points_location_id ON public.pickup_points(location_id);
CREATE INDEX IF NOT EXISTS idx_pickup_points_active ON public.pickup_points(active);
CREATE INDEX IF NOT EXISTS idx_pickup_points_type ON public.pickup_points(type);
CREATE INDEX IF NOT EXISTS idx_pickup_points_location_active ON public.pickup_points(location_id, active);

DROP TRIGGER IF EXISTS update_pickup_points_updated_at ON public.pickup_points;
CREATE TRIGGER update_pickup_points_updated_at
  BEFORE UPDATE ON public.pickup_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.pickup_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read pickup points" ON public.pickup_points;
CREATE POLICY "Admins can read pickup points"
  ON public.pickup_points FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert pickup points" ON public.pickup_points;
CREATE POLICY "Admins can insert pickup points"
  ON public.pickup_points FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update pickup points" ON public.pickup_points;
CREATE POLICY "Admins can update pickup points"
  ON public.pickup_points FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete pickup points" ON public.pickup_points;
CREATE POLICY "Admins can delete pickup points"
  ON public.pickup_points FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pickup_points TO authenticated;
