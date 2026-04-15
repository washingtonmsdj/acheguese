-- Migration: Create city_metadata table
-- Description: Stores metadata about cities (population, districts, businesses, etc.)
-- This data can be updated by admins and AI

CREATE TABLE IF NOT EXISTS public.city_metadata (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  population INTEGER DEFAULT 0,
  districts_count INTEGER DEFAULT 0,
  active_businesses INTEGER DEFAULT 0,
  schools_count INTEGER DEFAULT 0,
  professionals_count INTEGER DEFAULT 0,
  bus_lines_count INTEGER DEFAULT 0,
  description TEXT,
  founded_year INTEGER,
  area_km2 NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state, city)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_city_metadata_state_city ON public.city_metadata(state, city);

-- Enable RLS
ALTER TABLE public.city_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "City metadata is publicly readable" ON public.city_metadata;
DROP POLICY IF EXISTS "Only admins can modify city metadata" ON public.city_metadata;

-- Policy: Anyone can read city metadata
CREATE POLICY "City metadata is publicly readable"
  ON public.city_metadata
  FOR SELECT
  TO public
  USING (true);

-- Policy: Only admins can insert/update city metadata
CREATE POLICY "Only admins can modify city metadata"
  ON public.city_metadata
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Insert default data for Salvador
INSERT INTO public.city_metadata (
  id,
  city,
  state,
  population,
  districts_count,
  active_businesses,
  schools_count,
  professionals_count,
  bus_lines_count,
  description,
  founded_year,
  area_km2
) VALUES (
  'salvador-ba',
  'salvador',
  'ba',
  2900000,
  163,
  45000,
  1200,
  8000,
  450,
  'Primeira capital do Brasil, patrimônio cultural da humanidade. Salvador é conhecida por sua rica história, cultura afro-brasileira vibrante e arquitetura colonial preservada.',
  1549,
  693.00
) ON CONFLICT (state, city) DO NOTHING;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_city_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_city_metadata_updated_at ON public.city_metadata;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_city_metadata_updated_at
  BEFORE UPDATE ON public.city_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_city_metadata_updated_at();

-- Add comment
COMMENT ON TABLE public.city_metadata IS 'Stores metadata about cities including population, districts, businesses count, etc. Can be updated by admins and AI.';
